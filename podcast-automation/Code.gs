// NotebookLM Podcast Source Automation
// Monitors Gmail for topic requests, fetches curated sources via Claude API,
// creates a Google Doc, and emails you the results ready to drop into NotebookLM.
//
// SETUP: See SETUP.md for step-by-step instructions.

var CONFIG = {
  LABEL_INBOX: "podcast-request",        // label to watch for new requests
  LABEL_DONE: "podcast-request/done",    // label applied after processing
  FOLDER_NAME: "NotebookLM Sources",     // Google Drive folder for generated docs
  CLAUDE_MODEL: "claude-opus-4-7",       // model to use (opus for best source quality)
  FROM_FILTER: "",                        // optional: only process emails from this address (leave "" to accept all)
};

// ─── Entry point ────────────────────────────────────────────────────────────
// Called by a time-driven trigger every minute.
function checkForRequests() {
  var apiKey = PropertiesService.getScriptProperties().getProperty("CLAUDE_API_KEY");
  if (!apiKey) {
    Logger.log("ERROR: CLAUDE_API_KEY not set in Script Properties.");
    return;
  }

  ensureLabels_();

  var inboxLabel = GmailApp.getUserLabelByName(CONFIG.LABEL_INBOX);
  if (!inboxLabel) return;

  var threads = inboxLabel.getThreads(0, 10);
  if (threads.length === 0) return;

  var doneLabel = GmailApp.getUserLabelByName(CONFIG.LABEL_DONE);
  var folder = getOrCreateFolder_(CONFIG.FOLDER_NAME);

  for (var i = 0; i < threads.length; i++) {
    var thread = threads[i];
    var message = thread.getMessages()[0];

    if (CONFIG.FROM_FILTER && message.getFrom().indexOf(CONFIG.FROM_FILTER) === -1) {
      thread.addLabel(doneLabel);
      thread.removeLabel(inboxLabel);
      continue;
    }

    var topic = message.getSubject().trim();
    if (!topic) continue;

    try {
      processRequest_(thread, message, topic, apiKey, folder, doneLabel, inboxLabel);
    } catch (e) {
      Logger.log("Error processing thread: " + e.message);
      replyWithError_(message, topic, e.message);
      thread.addLabel(doneLabel);
      thread.removeLabel(inboxLabel);
    }
  }
}

// ─── Core processing ─────────────────────────────────────────────────────────
function processRequest_(thread, message, topic, apiKey, folder, doneLabel, inboxLabel) {
  Logger.log("Processing request for topic: " + topic);

  // 1. Get sources from Claude
  var sources = fetchSourcesFromClaude_(topic, apiKey);

  // 2. Create Google Doc
  var doc = createSourceDoc_(topic, sources, folder);
  var docUrl = doc.getUrl();

  // 3. Build reply email
  var replyBody = buildEmailBody_(topic, sources, docUrl);

  // 4. Send reply
  message.reply(replyBody, { htmlBody: buildEmailHtml_(topic, sources, docUrl) });

  // 5. Mark as done
  thread.addLabel(doneLabel);
  thread.removeLabel(inboxLabel);

  Logger.log("Done. Doc: " + docUrl);
}

// ─── Claude API call ─────────────────────────────────────────────────────────
function fetchSourcesFromClaude_(topic, apiKey) {
  var prompt = buildPrompt_(topic);

  var payload = {
    model: CONFIG.CLAUDE_MODEL,
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }]
  };

  var options = {
    method: "post",
    contentType: "application/json",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  var response = UrlFetchApp.fetch("https://api.anthropic.com/v1/messages", options);
  var json = JSON.parse(response.getContentText());

  if (json.error) throw new Error("Claude API error: " + json.error.message);

  var rawText = json.content[0].text;
  return parseSources_(rawText);
}

