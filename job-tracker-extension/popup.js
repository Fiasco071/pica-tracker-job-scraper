// popup.js — vanilla JS, no framework
// States: idle | loading | preview | success | error | settings

const app = document.getElementById("app");
let appUrl = "https://www.pica-tracker.com";
let currentTab = null;
let parsedData = null;
let jobId = null;

// ── Init ──────────────────────────────────────────────────────────────────────

async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTab = tab;
  const settings = await msg({ type: "GET_SETTINGS" });
  appUrl = settings.appUrl;
  renderIdle();
}

// ── Messaging ─────────────────────────────────────────────────────────────────

function msg(payload) {
  return new Promise((resolve) => chrome.runtime.sendMessage(payload, resolve));
}

function contentMsg(tabId, payload) {
  return new Promise((resolve) =>
    chrome.tabs.sendMessage(tabId, payload, (resp) => {
      void chrome.runtime.lastError; // suppress "Receiving end does not exist"
      resolve(resp);
    })
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function isJobPage(url) {
  if (!url) return false;
  return [
    /linkedin\.com\/jobs/,
    /indeed\.com\/viewjob/,
    /glassdoor\.com\/Job/,
    /greenhouse\.io/,
    /lever\.co/,
  ].some((re) => re.test(url));
}

function truncate(str, n) {
  if (!str) return "";
  return str.length > n ? str.slice(0, n) + "…" : str;
}

function formatComp(min, max) {
  if (!min && !max) return null;
  const fmt = (n) => (n >= 1000 ? Math.round(n / 1000) + "k" : n);
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `${fmt(min)}+`;
  return `up to ${fmt(max)}`;
}

function el(tag, attrs = {}, ...children) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") e.className = v;
    else if (k === "style") Object.assign(e.style, v);
    else if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v);
  }
  for (const child of children) {
    if (typeof child === "string") e.appendChild(document.createTextNode(child));
    else if (child) e.appendChild(child);
  }
  return e;
}

function set(html) {
  app.innerHTML = "";
  app.appendChild(html);
}

// ── Render functions ──────────────────────────────────────────────────────────

function renderIdle() {
  const onJobPage = isJobPage(currentTab?.url);
  const urlText = truncate(currentTab?.url || "Unknown page", 48);

  set(
    el("div", { class: "container" },
      el("div", { class: "header" },
        el("div", { class: "logo" },
          el("span", { class: "logo-icon" }, "💼"),
          el("span", { class: "logo-text" }, "Job Tracker")
        ),
        el("button", { class: "icon-btn", title: "Settings", onclick: renderSettings }, "⚙")
      ),
      el("p", { class: "url-text" }, urlText),
      onJobPage
        ? el("button", { class: "btn btn-primary", onclick: handleImport }, "Import This Job")
        : el("div", { class: "notice" },
            el("p", {}, "Navigate to a job posting on LinkedIn, Indeed, Glassdoor, Greenhouse, or Lever first.")
          )
    )
  );
}

function renderLoading() {
  set(
    el("div", { class: "container centered" },
      el("div", { class: "spinner" }),
      el("p", { class: "loading-text" }, "Parsing with AI…")
    )
  );
}

function renderPreview(parsed) {
  const comp = formatComp(parsed.compensationMin, parsed.compensationMax);
  const stack = parsed.techStack || [];
  const chips = stack.slice(0, 6);
  const extra = stack.length - chips.length;

  set(
    el("div", { class: "container" },
      el("div", { class: "header" },
        el("span", { class: "header-title" }, "Review Import")
      ),
      el("div", { class: "card" },
        el("div", { class: "company-name" }, parsed.companyName || "Unknown Company"),
        el("div", { class: "role" }, parsed.rolePosition || "Unknown Role"),
        parsed.location
          ? el("div", { class: "meta" }, "📍 " + parsed.location)
          : null,
        comp
          ? el("div", { class: "meta" }, "💰 " + comp)
          : null,
        chips.length
          ? el("div", { class: "chips" },
              ...chips.map((t) => el("span", { class: "chip" }, t)),
              extra > 0 ? el("span", { class: "chip chip-more" }, `+${extra} more`) : null
            )
          : null
      ),
      el("div", { class: "actions" },
        el("button", { class: "btn btn-primary", onclick: handleSave }, "✓ Save to Tracker"),
        el("button", { class: "btn btn-secondary", onclick: renderIdle }, "✕ Cancel")
      )
    )
  );
}

function renderSuccess(saved) {
  set(
    el("div", { class: "container centered" },
      el("div", { class: "success-icon" }, "✓"),
      el("h2", { class: "success-heading" }, "Saved!"),
      el("p", { class: "success-sub" },
        `${saved.companyName || ""} — ${saved.rolePosition || ""}`
      ),
      el("a",
        { class: "btn btn-primary link-btn", href: `${appUrl}/tracker`, target: "_blank" },
        "View in Tracker →"
      ),
      el("button", { class: "btn btn-secondary", onclick: renderIdle }, "Import Another")
    )
  );
}

