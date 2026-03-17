# Pica Job Importer — Chrome Extension

Import job postings from LinkedIn, Indeed, Glassdoor, Greenhouse, or Lever directly into [Pica Tracker](https://www.pica-tracker.com) with one click. The extension reads the job page, sends it to the Pica AI parser, and creates the company and job record automatically.

---

## Installation

### Step 1 — Download the extension files

Download or clone this repository to your computer. You need the `job-tracker-extension/` folder — keep all its files together.

### Step 2 — Open Chrome Extensions

Open Google Chrome and go to:
```
chrome://extensions
```

### Step 3 — Enable Developer Mode

In the top-right corner of the Extensions page, toggle **Developer mode** on.

![Developer mode toggle is in the top-right corner of chrome://extensions]

### Step 4 — Load the extension

1. Click **Load unpacked**
2. In the file picker, navigate to and select the `job-tracker-extension/` folder
3. Click **Select Folder**

The **Pica** extension will appear in your list of installed extensions.

### Step 5 — Pin it to your toolbar

1. Click the **puzzle piece icon** (🧩) in the Chrome toolbar
2. Find **Pica Job Importer** and click the **pin icon** next to it
3. The Pica icon will now appear permanently in your toolbar for easy access

---

## How to Import a Job

### Step 1 — Log into Pica Tracker

Make sure you are logged into [pica-tracker.com](https://www.pica-tracker.com) in the same Chrome browser. The extension uses your existing login session — no separate API key needed.

### Step 2 — Navigate to a job posting

Go to any job posting on a supported site:

| Site | Supported URL pattern |
|---|---|
| LinkedIn | `linkedin.com/jobs/view/…` or jobs search/collections pages |
| Indeed | `indeed.com/viewjob…` |
| Glassdoor | `glassdoor.com/Job/…` |
| Greenhouse | `*.greenhouse.io/…` |
| Lever | `*.lever.co/…` |

### Step 3 — Click the Pica icon

Click the **Pica icon** in your Chrome toolbar. The popup will open and show the current page URL.

> If you see *"Navigate to a job posting first"*, you are on a page that is not a supported job board.

### Step 4 — Import

Click **Import This Job**. The extension will:
1. Read the job description from the page
2. Send it to the Pica AI parser (Claude Haiku)
3. Show you a preview of the parsed data — company, role, location, compensation, and tech stack

### Step 5 — Review and save

Check the preview card. If everything looks correct, click **✓ Save to Tracker**.

The job and company are created in your tracker automatically with today's date and status set to **Applied**.

Click **View in Tracker →** to open your tracker and see the new entry.

---

## Troubleshooting

| Problem | Solution |
|---|---|
| "Not Logged In" error | Log into [pica-tracker.com](https://www.pica-tracker.com) in Chrome, then retry |
| "Import Failed" error | Reload the job page and try again; check your internet connection |
| Company or role shows as "Unknown" | The page may not have loaded fully — scroll through the job description first, then retry |
| Tech stack or salary missing | These fields are parsed from the job text; if the posting doesn't mention them they will be blank |
| Extension not visible in toolbar | Click the 🧩 puzzle piece icon and pin Pica Job Importer |

---

## Notes

- You must be **logged into Pica Tracker in the same browser** for imports to work
- The import runs in a background service worker — navigating away mid-import will not cancel it
- Parsed data is processed server-side by Claude Haiku — no AI API key is needed in the extension itself
- The Settings panel (⚙ gear icon in the popup) lets you point the extension at a different URL for local development (`http://localhost:3000`)