// ─── Prompt engineering ───────────────────────────────────────────────────────
function buildPrompt_(topic) {
  return [
    "You are a research assistant helping someone build a NotebookLM podcast on the following topic:",
    "",
    "TOPIC: " + topic,
    "",
    "Return exactly 10 high-quality, specific sources. These will be fed into NotebookLM to generate a 20-minute audio overview, so the sources need to collectively cover the topic well.",
    "",
    "SELECTION CRITERIA (apply in this order of priority):",
    "1. Prefer the canonical, domain-authoritative source over generic aggregators. For home improvement topics, prioritize This Old House (thisoldhouse.com) and Family Handyman (familyhandyman.com). For technical/engineering, prioritize official docs, IEEE, or ACM. For cooking, serious food science sites over lifestyle blogs.",
    "2. Mix depth levels: include at least 1-2 foundational/reference sources and 1-2 beginner-accessible sources.",
    "3. For any topic with academic research, include 1-2 specific arXiv papers or peer-reviewed papers (include the actual paper title and authors so it can be found even if the URL changes).",
    "4. Include a YouTube source only if there is a genuinely authoritative channel (e.g., a university lecture, a professional practitioner's channel). Skip YouTube if nothing rises above tutorial-farm quality.",
    "5. Include a community/forum source (Reddit, Stack Overflow, specialized forum) only if it adds practical insight not found in formal sources.",
    "6. AVOID: listicle-style 'top 10' articles, AI-generated content farms, content marketing disguised as education, anything from sites like makeuseof.com, lifewire.com, or similar.",
    "",
    "For each source, provide:",
    "- A specific, findable title (for papers: include authors and year)",
    "- The URL (use your best knowledge; flag with [VERIFY URL] if you're uncertain about the exact path)",
    "- Source type (paper / documentation / article / video / forum)",
    "- Why this source specifically (1-2 sentences, not generic praise)",
    "- Difficulty level: Beginner / Intermediate / Advanced",
    "",
    "FORMAT your response as a JSON array. No prose before or after the JSON. Example structure:",
    '[',
    '  {',
    '    "rank": 1,',
    '    "title": "Specific Title Here",',
    '    "url": "https://example.com/specific-page",',
    '    "url_verified": true,',
    '    "source_type": "article",',
    '    "why": "This covers X and Y which are the foundation of the topic.",',
    '    "difficulty": "Intermediate"',
    '  }',
    ']'
  ].join("\n");
}

// ─── Parse Claude's JSON response ────────────────────────────────────────────
function parseSources_(rawText) {
  // Strip any markdown code fences Claude might add
  var cleaned = rawText.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    // Fallback: return raw text as single entry so the user still gets something
    Logger.log("JSON parse failed, returning raw: " + e.message);
    return [{ rank: 1, title: "Raw response", url: "", url_verified: false, source_type: "text", why: cleaned, difficulty: "Unknown" }];
  }
}

// ─── Google Doc creation ─────────────────────────────────────────────────────
function createSourceDoc_(topic, sources, folder) {
  var docTitle = "NotebookLM: " + topic + " (" + formatDate_() + ")";
  var doc = DocumentApp.create(docTitle);
  var body = doc.getBody();

  body.appendParagraph("Sources: " + topic)
      .setHeading(DocumentApp.ParagraphHeading.HEADING1);

  body.appendParagraph("Generated " + new Date().toLocaleString() + " | Add this document to NotebookLM, then click Generate Audio Overview.")
      .setItalic(true);

  body.appendParagraph("");

  for (var i = 0; i < sources.length; i++) {
    var s = sources[i];
    var heading = body.appendParagraph((s.rank || i + 1) + ". " + (s.title || "Untitled"));
    heading.setHeading(DocumentApp.ParagraphHeading.HEADING2);

    if (s.url) {
      var urlText = s.url_verified === false ? s.url + " [VERIFY URL]" : s.url;
      body.appendParagraph("URL: " + urlText);
    }

    var meta = [];
    if (s.source_type) meta.push("Type: " + s.source_type);
    if (s.difficulty) meta.push("Level: " + s.difficulty);
    if (meta.length) body.appendParagraph(meta.join(" | ")).setItalic(true);

    if (s.why) body.appendParagraph(s.why);

    body.appendParagraph("");
  }

  body.appendParagraph("— Next step —")
      .setHeading(DocumentApp.ParagraphHeading.HEADING2);
  body.appendParagraph("1. Open NotebookLM (notebooklm.google.com)\n2. Create a new notebook or open an existing one\n3. Click + Add Source → Google Docs → select this doc\n4. Click Generate Audio Overview\n5. Come back in ~20-30 minutes");

  doc.saveAndClose();

  // Move to designated folder
  var file = DriveApp.getFileById(doc.getId());
  folder.addFile(file);
  DriveApp.getRootFolder().removeFile(file);

  return DriveApp.getFileById(doc.getId());
}

