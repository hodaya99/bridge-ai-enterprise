# Test Inputs – bridge-ai-enterprise
### Features 1a · 1b · 1c

---

## How to use this file

1. Open ChatGPT (Custom GPT) or Claude (Project)
2. Paste the matching **system prompt** from `system_prompts_features_1a_1b_1c.md` into the instructions
3. Paste the **sample input** below into the chat
4. Check the output against the **"What to look for"** checklist
5. If something is wrong, fix the system prompt and retest

---

## Feature 1b – Interviewer Agent

### What to paste as instructions
> The full system prompt from the **Feature 1b** section of `system_prompts_features_1a_1b_1c.md`

---

### Test 1 — Normal intro stage

**Paste this as your first message:**

```
interview_stage: "intro"

candidate_profile:
{
  "cv_text": "Noa Cohen. B.Sc. Computer Science, Hebrew University, 3rd year. Projects: built a React-based task manager app, wrote a Python script for data scraping. GPA 89.",
  "linkedin_summary": "CS student passionate about frontend development and UX. Completed an internship at a startup building internal tools.",
  "free_text_interests": "I want to work in product-focused companies. I enjoy building things people actually use. Interested in frontend or full-stack roles."
}

user_message: "Hi, I'm ready to start."
```

**What to look for:**
- [ ] AI greets warmly and professionally
- [ ] Asks exactly ONE question (not two or three stacked together)
- [ ] Question is about studies, projects, or career direction
- [ ] Does NOT repeat info already in the CV (e.g. doesn't ask "what are you studying?")
- [ ] Does NOT mention match scores or other candidates

---

### Test 2 — Short answer (under 20 words)

**Paste this after Test 1:**

```
interview_stage: "deep-dive"

user_message: "I built a React app."
```

**What to look for:**
- [ ] AI does NOT advance to the next stage
- [ ] AI asks a probing follow-up question about the React app (scale, decisions, challenges)
- [ ] Still only ONE question per turn

---

### Test 3 — Complete stage (DNA Profile generation)

**Paste this:**

```
interview_stage: "complete"

chat_history: [
  { "role": "assistant", "content": "Tell me about your most challenging project." },
  { "role": "user", "content": "I built a full-stack task manager with React and Node.js. The hardest part was designing the real-time sync feature — I used WebSockets and had to debug race conditions for two weeks." },
  { "role": "assistant", "content": "What did you learn from that experience?" },
  { "role": "user", "content": "I learned to read documentation carefully and how to think about async state. I also got much better at debugging by writing proper logs." }
]
```

**What to look for:**
- [ ] AI outputs ONLY a JSON object — no conversational text
- [ ] JSON contains `academic_dna` with all required fields
- [ ] At least 3 entries in `recommended_role_categories`, each with a score and reasoning
- [ ] `knowledge_gaps` field is present and not empty
- [ ] No mention of match scores or database operations

---

## Feature 1c – HR Profiler Agent

### What to paste as instructions
> The full system prompt from the **Feature 1c** section of `system_prompts_features_1a_1b_1c.md`

---

### Test 1 — Normal job description

**Paste this:**

```
job_title: "Full Stack Developer"

job_description_free_text: "We are looking for a talented Full Stack Developer to join our growing team. The ideal candidate is a self-starter who thrives in a fast-paced environment. You will work with React on the frontend and Node.js on the backend. Experience with MongoDB is a plus. Must have excellent communication skills and be a team player. We value people who take ownership of their work."

structured_fields: {
  "degree_required": "B.Sc. Computer Science or equivalent",
  "experience_years": 2,
  "military_background_required": false,
  "company_linkedin_url": "https://linkedin.com/company/example-tech"
}
```

**What to look for:**
- [ ] Output is pure JSON — no prose, no markdown headers
- [ ] `technical_skills` includes React (Required), Node.js (Required), MongoDB (Preferred)
- [ ] `soft_skills` translates "self-starter", "team player", "fast-paced" into concrete behavioral traits
- [ ] `original_phrase` field preserved for each soft skill
- [ ] `degree_required` and `experience_years` match the structured_fields
- [ ] No skills invented that weren't in the description

---

### Test 2 — Vague job description (edge case)

**Paste this:**

```
job_title: "Innovation Specialist"

job_description_free_text: "We need a passionate, driven individual who is excited about technology and wants to make an impact. Must be a good communicator and work well with others."

structured_fields: {
  "degree_required": null,
  "experience_years": null,
  "military_background_required": false,
  "company_linkedin_url": null
}
```

**What to look for:**
- [ ] `technical_skills` array is empty (no hallucinated skills)
- [ ] `extraction_warning` field is NOT null — contains a message about insufficient detail
- [ ] Soft skills are extracted and translated even from vague text
- [ ] Output is still valid JSON

---

### Test 3 — Military background required

**Paste this:**

```
job_title: "Cybersecurity Analyst"

job_description_free_text: "Looking for an experienced cybersecurity professional. Must have hands-on experience with penetration testing, network security, and SIEM tools. Experience from military intelligence units (8200, Mamram) is a strong advantage. The candidate must handle pressure well and maintain confidentiality at all times."

structured_fields: {
  "degree_required": "B.Sc. in Computer Science, Information Security, or equivalent",
  "experience_years": 3,
  "military_background_required": true,
  "company_linkedin_url": "https://linkedin.com/company/cyberfirm"
}
```

**What to look for:**
- [ ] `military_background` is `true` in the output
- [ ] Technical skills include penetration testing, network security, SIEM (all Required)
- [ ] "handle pressure" and "maintain confidentiality" are translated into behavioral traits
- [ ] Military unit names (8200, Mamram) are NOT included as technical skills

---

## Feature 1a – Match Engine

### What to paste as instructions
> The full system prompt from the **Feature 1a** section of `system_prompts_features_1a_1b_1c.md`

---

### Test 1 — Strong match

**Paste this:**

```
candidate_skills: {
  "professional_strengths": ["React development", "Node.js backend", "REST API design"],
  "transferable_skills": ["collaborative problem-solving", "independent task ownership"],
  "recommended_role_categories": [
    { "role": "Full Stack Developer", "score": 91 },
    { "role": "Frontend Engineer", "score": 85 }
  ],
  "knowledge_gaps": ["Docker", "CI/CD pipelines"]
}

job_requirements: {
  "job_title": "Full Stack Developer",
  "technical_skills": [
    { "skill": "React", "level": "Required" },
    { "skill": "Node.js", "level": "Required" },
    { "skill": "Docker", "level": "Preferred" },
    { "skill": "MongoDB", "level": "Nice to Have" }
  ],
  "soft_skills": [
    { "trait": "collaborative problem-solving", "level": "Required" }
  ],
  "military_background": false
}
```

**What to look for:**
- [ ] `match_score` is between 75–90 (strong match but missing Docker)
- [ ] `mutual_match` is `true`
- [ ] `missing_required_skills` is empty or only contains non-Required skills
- [ ] `matched_skills` includes React, Node.js, collaborative problem-solving
- [ ] Output is JSON only — no prose

---

### Test 2 — Weak match

**Paste this:**

```
candidate_skills: {
  "professional_strengths": ["Python data analysis", "Pandas", "Jupyter Notebooks"],
  "transferable_skills": ["attention to detail", "analytical thinking"],
  "recommended_role_categories": [
    { "role": "Data Analyst", "score": 88 }
  ],
  "knowledge_gaps": ["React", "Node.js", "cloud infrastructure"]
}

job_requirements: {
  "job_title": "Frontend Developer",
  "technical_skills": [
    { "skill": "React", "level": "Required" },
    { "skill": "TypeScript", "level": "Required" },
    { "skill": "CSS", "level": "Required" },
    { "skill": "GraphQL", "level": "Preferred" }
  ],
  "soft_skills": [
    { "trait": "fast iterative delivery under deadline pressure", "level": "Required" }
  ],
  "military_background": false
}
```

**What to look for:**
- [ ] `match_score` is low — below 40
- [ ] `mutual_match` is `false`
- [ ] `missing_required_skills` lists React, TypeScript, CSS
- [ ] Score is NOT inflated just because the candidate has some tech skills

---

### Test 3 — Military background mismatch

**Paste this:**

```
candidate_skills: {
  "professional_strengths": ["penetration testing", "network security", "SIEM tools"],
  "transferable_skills": ["confidentiality", "high-pressure performance"],
  "recommended_role_categories": [
    { "role": "Cybersecurity Analyst", "score": 90 }
  ],
  "knowledge_gaps": []
}

job_requirements: {
  "job_title": "Cybersecurity Analyst",
  "technical_skills": [
    { "skill": "penetration testing", "level": "Required" },
    { "skill": "SIEM tools", "level": "Required" },
    { "skill": "network security", "level": "Required" }
  ],
  "soft_skills": [
    { "trait": "high-pressure performance", "level": "Required" }
  ],
  "military_background": true
}
```

> Note: assume the candidate has NO military background.

**What to look for:**
- [ ] Base technical score would be very high (~95)
- [ ] Final `match_score` is reduced by 10 points due to military background mismatch
- [ ] `mutual_match` is still `true` if score ≥ 75 after deduction
- [ ] The deduction is reflected — score should be ~85, not 95
