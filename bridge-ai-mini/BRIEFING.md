# Bridge AI – Mini MVP | סיכום פרויקט לכלי AI

## מה הפרויקט?
אפליקציה חד-עמודית (HTML/CSS/JS + Netlify Function) שמקבלת קורות חיים או תיאור חופשי של מועמד לעבודה, שולחת ל-OpenAI API, ומחזירה פרופיל מקצועי מובנה.

---

## מבנה הקבצים (כולם כבר קיימים בתיקייה)

```
bridge-ai-mini/
├── index.html              ← מסך יחיד, textarea + כרטיס תוצאה
├── style.css               ← עיצוב RTL, כרטיסים, animations
├── app.js                  ← לוגיקת frontend: fetch, render, error, loading
├── package.json            ← dependency: openai ^4.52.0
├── netlify.toml            ← הגדרות Netlify
├── .gitignore
└── netlify/
    └── functions/
        └── profile.js      ← serverless function: קורא ל-OpenAI ומחזיר JSON
```

---

## מה ה-AI עושה?

המשתמש מדביק טקסט חופשי (קו"ח / תיאור ניסיון) → הפונקציה שולחת ל-`gpt-4o-mini` → ה-AI מחזיר JSON מובנה:

```json
{
  "skills": ["skill1", "skill2", "skill3", "skill4", "skill5"],
  "level": "Junior" | "Mid" | "Senior",
  "jobTypes": ["תפקיד 1", "תפקיד 2", "תפקיד 3"],
  "pitch": "שתי משפטים בעברית המתארים את המועמד למעסיקים"
}
```

אם אין `OPENAI_API_KEY` – מוחזרת תשובת demo מוכנה (האפליקציה לא קורסת).

---

## מה צריך לעשות עכשיו?

### 1. תקן את בעיית PowerShell (execution policy)
פתח PowerShell והרץ:
```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```
אשר עם `Y`.

### 2. התקן dependencies והרץ מקומית
```bash
cd "bridge-ai-mini"
npm install -g netlify-cli
npm install
netlify dev
```
פתח דפדפן על `http://localhost:8888`

### 3. הגדר OpenAI API Key
צור קובץ `.env` בתוך `bridge-ai-mini/`:
```
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx
```
(המפתח מ-platform.openai.com)

### 4. Deploy לנטליפיי
- היכנס ל-netlify.com
- חבר את ה-GitHub repository
- הוסף Environment Variable: `OPENAI_API_KEY`
- לחץ Deploy

---

## Stack טכנולוגי
- Frontend: HTML + CSS + Vanilla JS (ללא framework)
- Backend: Netlify Serverless Function (Node.js)
- AI: OpenAI API – model `gpt-4o-mini`
- Deployment: Netlify (חינמי)

---

## מה לא קיים בכוונה (הוסר לצורך Mini MVP)
- אין Login / Auth
- אין Database
- אין ממשק Swipe
- אין צד HR
- אין העלאת קובץ CV
- אין שמירת היסטוריה

---

## אם משהו לא עובד
- שגיאת npm/PowerShell → ראה שלב 1 למעלה
- ה-AI מחזיר demo במקום תוצאה אמיתית → בדוק שה-`.env` קיים עם המפתח הנכון
- שגיאת CORS → הפונקציה כבר מטפלת בזה, ודא שאתה רץ דרך `netlify dev` ולא ישירות דרך הקובץ
