const API_URL = "http://localhost:8000/api/infer-intent";

// URL NORMALIZATION 

function normalizeUrl(rawUrl) {
  const url = new URL(rawUrl);

  url.hash = "";

  const paramsToRemove = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
    "ref",
    "fbclid"
  ];

  paramsToRemove.forEach(param => {
    url.searchParams.delete(param);
  });

  return url.toString();
}

// TITLE HASH 

async function hashTitle(title) {
  const msgUint8 = new TextEncoder().encode(
    title.trim().toLowerCase()
  );

  const hashBuffer = await crypto.subtle.digest(
    "SHA-256",
    msgUint8
  );

  const hashArray = Array.from(new Uint8Array(hashBuffer));

  return hashArray
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

// SEARCH QUERY DETECTION 

function extractSearchQuery(urlString) {
  try {
    const url = new URL(urlString);

    if (
      url.hostname.includes("google.com") ||
      url.hostname.includes("bing.com") ||
      url.hostname.includes("duckduckgo.com")
    ) {
      return url.searchParams.get("q");
    }

    if (url.hostname.includes("youtube.com")) {
      return url.searchParams.get("search_query");
    }

  } catch (err) {
    return null;
  }

  return null;
}

// MAIN LOGIC 

async function processTab(tab) {

  if (!tab.url || tab.url.startsWith("chrome://")) return;

  /* detect search queries */
  const detectedQuery = extractSearchQuery(tab.url);

  if (detectedQuery) {
    await chrome.storage.local.set({
      lastSearchQuery: detectedQuery
    });

    return; // search page itself doesn't need inference
  }

  const { lastSearchQuery } =
    await chrome.storage.local.get("lastSearchQuery");

  const normalizedUrl = normalizeUrl(tab.url);
  const titleHash = await hashTitle(tab.title);

  const cacheKey =
    `intent:${normalizedUrl}:${titleHash}:${lastSearchQuery || "none"}`;

  const cache = await chrome.storage.local.get(cacheKey);

  if (cache[cacheKey]) {
    console.log("Extension cache hit:", cache[cacheKey]);
    return;
  }

  try {

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        url: tab.url,
        title: tab.title,
        searchQuery: lastSearchQuery || null
      })
    });

    const data = await response.json();

    await chrome.storage.local.set({
      [cacheKey]: data
    });

    console.log("Stored result:", data);

  } catch (err) {

    console.error("Backend request failed:", err);

  }

}

// EVENTS 

chrome.tabs.onUpdated.addListener(
  (tabId, changeInfo, tab) => {

    if (changeInfo.status === "complete") {
      processTab(tab);
    }

  }
);

chrome.tabs.onActivated.addListener(
  async (activeInfo) => {

    const tab = await chrome.tabs.get(activeInfo.tabId);
    processTab(tab);

  }
);
