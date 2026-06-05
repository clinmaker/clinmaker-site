/* ClinMaker v4 — shared interactions */

// ─── Mobile nav ──────────────────────────────────────────────────────
function toggleNav() {
  const links = document.querySelector('.nav-links');
  if (links) links.classList.toggle('open');
}

// ─── Active nav link ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const path = (location.pathname.split('/').pop() || 'index.html').replace(/\?.*$/, '');
  const norm = path.replace(/\.html$/, '') || 'index';
  document.querySelectorAll('.nav-links a').forEach((a) => {
    const href = (a.getAttribute('href') || '').replace(/\.html$/, '').replace(/^\//, '');
    if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto:')) return;
    if (href === norm || (norm === 'index' && href === 'index')) a.classList.add('active');
  });
});

// ─── Demo modal ──────────────────────────────────────────────────────
function openDemoModal() {
  const m = document.getElementById('demoModal');
  if (!m) return;
  m.classList.add('open');
  document.body.style.overflow = 'hidden';
  const first = m.querySelector('input,select,textarea');
  if (first) setTimeout(() => first.focus(), 80);
}
function closeDemoModal() {
  const m = document.getElementById('demoModal');
  if (!m) return;
  m.classList.remove('open');
  document.body.style.overflow = '';
}
document.addEventListener('click', (e) => {
  const m = document.getElementById('demoModal');
  if (m && e.target === m) closeDemoModal();
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDemoModal(); });

// ─── Demo form submit ────────────────────────────────────────────────
function handleDemoSubmit(form, e) {
  e.preventDefault();
  const btn = form.querySelector('.form-submit');
  const endpoint = form.action;
  if (!endpoint || endpoint.includes('__FORMSPREE_ENDPOINT__')) { showFormSuccess(form); return; }
  btn.disabled = true; btn.innerHTML = 'Sending…';
  fetch(endpoint, { method: 'POST', body: new FormData(form), headers: { 'Accept': 'application/json' } })
    .then((res) => { if (res.ok) showFormSuccess(form); else throw new Error('fail'); })
    .catch(() => { btn.disabled = false; btn.innerHTML = 'Try again'; alert('Something went wrong. Please email hello@clinmaker.com.'); });
  return false;
}
function showFormSuccess(form) {
  form.outerHTML = `<div class="form-success"><div class="display-3">Request received.</div><p>Someone from the ClinMaker team will reach out within one business day.</p></div>`;
}

