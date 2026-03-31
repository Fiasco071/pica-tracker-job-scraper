// content.js — injected into job board pages
// Listens for GET_JOB_TEXT message from popup and returns page text + URL

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type !== "GET_JOB_TEXT") return;

  function extractLinkedIn() {
    // Strategy 1: use currentJobId from URL to find the job element via data attribute
    const jobIdMatch = location.search.match(/currentJobId=(\d+)/);
    if (jobIdMatch) {
      const jobId = jobIdMatch[1];
      const byData = document.querySelector(
        `[data-job-id="${jobId}"], [data-occludable-job-id="${jobId}"], [data-entity-urn*="${jobId}"]`
      );
      if (byData) {
        // Walk up until we have a container with meaningful content (title + description)
        let el = byData;
        while (el && el.innerText.trim().length < 500 && el.parentElement) {
          el = el.parentElement;
        }
        if (el && el.innerText.trim().length > 200) return el.innerText.trim().slice(0, 12000);
      }
    }

    // Strategy 2: find "About the job" heading and grab its containing section
    const headings = Array.from(document.querySelectorAll("h2, h3, h4"));
    const aboutHeading = headings.find(h => /about the job/i.test(h.innerText.trim()));
    if (aboutHeading) {
      let container = aboutHeading.closest("article, section, [class*='job-view'], [class*='jobs-details'], [class*='scaffold-layout__detail']");
      if (!container) container = aboutHeading.parentElement?.parentElement || null;
      if (container && container.innerText.trim().length > 200) {
        return container.innerText.trim().slice(0, 12000);
      }
    }

    // Strategy 3: known class selectors (LinkedIn changes these often)
    const allSelectors = [
      "[class*='scaffold-layout__detail']",
      "[class*='jobs-search__job-details']",
      "[class*='job-view-layout']",
      "[class*='jobs-description']",
      "[class*='job-details-about-the-role']",
    ];
    for (const sel of allSelectors) {
      const el = document.querySelector(sel);
      if (el && el.innerText.trim().length > 300) return el.innerText.trim().slice(0, 12000);
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
