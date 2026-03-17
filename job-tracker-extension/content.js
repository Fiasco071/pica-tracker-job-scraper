// content.js — injected into job board pages
// Listens for GET_JOB_TEXT message from popup and returns page text + URL

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type !== "GET_JOB_TEXT") return;

  // For LinkedIn two-panel layout (search/collections), combine top card + description
  function extractLinkedIn() {
    // Salary/insights are in separate chip elements — collect them explicitly
    const insightSelectors = [
      ".jobs-unified-top-card__job-insight",
      ".job-details-jobs-unified-top-card__job-insight",
      "[class*='job-insight']",
      ".jobs-unified-top-card__metadata-item",
    ];
    const insights = [];
    for (const sel of insightSelectors) {
      document.querySelectorAll(sel).forEach(el => {
        const t = el.innerText.trim();
        if (t) insights.push(t);
      });
      if (insights.length) break;
    }

    const topCard = document.querySelector(
      ".jobs-unified-top-card, .job-details-jobs-unified-top-card__container"
    );
    const desc = document.querySelector(
      ".jobs-description__content, .jobs-description-content__text, [class*='jobs-description__container']"
    );

    const parts = [];
    if (topCard) parts.push(topCard.innerText.trim());
    if (insights.length) parts.push("Insights: " + insights.join(" | "));
    if (desc) parts.push(desc.innerText.trim());

    if (parts.length) return parts.join("\n\n").slice(0, 12000);

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