// ─── Pricing wizard (used on pricing.html) ──────────────────────────
const wizardState = {
  step: 1,
  answers: { stage: null, scope: null, integrations: null },
  fits: {
    pilot:      { name: 'Early access',  detail: "A scoped pilot on the two prototype modules — Protocol Authoring and Study Build. Run a real protocol through USDM-native authoring, then derive a CDASH study build from the same source. Validation pack included; pilot pricing scaled to study count. Best for sponsors who want a hands-on evaluation on a current trial." },
    sponsor:    { name: 'Program partner', detail: "Multi-study engagement that grows with the platform. Today: Protocol Authoring + Study Build across your active program. As roadmap modules ship — ingestion, validation, coding, reconciliation, SDTM — they join under the same contract. Sponsor library extensions, SSO, priority support. Annual term with multi-year pricing." },
    enterprise: { name: 'Portfolio',      detail: "Portfolio-grade engagement for sponsors at 10+ concurrent studies or with submission-active programs. Dedicated AWS tenancy, optional EU/APAC regional hosting, bring-your-own KMS keys, dedicated solutions architect, 24×7 support with a 1-hour SLA, custom validation scope. Negotiated terms. Includes early-access seats on roadmap modules as they ship." }
  }
};
function wizardSelect(step, value, btnEl) {
  document.querySelectorAll('.wizard-step[data-step="' + step + '"] .wizard-opt').forEach((b) => b.classList.remove('selected'));
  if (btnEl) btnEl.classList.add('selected');
  if (step === 1) wizardState.answers.stage = value;
  if (step === 2) wizardState.answers.scope = value;
  if (step === 3) wizardState.answers.integrations = value;
  setTimeout(() => wizardAdvance(), 260);
}
function wizardAdvance() { if (wizardState.step < 3) wizardGo(wizardState.step + 1); else wizardShowResult(); }
function wizardBack() { if (wizardState.step > 1) wizardGo(wizardState.step - 1); }
function wizardGo(n) {
  wizardState.step = n;
  document.querySelectorAll('.wizard-step').forEach((s) => s.classList.toggle('active', Number(s.dataset.step) === n));
  for (let i = 1; i <= 3; i++) {
    const dot = document.querySelector('.step-dot[data-step="' + i + '"]');
    const rule = document.querySelector('.step-rule[data-step="' + i + '"]');
    if (dot) { dot.classList.remove('active', 'done'); if (i < n) dot.classList.add('done'); else if (i === n) dot.classList.add('active'); }
    if (rule) rule.classList.toggle('done', i < n);
  }
  const back = document.querySelector('.wizard-back');
  if (back) back.disabled = (n === 1);
}
function wizardComputeFit() {
  const { stage, scope, integrations } = wizardState.answers;
  if (stage === 'evaluating' || stage === '1-3') return 'pilot';
  if (stage === 'portfolio') return 'enterprise';
  if (integrations === '10+') return 'enterprise';
  if (scope === 'submission' && stage === '4+') return 'enterprise';
  return 'sponsor';
}
function wizardShowResult() {
  document.querySelectorAll('.wizard-step').forEach((s) => s.classList.remove('active'));
  const prog = document.querySelector('.wizard-progress'); if (prog) prog.style.display = 'none';
  const fitKey = wizardComputeFit();
  const fit = wizardState.fits[fitKey];
  const res = document.querySelector('.wizard-result');
  if (!res) return;
  res.querySelector('.fit-name').textContent = fit.name;
  res.querySelector('.res-detail').textContent = fit.detail;
  const sum = res.querySelector('.res-summary');
  if (sum) {
    const stageLabels = { 'evaluating': 'Evaluating, no live trial yet', '1-3': 'Running 1–3 studies', '4+': 'Running 4+ studies', 'portfolio': 'Portfolio scale (10+)' };
    const scopeLabels = { 'early': 'Phase I–II', 'late': 'Phase III', 'submission': 'Submission-active', 'post': 'Post-market / Phase IV' };
    const intLabels = { '0-2': '0–2 integrations', '3-5': '3–5 integrations', '6-9': '6–9 integrations', '10+': '10 or more integrations' };
    sum.innerHTML = '<div class="res-summary-row"><div class="res-summary-label">Stage</div><div class="res-summary-val">' + (stageLabels[wizardState.answers.stage] || '—') + '</div></div>'
      + '<div class="res-summary-row"><div class="res-summary-label">Scope</div><div class="res-summary-val">' + (scopeLabels[wizardState.answers.scope] || '—') + '</div></div>'
      + '<div class="res-summary-row"><div class="res-summary-label">Integrations</div><div class="res-summary-val">' + (intLabels[wizardState.answers.integrations] || '—') + '</div></div>';
  }
  res.classList.add('active');
  res.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function wizardOpenDemoWithFit() {
  openDemoModal();
  const modal = document.getElementById('demoModal');
  if (!modal) return;
  const fitKey = wizardComputeFit();
  const fit = wizardState.fits[fitKey];
  const msg = modal.querySelector('textarea[name=message]');
  if (msg) {
    const parts = ["Suggested fit: " + fit.name + "."];
    if (wizardState.answers.stage) parts.push("Stage: " + wizardState.answers.stage + ".");
    if (wizardState.answers.scope) parts.push("Scope: " + wizardState.answers.scope + ".");
    if (wizardState.answers.integrations) parts.push("Integrations: " + wizardState.answers.integrations + ".");
    msg.value = parts.join(' ');
  }
}
