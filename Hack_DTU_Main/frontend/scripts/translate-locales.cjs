/**
 * One-time translation script using Gemini API
 * Generates hi.json and mr.json from en.json
 *
 * Usage: node scripts/translate-locales.cjs [--force]
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const LOCALES_DIR = path.join(__dirname, '..', 'src', 'locales');
const TARGET_LANGS = [
  { code: 'hi', file: 'hi.json', name: 'Hindi' },
  { code: 'mr', file: 'mr.json', name: 'Marathi' },
];
const FORCE = process.argv.includes('--force');
const BATCH_SIZE = 30;
const DELAY_MS = 1500;

function getApiKey() {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  const envPath = path.join(__dirname, '..', '..', 'backend', '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const match = envContent.match(/^GEMINI_API_KEY=(.+)$/m);
    if (match) return match[1].trim();
  }
  throw new Error('GEMINI_API_KEY not found');
}

function flatten(obj, prefix = '') {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (Array.isArray(value)) {
      result[fullKey] = value;
    } else if (typeof value === 'object' && value !== null) {
      Object.assign(result, flatten(value, fullKey));
    } else {
      result[fullKey] = value;
    }
  }
  return result;
}

function unflatten(obj) {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const parts = key.split('.');
    let current = result;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) current[parts[i]] = {};
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;
  }
  return result;
}

function callGemini(prompt, apiKey) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 8192,
      }
    });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const parsed = new URL(url);

    const req = https.request({
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.error) {
            reject(new Error(`Gemini API error: ${json.error.message}`));
            return;
          }
          const text = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
          resolve(text);
        } catch (e) {
          reject(new Error(`Failed to parse Gemini response: ${data.slice(0, 300)}`));
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function translateBatch(entries, langName, apiKey) {
  const jsonInput = {};
  for (const [key, value] of entries) {
    jsonInput[key] = value;
  }

  const prompt = `Translate the following JSON values from English to ${langName}.
IMPORTANT RULES:
- Only translate the VALUES, keep the keys exactly the same
- Preserve all {{placeholders}} like {{name}}, {{count}}, {{score}} etc exactly as-is
- Preserve all HTML-like tags like <1>, </1> exactly as-is
- Keep brand names like "YuvaSetu", "Team Havoc" as-is
- Return ONLY valid JSON, no markdown, no explanation, no code fences
- The output must be parseable by JSON.parse()

Input:
${JSON.stringify(jsonInput, null, 2)}`;

  const response = await callGemini(prompt, apiKey);

  let jsonStr = response.trim();
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error('  Failed to parse batch response, retrying...');
    console.error('  Response preview:', jsonStr.slice(0, 200));
    throw e;
  }
}

async function main() {
  const apiKey = getApiKey();
  console.log('Gemini API key found.');

  const enPath = path.join(LOCALES_DIR, 'en.json');
  const en = JSON.parse(fs.readFileSync(enPath, 'utf-8'));
  const flatEn = flatten(en);
  console.log(`Source: ${Object.keys(flatEn).length} keys in en.json`);

  for (const { code, file, name } of TARGET_LANGS) {
    console.log(`\n--- Translating to ${name} (${file}) ---`);

    const targetPath = path.join(LOCALES_DIR, file);
    let flatExisting = {};
    if (fs.existsSync(targetPath)) {
      flatExisting = flatten(JSON.parse(fs.readFileSync(targetPath, 'utf-8')));
    }

    const missing = [];
    for (const [key, value] of Object.entries(flatEn)) {
      if (!FORCE && flatExisting[key] !== undefined) continue;
      if (typeof value === 'string') {
        missing.push([key, value]);
      } else if (Array.isArray(value)) {
        if (!FORCE && flatExisting[key] !== undefined) continue;
        missing.push([key, value]);
      }
    }

    if (missing.length === 0) {
      console.log('  All keys already translated. Use --force to overwrite.');
      continue;
    }

    console.log(`  ${missing.length} entries to translate...`);

    const translated = {};
    for (let i = 0; i < missing.length; i += BATCH_SIZE) {
      const batch = missing.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(missing.length / BATCH_SIZE);
      console.log(`  Batch ${batchNum}/${totalBatches} (${batch.length} entries)...`);

      let retries = 0;
      while (retries < 3) {
        try {
          const result = await translateBatch(batch, name, apiKey);
          Object.assign(translated, result);
          break;
        } catch (e) {
          retries++;
          if (retries >= 3) {
            console.error(`  Failed after 3 retries for batch ${batchNum}. Using English as fallback.`);
            for (const [key, value] of batch) {
              translated[key] = value;
            }
          } else {
            console.log(`  Retry ${retries}/3...`);
            await sleep(3000);
          }
        }
      }

      if (i + BATCH_SIZE < missing.length) {
        await sleep(DELAY_MS);
      }
    }

    const merged = { ...flatExisting, ...translated };
    const result = unflatten(merged);
    fs.writeFileSync(targetPath, JSON.stringify(result, null, 2) + '\n', 'utf-8');
    console.log(`  Written to ${file}`);
  }

  console.log('\nDone!');
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
