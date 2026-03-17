// content.js — injected into job board pages
// Listens for GET_JOB_TEXT message from popup and returns page text + URL

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type !== "GET_JOB_TEXT") return;

  // For LinkedIn two-panel layout (search/collections), combine top card + description
  function extractLinkedIn() {
    const topCard = document.querySelector(".jobs-unified-top-card");
    const desc = document.querySelector(
      ".jobs-description__content, .jobs-description-content__text, [class*='jobs-description__container']"
    );
    if (topCard || desc) {
      return [topCard?.innerText, desc?.innerText].filter(Boolean).join("\n\n").slice(0, 12000);
    }
    // Fallback: grab the entire right-side detail panel
    const detail = document.querySelector(".scaffold-layout__detail, .jobs-search__job-details--wrapper, .job-view-layout");
    if (detail && detail.innerText.trim().length > 100) {
      return detail.innerText.trim().slice(0, 12000);
    }
    return null;
  }

  let text = null;

  if (location.hostname.includes("linkedin.com")) {
    text = extractLinkedIn();
  }

  if (!text) {
    const selectors = [
      "#jobDescriptionText",    // Indeed
      ".jobDescriptionContent", // Glassdoor
      "#content",               // Greenhouse
      ".content",               // Lever
      "main",                   // generic
    ];
    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el && el.innerText.trim().length > 100) {
        text = el.innerText.trim().slice(0, 12000);
        break;
      }
    }
  }

  if (!text) {
    text = document.body.innerText.slice(0, 12000);
  }

  sendResponse({ text, url: location.href });
  return true;
});
