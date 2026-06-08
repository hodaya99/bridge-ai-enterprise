// Self-contained Gemini profiler — no SDK, uses built-in fetch (Node 18+).
// Dynamically discovers a working model so it never breaks on model renames.

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';

// ===== DEMO FALLBACK =====
const DEMO_RESPONSE = {
  skills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'Git'],
  level: 'Mid',
  jobTypes: [
    'Full Stack Developer',
    'Frontend Engineer',
    'Backend Developer',
  ],
  pitch:
    'מפתח מלא-סטאק עם ניסיון בבניית אפליקציות Web מודרניות ומדרגיות. ' +
    'בקיא בטכנולוגיות React ו-Node.js עם רקורד מוכח בסביבות startup דינמיות.',
  demo: true,
};

// ===== PROMPT =====
const buildPrompt = (text) => `You are an AI career profiler for a job matching platform called Bridge AI.
Analyze the following candidate description or CV text and extract structured information.

Return ONLY a valid JSON object with exactly these keys:
{
  "skills": ["skill1", "skill2", "skill3", "skill4", "skill5"],
  "level": "Junior",
  "jobTypes": ["job type 1", "job type 2", "job type 3"],
  "pitch": "2-sentence pitch in Hebrew"
}

Strict rules:
1. "skills": array of exactly 5 strings — the most relevant technical or professional skills
2. "level": exactly ONE of these strings: "Junior", "Mid", "Senior"
3. "jobTypes": array of exactly 3 strings — specific job role titles (can be Hebrew or English)
4. "pitch": exactly 2 sentences written in Hebrew that describe this candidate to potential employers
5. Return ONLY the JSON object — no markdown, no explanation, no code fences

Candidate text:
${text}`;

// Find a model that supports generateContent. Prefer fast "flash" models.
async function pickModel(apiKey) {
  const res = await fetch(`${GEMINI_BASE}/models?key=${apiKey}`);
  if (!res.ok) throw new Error('ListModels failed: ' + res.status);
  const data = await res.json();
  const usable = (data.models || []).filter(
    (m) => (m.supportedGenerationMethods || []).includes('generateContent')
  );
  if (usable.length === 0) throw new Error('No model supports generateContent');

  // Prefer a stable flash model, then any flash, then anything usable.
  const byName = (frag) => usable.find((m) => m.name.includes(frag));
  const chosen =
    byName('flash-latest') ||
    byName('2.0-flash') ||
    byName('flash') ||
    usable[0];
  return chosen.name; // e.g. "models/gemini-2.0-flash"
}

// ===== HANDLER =====
exports.handler = async function (event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  let text;
  try {
    const body = JSON.parse(event.body || '{}');
    text = (body.text || '').trim();
  } catch (_) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Invalid JSON body' }),
    };
  }

  if (!text || text.length < 30) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Text too short (min 30 chars)' }),
    };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log('No GEMINI_API_KEY — returning demo response');
    return { statusCode: 200, headers, body: JSON.stringify(DEMO_RESPONSE) };
  }

  try {
    const modelName = await pickModel(apiKey);
    console.log('Using model:', modelName);

    const res = await fetch(
      `${GEMINI_BASE}/${modelName}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: buildPrompt(text) }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 600 },
        }),
      }
    );

    if (!res.ok) {
      const errBody = await res.text();
      console.error('Gemini generateContent failed:', res.status, errBody);
      return { statusCode: 200, headers, body: JSON.stringify(DEMO_RESPONSE) };
    }

    const json = await res.json();
    const raw = (
      json?.candidates?.[0]?.content?.parts?.[0]?.text || ''
    ).trim();

    const jsonStr = raw
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (_) {
      console.error('Failed to parse Gemini response:', raw);
      return { statusCode: 200, headers, body: JSON.stringify(DEMO_RESPONSE) };
    }

    if (!Array.isArray(parsed.skills)) parsed.skills = DEMO_RESPONSE.skills;
    if (!['Junior', 'Mid', 'Senior'].includes(parsed.level)) parsed.level = 'Mid';
    if (!Array.isArray(parsed.jobTypes)) parsed.jobTypes = DEMO_RESPONSE.jobTypes;
    if (typeof parsed.pitch !== 'string') parsed.pitch = DEMO_RESPONSE.pitch;

    return { statusCode: 200, headers, body: JSON.stringify(parsed) };

  } catch (err) {
    console.error('Gemini API error:', err.message);
    return { statusCode: 200, headers, body: JSON.stringify(DEMO_RESPONSE) };
  }
};
