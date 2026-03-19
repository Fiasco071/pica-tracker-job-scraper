// content.js — injected into job board pages
// Listens for GET_JOB_TEXT message from popup and returns page text + URL

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type !== "GET_JOB_TEXT") return;

  function extractLinkedIn() {
    // Try known description containers — LinkedIn changes class names often so use wildcards
    const descSelectors = [
      ".jobs-description__content",
      ".jobs-description-content__text",
      "[class*='jobs-description__container']",
      "[class*='jobs-description-content']",
      "[class*='job-details-about-the-role']",
      "[class*='jobs-details__main-content']",
    ];

    let desc = null;
    for (const sel of descSelectors) {
      const el = document.querySelector(sel);
      if (el && el.innerText.trim().length > 200) { desc = el; break; }
    }

    // Top card (title, company, location, salary chips)
    const topCardSelectors = [
      ".jobs-unified-top-card",
      ".job-details-jobs-unified-top-card__container",
      "[class*='jobs-unified-top-card']",
      "[class*='job-details-jobs-unified-top-card']",
    ];
    let topCard = null;
    for (const sel of topCardSelectors) {
      const el = document.querySelector(sel);
      if (el && el.innerText.trim().length > 20) { topCard = el; break; }
    }

    // Right detail panel — wraps both top card and description
    const detailSelectors = [
      ".scaffold-layout__detail",
      "[class*='scaffold-layout__detail']",
      ".jobs-search__job-details--wrapper",
      "[class*='jobs-search__job-details']",
      ".job-view-layout",
      "[class*='job-view-layout']",
    ];
    let detail = null;
    for (const sel of detailSelectors) {
      const el = document.querySelector(sel);
      if (el && el.innerText.trim().length > 300) { detail = el; break; }
    }

    // If we found the full detail panel, it contains everything — prefer it
    if (detail) {
      return detail.innerText.trim().slice(0, 12000);
    }

    // Otherwise stitch together what we have
    if (topCard || desc) {
      const parts = [];
      if (topCard) parts.push(topCard.innerText.trim());
      if (desc) parts.push(desc.innerText.trim());
      return parts.join("\n\n").slice(0, 12000);
    }

    // Last resort: find the element with the most text on the right side of the page
    // LinkedIn two-panel layout — right side has job details
    const candidates = Array.from(document.querySelectorAll("main > * > * > *"))
      .filter(el => el.innerText && el.innerText.trim().length > 500)
      .sort((a, b) => b.innerText.length - a.innerText.length);
    if (candidates.length) return candidates[0].innerText.trim().slice(0, 12000);

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
    ];
    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el && el.innerText.trim().length > 100) {
        text = el.innerText.trim().slice(0, 12000);
        break;
      }
    }
  }

  // Generic fallback — avoid using `main` on LinkedIn (captures left sidebar too)
  if (!text) {
    text = document.body.innerText.slice(0, 12000);
  }

  sendResponse({ text, url: location.href });
  return true;
});
