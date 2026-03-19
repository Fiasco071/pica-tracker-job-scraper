// background.js — service worker
// Handles API calls so they survive popup close mid-import

const DEFAULT_APP_URL = "https://your-app.vercel.app";

async function ingestJob({ text, url, appUrl }) {
  const res = await fetch(`${appUrl}/api/jobs/ingest`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, sourceUrl: url }),
  });
  if (res.status === 401) throw Object.assign(new Error("NOT_LOGGED_IN"), { code: "NOT_LOGGED_IN" });
  if (res.status === 429) {
    const body = await res.json().catch(() => ({}));
    throw Object.assign(new Error("RATE_LIMITED"), { code: "RATE_LIMITED", detail: body.error });
  }
  if (!res.ok) throw Object.assign(new Error("IMPORT_FAILED"), { code: "IMPORT_FAILED" });
  return res.json();
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "INGEST_JOB") {
    const { text, url, appUrl } = message.payload;
    console.log("[Pica] INGEST_JOB received | appUrl:", appUrl, "| textLength:", text?.length, "| preview:", text?.slice(0, 300));
    ingestJob({ text, url, appUrl })
      .then((data) => { console.log("[Pica] ingest success:", JSON.stringify(data?.parsed)); sendResponse({ ok: true, data }); })
      .catch((err) => { console.error("[Pica] ingest error:", err.code, err.message); sendResponse({ ok: false, error: err.code || "IMPORT_FAILED", detail: err.detail }); });
    return true; // keep channel open for async response
  }

  if (message.type === "GET_SETTINGS") {
    chrome.storage.sync.get({ appUrl: DEFAULT_APP_URL }, (items) => {
      sendResponse({ appUrl: items.appUrl });
    });
    return true;
  }

  if (message.type === "SAVE_SETTINGS") {
    chrome.storage.sync.set({ appUrl: message.payload.appUrl }, () => {
      sendResponse({ ok: true });
    });
    return true;
  }
});