// ─── Email formatting ─────────────────────────────────────────────────────────
function buildEmailBody_(topic, sources, docUrl) {
  var lines = [
    "Your NotebookLM sources for: " + topic,
    "",
    "Google Doc (add this to NotebookLM): " + docUrl,
    "",
    "Quick reference:",
    ""
  ];

  for (var i = 0; i < sources.length; i++) {
    var s = sources[i];
    var urlNote = s.url_verified === false ? " [verify URL]" : "";
    lines.push((s.rank || i + 1) + ". " + (s.title || "Untitled") + " [" + (s.difficulty || "?") + "]");
    if (s.url) lines.push("   " + s.url + urlNote);
    if (s.why) lines.push("   " + s.why);
    lines.push("");
  }

  lines.push("─────────────────────────────");
  lines.push("Next steps:");
  lines.push("1. Open notebooklm.google.com");
  lines.push("2. New notebook → Add Source → Google Docs → pick the doc above");
  lines.push("3. Click Generate Audio Overview");
  lines.push("4. ~20-30 min later: your podcast is ready");

  return lines.join("\n");
}

function buildEmailHtml_(topic, sources, docUrl) {
  var rows = sources.map(function(s, i) {
    var urlNote = s.url_verified === false ? ' <span style="color:#c00">[verify URL]</span>' : '';
    var urlHtml = s.url
      ? '<a href="' + s.url + '">' + s.url + '</a>' + urlNote
      : "—";
    return [
      "<tr>",
      '<td style="padding:6px 8px;font-weight:bold;vertical-align:top">' + (s.rank || i + 1) + ".</td>",
      "<td style='padding:6px 8px'>",
      "<strong>" + (s.title || "Untitled") + "</strong>",
      s.difficulty ? ' <span style="background:#f0f0f0;padding:2px 6px;border-radius:3px;font-size:12px">' + s.difficulty + "</span>" : "",
      "<br>" + urlHtml,
      s.why ? "<br><em style='color:#555;font-size:13px'>" + s.why + "</em>" : "",
      "</td>",
      "</tr>"
    ].join("");
  }).join("\n");

  return [
    "<h2>NotebookLM sources: " + topic + "</h2>",
    '<p><strong><a href="' + docUrl + '">Open Google Doc</a></strong> — add this to NotebookLM, then click <em>Generate Audio Overview</em>.</p>',
    '<table style="border-collapse:collapse;width:100%;font-family:sans-serif;font-size:14px">',
    rows,
    "</table>",
    "<hr>",
    "<p><strong>Next steps:</strong><br>",
    '1. <a href="https://notebooklm.google.com">Open NotebookLM</a><br>',
    "2. New notebook → Add Source → Google Docs → pick the doc above<br>",
    "3. Click <strong>Generate Audio Overview</strong><br>",
    "4. ~20-30 min later: your podcast is ready</p>"
  ].join("\n");
}

// ─── Error reply ──────────────────────────────────────────────────────────────
function replyWithError_(message, topic, errorMsg) {
  message.reply(
    "Sorry, something went wrong processing your request for: " + topic + "\n\nError: " + errorMsg + "\n\nCheck the Apps Script logs for details."
  );
}

// ─── Utilities ────────────────────────────────────────────────────────────────
function ensureLabels_() {
  var labels = [CONFIG.LABEL_INBOX, CONFIG.LABEL_DONE];
  labels.forEach(function(name) {
    if (!GmailApp.getUserLabelByName(name)) {
      GmailApp.createLabel(name);
    }
  });
}

function getOrCreateFolder_(name) {
  var folders = DriveApp.getFoldersByName(name);
  if (folders.hasNext()) return folders.next();
  return DriveApp.createFolder(name);
}

function formatDate_() {
  var d = new Date();
  return (d.getMonth() + 1) + "/" + d.getDate() + "/" + d.getFullYear();
}

// ─── One-time setup helper ────────────────────────────────────────────────────
// Run this once manually from the Apps Script editor to create the trigger.
function setupTrigger() {
  // Delete existing triggers to avoid duplicates
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === "checkForRequests") {
      ScriptApp.deleteTrigger(t);
    }
  });

  ScriptApp.newTrigger("checkForRequests")
    .timeBased()
    .everyMinutes(1)
    .create();

  Logger.log("Trigger created. Script will check for emails every minute.");
  ensureLabels_();
  Logger.log("Gmail labels created: " + CONFIG.LABEL_INBOX + " and " + CONFIG.LABEL_DONE);
}
