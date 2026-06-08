// ===== MAIN ANALYZE FUNCTION =====
async function analyzeProfile() {
  const input = document.getElementById('cv-input').value.trim();

  if (!input) {
    showError('אנא הכנס תיאור או קורות חיים לפני הניתוח.');
    return;
  }
  if (input.length < 30) {
    showError('התיאור קצר מדי. אנא הכנס לפחות 30 תווים.');
    return;
  }

  setLoading(true);
  hideError();
  hideResult();
  hideDemoBanner();

  try {
    const response = await fetch('/.netlify/functions/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: input }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || 'שגיאה בשרת. קוד: ' + response.status);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    if (data.demo) {
      showDemoBanner();
    }

    renderResult(data);

  } catch (err) {
    const msg = err.message || 'שגיאה לא ידועה';
    showError('שגיאה בניתוח הפרופיל: ' + msg + '. אנא נסה שוב.');
  } finally {
    setLoading(false);
  }
}

// ===== RENDER RESULT =====
function renderResult(data) {
  const levelEl = document.getElementById('experience-level');
  const level = (data.level || 'Unknown').trim();
  levelEl.textContent = translateLevel(level);
  levelEl.className = 'level-badge level-' + level.toLowerCase();

  const skillsContainer = document.getElementById('skills-list');
  skillsContainer.innerHTML = '';
  const skills = Array.isArray(data.skills) ? data.skills : [];
  if (skills.length === 0) {
    skillsContainer.innerHTML = '<span style="color:#9ca3af">לא זוהו כישורים</span>';
  } else {
    skills.forEach(function (skill) {
      const tag = document.createElement('span');
      tag.className = 'skill-tag';
      tag.textContent = skill;
      skillsContainer.appendChild(tag);
    });
  }

  const jobsContainer = document.getElementById('job-types');
  jobsContainer.innerHTML = '';
  const jobTypes = Array.isArray(data.jobTypes) ? data.jobTypes : [];
  if (jobTypes.length === 0) {
    jobsContainer.innerHTML = '<span style="color:#9ca3af">לא זוהו תפקידים</span>';
  } else {
    jobTypes.forEach(function (job, i) {
      const item = document.createElement('div');
      item.className = 'job-item';
      const numEl = document.createElement('span');
      numEl.className = 'job-num';
      numEl.textContent = i + 1;
      const textEl = document.createElement('span');
      textEl.textContent = job;
      item.appendChild(numEl);
      item.appendChild(textEl);
      jobsContainer.appendChild(item);
    });
  }

  document.getElementById('candidate-pitch').textContent = data.pitch || 'לא זוהה תיאור.';

  document.getElementById('result-card').classList.remove('hidden');
  document.getElementById('result-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ===== TRANSLATE LEVEL =====
function translateLevel(level) {
  const map = {
    junior: 'Junior – מתחיל',
    mid: 'Mid – בינוני',
    senior: 'Senior – בכיר',
  };
  return map[level.toLowerCase()] || level;
}

// ===== RESET =====
function resetForm() {
  document.getElementById('cv-input').value = '';
  hideResult();
  hideError();
  hideDemoBanner();
  document.getElementById('cv-input').focus();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===== LOADING STATE =====
function setLoading(isLoading) {
  const btn = document.getElementById('analyze-btn');
  const btnText = document.getElementById('btn-text');
  const btnLoader = document.getElementById('btn-loader');
  btn.disabled = isLoading;
  if (isLoading) {
    btnText.classList.add('hidden');
    btnLoader.classList.remove('hidden');
  } else {
    btnText.classList.remove('hidden');
    btnLoader.classList.add('hidden');
  }
}

// ===== UI HELPERS =====
function showError(msg) {
  const el = document.getElementById('error-message');
  el.textContent = msg;
  el.classList.remove('hidden');
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideError() {
  document.getElementById('error-message').classList.add('hidden');
}

function hideResult() {
  document.getElementById('result-card').classList.add('hidden');
}

function showDemoBanner() {
  document.getElementById('demo-banner').classList.remove('hidden');
}

function hideDemoBanner() {
  document.getElementById('demo-banner').classList.add('hidden');
}
