
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

    const intentData = tabIntents[tab.id];

    if (intentData) {

      badge.textContent = intentData.intent;

    } else {

      badge.textContent = "Loading...";
      badge.classList.add("loading");

    }

    card.appendChild(badge);
    card.appendChild(title);
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