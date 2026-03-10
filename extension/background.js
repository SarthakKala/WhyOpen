console.log("WhyOpen background started");

const API_URL = "http://localhost:8000/api/infer-intent";

let inferenceQueue = [];
let isProcessing = false;
let processingTabs = new Set();

/* ---------------- QUEUE MANAGEMENT ---------------- */

function enqueueTab(tab) {

  if (processingTabs.has(tab.id)) return;

  processingTabs.add(tab.id);
  inferenceQueue.push(tab);

  processQueue();

}

async function processQueue() {

  if (isProcessing) return;

  isProcessing = true;

  while (inferenceQueue.length > 0) {

    const tab = inferenceQueue.shift();

    await inferIntent(tab);

    processingTabs.delete(tab.id);

  }

  isProcessing = false;

}

/* ---------------- INFERENCE ---------------- */

async function inferIntent(tab) {

  if (!tab.url || tab.url.startsWith("chrome://")) return;

  const storage = await chrome.storage.local.get([
    "urlCache",
    "tabIntents",
    "lastSearchQuery"
  ]);

  const urlCache = storage.urlCache || {};
  const tabIntents = storage.tabIntents || {};
  const searchQuery = storage.lastSearchQuery || null;

  const cacheKey = `${tab.url}:${tab.title}:${searchQuery || "none"}`;

  if (urlCache[cacheKey]) {

    tabIntents[tab.id] = {
      intent: urlCache[cacheKey].intent,
      url: tab.url,
      title: tab.title
    };

    await chrome.storage.local.set({ tabIntents });

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
        searchQuery
      })
    });

    const data = await response.json();

    urlCache[cacheKey] = data;

    tabIntents[tab.id] = {
      intent: data.intent,
      url: tab.url,
      title: tab.title
    };

    await chrome.storage.local.set({
      urlCache,
      tabIntents
    });

  } catch (err) {

    console.error("Inference failed:", err);

  }

}

/* ---------------- SEARCH QUERY DETECTION ---------------- */

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

/* ---------------- TAB EVENTS ---------------- */

chrome.tabs.onUpdated.addListener(
  async (tabId, changeInfo, tab) => {

    if (changeInfo.status !== "complete") return;

    console.log("TAB UPDATED EVENT FIRED");
    console.log("Tab loaded:", tab.url);

    const query = extractSearchQuery(tab.url);

    if (query) {

      const storage = await chrome.storage.local.get("tabIntents");
      const tabIntents = storage.tabIntents || {};

      /* store search query context */
      await chrome.storage.local.set({
        lastSearchQuery: query
      });

      /* FIX: store search page intent */
      tabIntents[tab.id] = {
        intent: "Search",
        url: tab.url,
        title: tab.title
      };

      await chrome.storage.local.set({ tabIntents });

      return;

    }

    enqueueTab(tab);

  }
);

chrome.tabs.onActivated.addListener(
  async (activeInfo) => {

    const tab = await chrome.tabs.get(activeInfo.tabId);

    enqueueTab(tab);

  }
);

/* ---------------- TAB CLOSE CLEANUP ---------------- */

chrome.tabs.onRemoved.addListener(
  async (tabId) => {

    const storage = await chrome.storage.local.get("tabIntents");

    const tabIntents = storage.tabIntents || {};

    delete tabIntents[tabId];

    await chrome.storage.local.set({ tabIntents });

  }
);

/* ---------------- POPUP MESSAGING ---------------- */

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  if (message.action === "getTabIntents") {

    chrome.storage.local.get("tabIntents").then((data) => {

      sendResponse({
        tabIntents: data.tabIntents || {}
      });

    });

    return true;

  }

});