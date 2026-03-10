
const container = document.getElementById("tabs-container");

function loadTabIntents() {
  chrome.runtime.sendMessage(
    { action: "getTabIntents" },
    async (response) => {

      const tabIntents = response?.tabIntents || {};

      const tabs = await chrome.tabs.query({ currentWindow: true });

      renderTabs(tabs, tabIntents);

    }
  );

}

function renderTabs(tabs, tabIntents) {

  container.innerHTML = "";

  for (const tab of tabs) {

    const intentData = tabIntents[tab.id];

    const card = document.createElement("div");
    card.className = "tab-card";

    const badge = document.createElement("span");
    badge.className = "intent-badge";

    const title = document.createElement("div");
    title.className = "tab-title";
    title.textContent = tab.title;

    const domain = document.createElement("div");
    domain.className = "tab-domain";
    domain.textContent = new URL(tab.url).hostname;

    const query = document.createElement("div");
    query.className = "tab-query";
    if (intentData?.searchQuery) {
      query.textContent = `Looking for: ${intentData.searchQuery}`;
    }


    if (intentData) {

      badge.textContent = intentData.intent;

    } else {

      badge.textContent = "Loading...";
      badge.classList.add("loading");

    }

    card.appendChild(badge);
    card.appendChild(title);
    card.appendChild(query);
    card.appendChild(domain);

    container.appendChild(card);

  }

}

/* refresh when storage updates */

chrome.storage.onChanged.addListener((changes, area) => {

  if (area === "local" && changes.tabIntents) {

    loadTabIntents();

  }

});

document.addEventListener("DOMContentLoaded", () => {
  loadTabIntents();
});