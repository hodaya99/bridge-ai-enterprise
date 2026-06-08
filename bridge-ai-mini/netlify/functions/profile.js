const { OpenAI } = require('openai');

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

// ===== SYSTEM PROMPT =====
const SYSTEM_PROMPT = `You are an AI career profiler for a job matching platform called Bridge AI.
Analyze the candidate description or CV text provided by the user and extract structured information.

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
5. Return ONLY the JSON object — no markdown, no explanation, no code fences`;

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

  // No API key → demo
  if (!process.env.OPENAI_API_KEY) {
    console.log('No OPENAI_API_KEY — returning demo response');
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(DEMO_RESPONSE),
    };
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: text },
      ],
      temperature: 0.3,
      max_tokens: 600,
    });

    const raw = (completion.choices[0].message.content || '').trim();

    const jsonStr = raw
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();

    let result;
    try {
      result = JSON.parse(jsonStr);
    } catch (_) {
      console.error('Failed to parse OpenAI response:', raw);
      return { statusCode: 200, headers, body: JSON.stringify(DEMO_RESPONSE) };
    }

    // Validate structure
    if (!Array.isArray(result.skills)) result.skills = DEMO_RESPONSE.skills;
    if (!['Junior', 'Mid', 'Senior'].includes(result.level)) result.level = 'Mid';
    if (!Array.isArray(result.jobTypes)) result.jobTypes = DEMO_RESPONSE.jobTypes;
    if (typeof result.pitch !== 'string') result.pitch = DEMO_RESPONSE.pitch;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result),
    };

  } catch (err) {
    console.error('OpenAI API error:', err.message);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(DEMO_RESPONSE),
    };
  }
};
