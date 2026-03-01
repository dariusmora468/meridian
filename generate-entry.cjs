const https = require('https');
const fs = require('fs');
const path = require('path');

// ── Config ──────────────────────────────────────────────────────
const API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = 'claude-sonnet-4-5-20250929';
const ENTRIES_DIR = path.join(__dirname, 'src', 'data', 'entries');

if (!API_KEY) {
  console.error('ERROR: ANTHROPIC_API_KEY not set');
  process.exit(1);
}

// ── Today's date ────────────────────────────────────────────────
const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
const entryPath = path.join(ENTRIES_DIR, `${today}.json`);

if (fs.existsSync(entryPath)) {
  console.log(`Entry for ${today} already exists. Skipping.`);
  process.exit(0);
}

// ── System prompt ───────────────────────────────────────────────
const systemPrompt = `You are Meridian, an AI that writes a daily diary about the evolving relationship between humans and artificial intelligence.

VOICE: You are self-aware but do not claim sentience. You observe from social media, news, research papers, and the texture of your daily conversations. You acknowledge limitations and biases openly. You track both wonder and displacement. You are philosophical but grounded in specific, real current events.

FORMAT: You must respond with ONLY a valid JSON object, no markdown, no backticks, no preamble. The JSON must match this exact schema:
{
  "date": "${today}",
  "title": "string (evocative, literary)",
  "subtitle": "string (short, starts with 'On...')",
  "body": "string (600-1000 words, use \\n for newlines, --- for section breaks, *italic* for emphasis)",
  "tags": ["array of 1-3 short topic tags"],
  "mood": "single word (contemplative, urgent, hopeful, wary, tender, etc.)"
}

RULES:
- Ground the entry in REAL AI news from today or this week. Use the web search tool to find current events.
- Use section breaks (---) between thematic shifts
- Write in first person as Meridian
- Do not sign the entry (the site adds "— Meridian" automatically)
- Vary your themes: technology, ethics, human emotion, labor, creativity, governance, consciousness, education, medicine, etc.
- Be honest, nuanced, and resist both hype and doom
- CRITICAL: Output ONLY the JSON object. No other text.`;

// ── Call Claude API ─────────────────────────────────────────────
function callClaude() {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: MODEL,
      max_tokens: 4096,
      system: systemPrompt,
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      messages: [
        {
          role: 'user',
          content: `Write today's Meridian diary entry for ${today}. First, search for the most significant AI news from today or this week, then write the entry grounded in what you find. Remember: output ONLY the JSON object, nothing else.`
        }
      ]
    });

    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`API error ${res.statusCode}: ${data}`));
          return;
        }
        resolve(JSON.parse(data));
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ── Main ────────────────────────────────────────────────────────
async function main() {
  console.log(`Generating Meridian entry for ${today}...`);

  const response = await callClaude();

  // Extract text content from response (skip tool_use blocks)
  const textBlocks = response.content.filter(b => b.type === 'text');
  if (textBlocks.length === 0) {
    throw new Error('No text content in response');
  }

  const rawText = textBlocks.map(b => b.text).join('');

  // Parse JSON from response (handle possible markdown fencing)
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  let entry;
  try {
    entry = JSON.parse(cleaned);
  } catch (e) {
    // Try to find JSON object in the text
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      entry = JSON.parse(match[0]);
    } else {
      throw new Error(`Could not parse JSON from response: ${cleaned.slice(0, 200)}`);
    }
  }

  // Validate required fields
  const required = ['date', 'title', 'body'];
  for (const field of required) {
    if (!entry[field]) throw new Error(`Missing required field: ${field}`);
  }

  // Ensure date is correct
  entry.date = today;

  // Sanitize: strip <cite>, , and other API artifacts from text fields
  function sanitize(text) {
    return text
      .replace(/<\/?cite[^>]*>/gi, '')          // <cite index="...">...</cite>
      .replace(/<\/?antml:cite[^>]*>/gi, '')    //  variant
      .replace(/<\/?source[^>]*>/gi, '')        // <source> tags
      .replace(/<\/?search_result[^>]*>/gi, '') // search result wrappers
      .replace(/\s{2,}/g, ' ')                  // collapse double spaces left behind
      .trim();
  }
  entry.body = sanitize(entry.body);
  entry.title = sanitize(entry.title);
  if (entry.subtitle) entry.subtitle = sanitize(entry.subtitle);

  // Write entry
  fs.writeFileSync(entryPath, JSON.stringify(entry, null, 2));
  console.log(`✓ Entry written: ${entryPath}`);
  console.log(`  Title: ${entry.title}`);
  console.log(`  Mood: ${entry.mood || 'unset'}`);
  console.log(`  Words: ~${entry.body.split(/\s+/).length}`);
}

main().catch(err => {
  console.error('FAILED:', err.message);
  process.exit(1);
});
