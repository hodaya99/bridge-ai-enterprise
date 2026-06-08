const { GoogleGenerativeAI } = require('@google/generative-ai');

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
const PROMPT_TEMPLATE = (text) => `You are an AI career profiler for a job matching platform called Bridge AI.
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

  if (!process.env.GEMINI_API_KEY) {
    console.log('No GEMINI_API_KEY — returning demo response');
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(DEMO_RESPONSE),
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: { temperature: 0.3, maxOutputTokens: 600 },
    });

    const result = await model.generateContent(PROMPT_TEMPLATE(text));
    const raw = result.response.text().trim();

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

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(parsed),
    };

  } catch (err) {
    console.error('Gemini API error:', err.message);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(DEMO_RESPONSE),
    };
  }
};
