# NotebookLM Podcast Automation — Setup Guide

Estimated setup time: 30-45 minutes.

## What this does

1. You email (or voice-dictate via Google Assistant) a topic to yourself with a Gmail label applied
2. The script calls Claude API, gets 10 curated sources
3. It creates a Google Doc with all sources and emails you a formatted summary
4. You open NotebookLM, add the Google Doc, click **Generate Audio Overview**
5. ~20-30 min later: podcast ready

---

## Step 1 — Create the Apps Script project

1. Go to [script.google.com](https://script.google.com)
2. Click **New project**
3. Rename it: click "Untitled project" → type `NotebookLM Podcast Automation`
4. Delete the default `function myFunction() {}` content
5. Paste the entire contents of `Code.gs` (from this repo) into the editor
6. Click the floppy disk icon (Save)

---

## Step 2 — Add your Claude API key

1. In the Apps Script editor, click **Project Settings** (gear icon, left sidebar)
2. Scroll to **Script Properties** → click **Add script property**
3. Property name: `CLAUDE_API_KEY`
4. Value: your Anthropic API key (get one at console.anthropic.com)
5. Click **Save script properties**

**Cost estimate:** Claude Opus 4 at ~$15/M input tokens. Each request uses roughly 800 input tokens + 1500 output tokens ≈ **$0.03 per topic request**. Very cheap.

---

## Step 3 — Run the setup function

1. In the Apps Script editor, open the function dropdown (top center, shows `checkForRequests`)
2. Select `setupTrigger` from the dropdown
3. Click **Run** (▶)
4. You'll be asked to grant permissions — click through and allow (this is your own Google account)
5. Check the **Execution log** at the bottom — you should see "Trigger created" and "Gmail labels created"

This creates:
- A trigger that runs `checkForRequests` every minute
- Two Gmail labels: `podcast-request` and `podcast-request/done`

---

## Step 4 — Set up the Gmail filter

This is what turns incoming emails into requests automatically.

**Option A — Dedicated Gmail alias (recommended)**
1. In Gmail Settings → **See all settings** → **Accounts and Import** → **Add another email address**
2. Add something like `yourname+podcast@gmail.com` (Gmail ignores the `+podcast` part for delivery)
3. Create a Gmail filter: **From:** yourself (or anyone) | **To:** `yourname+podcast@gmail.com`
4. Action: **Apply label** → `podcast-request`

**Option B — Simpler: filter by subject prefix**
1. Gmail Settings → Filters → Create new filter
2. **Subject:** starts with `[podcast]`
3. Action: Apply label → `podcast-request`
4. With this option, your email subject would be: `[podcast] kubernetes ingress controllers`

---

## Step 5 — Test it

1. Send yourself an email:
   - **To:** your Gmail (or `+podcast` alias if you used Option A)
   - **Subject:** `machine learning quantization techniques`
   - Apply the `podcast-request` label manually in Gmail (or let the filter do it)
2. Wait up to 1 minute
3. Check for a reply email with sources + a Google Doc link

---

## Step 6 — Voice trigger setup (optional but recommended)

**Google Assistant (Android/Google Home):**
- "Hey Google, send an email to [yourself] with subject [podcast] kubernetes ingress controllers"
- Assistant will confirm and send it

**Siri Shortcuts (iPhone):**
1. Create a Shortcut: **Send Email** action
2. To: your email / alias
3. Subject: enter when asked (or use "Ask Each Time")
4. Add to Siri with a phrase like "Research topic"

**Google Assistant Routines:**
- You can create a custom phrase like "Research [topic]" that pre-fills the email — useful if you send to a dedicated alias

---

## Daily workflow

```
You:    "Hey Google, send email to me@gmail.com, 
         subject: [podcast] vapor barrier installation basement"

~1 min: Email arrives with 10 curated sources + Google Doc link

You:    Open notebooklm.google.com
        New notebook → Add Source → Google Docs → pick the doc
        Click "Generate Audio Overview"

~25 min: Open NotebookLM, press play on your podcast
```

---

## Customization

**Change the Gmail label name** — edit `CONFIG.LABEL_INBOX` in `Code.gs`

**Restrict to emails from yourself only** — set `CONFIG.FROM_FILTER` to your email address:
```js
FROM_FILTER: "you@gmail.com",
```

**Change the Claude model** — `CONFIG.CLAUDE_MODEL`:
- `claude-opus-4-7` — best source quality (default, ~$0.03/request)
- `claude-sonnet-4-6` — faster, slightly cheaper (~$0.01/request)

**Add a second NotebookLM notebook per topic domain** — currently all docs go to one Drive folder; you could extend the script to route by keyword.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| No reply email | Check Apps Script executions log (left sidebar → Executions). Look for errors. |
| "CLAUDE_API_KEY not set" | Re-check Step 2; property name must be exact. |
| Reply arrives but sources seem generic | The topic might be too broad. Be specific: "vapor barrier installation in basement crawl space" vs "home improvement". |
| URL marked [VERIFY URL] | Claude flagged uncertainty. Paste the title into Google to find the real URL. |
| Script stops running | Triggers expire after ~6 months; re-run `setupTrigger` to renew. |

---

## How the source curation works

The Claude prompt instructs it to:
- Prefer domain-authoritative sources (This Old House, Family Handyman, arXiv, official docs, IEEE)
- Mix depth levels (at least 1-2 foundational + 1-2 beginner-accessible)
- Include specific arXiv/paper titles with authors when relevant
- Avoid content farms, AI-generated listicles, and generic aggregators
- Flag URLs it's uncertain about so you can verify before adding to NotebookLM

Sources are returned as JSON and formatted into a clean Google Doc designed to work well as a NotebookLM source.