function renderError(errorCode, detail) {
  const isAuthError  = errorCode === "NOT_LOGGED_IN";
  const isRateLimit  = errorCode === "RATE_LIMITED";

  const heading = isAuthError ? "Not Logged In"
    : isRateLimit ? "Monthly Limit Reached"
    : "Import Failed";

  const message = isAuthError
    ? "Please log into your Job Tracker app first, then try again."
    : isRateLimit
    ? (detail || "You've reached your monthly import limit. Resets on a rolling 30-day basis.")
    : "Something went wrong. Please try again.";

  set(
    el("div", { class: "container centered" },
      el("div", { class: "error-icon" }, isRateLimit ? "⏱" : "✕"),
      el("h2", { class: "error-heading" }, heading),
      el("p", { class: "error-msg" }, message),
      isAuthError
        ? el("a",
            { class: "btn btn-primary link-btn", href: appUrl, target: "_blank" },
            "Open Job Tracker →"
          )
        : null,
      !isRateLimit
        ? el("button", { class: "btn btn-secondary", onclick: renderIdle }, "Retry")
        : null
    )
  );
}

function renderSettings() {
  let inputVal = appUrl;

  const input = el("input", {
    class: "text-input",
    type: "text",
    value: appUrl,
    placeholder: "https://your-app.vercel.app",
  });

  async function saveSettings() {
    const newUrl = input.value.trim().replace(/\/$/, "");
    if (!newUrl) return;
    await msg({ type: "SAVE_SETTINGS", payload: { appUrl: newUrl } });
    appUrl = newUrl;
    renderIdle();
  }

  set(
    el("div", { class: "container" },
      el("div", { class: "header" },
        el("button", { class: "icon-btn", onclick: renderIdle }, "←"),
        el("span", { class: "header-title" }, "Settings")
      ),
      el("label", { class: "field-label" }, "Job Tracker URL"),
      input,
      el("p", { class: "field-hint" },
        "Set this to your deployed app URL or http://localhost:3000 for local dev"
      ),
      el("button", { class: "btn btn-primary", onclick: saveSettings }, "Save")
    )
  );

  // can't set value via setAttribute reliably, set it directly
  input.value = appUrl;
}

// ── Action handlers ───────────────────────────────────────────────────────────

async function handleImport() {
  renderLoading();

  let text, url;
  try {
    // Try content script first, fall back to scripting.executeScript
    let resp = null;
    try {
      resp = await contentMsg(currentTab.id, { type: "GET_JOB_TEXT" });
    } catch {}

    if (!resp || !resp.text) {
      // Inject and execute directly
      const results = await chrome.scripting.executeScript({
        target: { tabId: currentTab.id },
        func: () => {
          let text = null;
          if (location.hostname.includes("linkedin.com")) {
            const topCard = document.querySelector(".jobs-unified-top-card");
            const desc = document.querySelector(
              ".jobs-description__content, .jobs-description-content__text, [class*='jobs-description__container']"
            );
            if (topCard || desc) {
              text = [topCard?.innerText, desc?.innerText].filter(Boolean).join("\n\n").slice(0, 12000);
            } else {
              const detail = document.querySelector(".scaffold-layout__detail, .jobs-search__job-details--wrapper, .job-view-layout");
              if (detail && detail.innerText.trim().length > 100) text = detail.innerText.trim().slice(0, 12000);
            }
          }
          if (!text) {
            for (const sel of ["#jobDescriptionText", ".jobDescriptionContent", "#content", ".content", "main"]) {
              const el = document.querySelector(sel);
              if (el && el.innerText.trim().length > 100) { text = el.innerText.trim().slice(0, 12000); break; }
            }
          }
          return { text: text || document.body.innerText.slice(0, 12000), url: location.href };
        },
      });
      resp = results?.[0]?.result;
    }

    if (!resp || !resp.text) throw new Error("IMPORT_FAILED");
    text = resp.text;
    url = resp.url;
  } catch {
    renderError("IMPORT_FAILED");
    return;
  }

  const result = await msg({
    type: "INGEST_JOB",
    payload: { text, url, appUrl },
  });

  if (!result || !result.ok) {
    renderError(result?.error || "IMPORT_FAILED", result?.detail);
    return;
  }

  parsedData = result.data.parsed;
  jobId = result.data.jobId;
  renderPreview(parsedData);
}

async function handleSave() {
  // Data already saved by ingest endpoint; just show success
  renderSuccess(parsedData || {});
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────

init();
