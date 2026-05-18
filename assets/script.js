/* ClinMaker marketing site — shared interactions */

// ─── Mobile nav toggle ───────────────────────────────────────────────
function toggleNav() {
  const links = document.querySelector('.nav-links');
  if (links) links.classList.toggle('open');
}

// ─── Demo modal ──────────────────────────────────────────────────────
function openDemoModal() {
  const m = document.getElementById('demoModal');
  if (m) {
    m.classList.add('open');
    document.body.style.overflow = 'hidden';
    // focus first field for accessibility
    const first = m.querySelector('input,select,textarea');
    if (first) setTimeout(() => first.focus(), 80);
  }
}
function closeDemoModal() {
  const m = document.getElementById('demoModal');
  if (m) {
    m.classList.remove('open');
    document.body.style.overflow = '';
  }
}

// Close on overlay click or Esc
document.addEventListener('click', (e) => {
  const m = document.getElementById('demoModal');
  if (m && e.target === m) closeDemoModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeDemoModal();
});

// ─── Demo form submit ────────────────────────────────────────────────
// Replace __FORMSPREE_ENDPOINT__ with the real Formspree (or other) URL.
function handleDemoSubmit(form, e) {
  e.preventDefault();
  const btn = form.querySelector('.form-submit');
  const formData = new FormData(form);
  const endpoint = form.action;

  // If endpoint is still the placeholder, just show success UI
  if (!endpoint || endpoint.includes('__FORMSPREE_ENDPOINT__')) {
    showFormSuccess(form);
    return;
  }

  btn.disabled = true;
  btn.innerHTML = 'Sending...';
  fetch(endpoint, {
    method: 'POST',
    body: formData,
    headers: { 'Accept': 'application/json' }
  })
    .then((res) => {
      if (res.ok) showFormSuccess(form);
      else throw new Error('submission failed');
    })
    .catch(() => {
      btn.disabled = false;
      btn.innerHTML = 'Try again';
      alert('Something went wrong sending your request. Please email hello@clinmaker.com directly.');
    });
  return false;
}

function showFormSuccess(form) {
  const successHTML = `
    <div class="form-success">
      <div class="check">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
        </svg>
      </div>
      <h3>Thanks — we'll be in touch.</h3>
      <p>Someone from the ClinMaker team will reach out within 24 hours to set up your demo.</p>
    </div>
  `;
  // Replace the form contents but keep the container element
  form.outerHTML = `<div class="demo-form-container">${successHTML}</div>`;
}

// ─── Pipeline node click — for platform.html ────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Set active nav link based on current page
  const path = location.pathname.replace(/\/$/, '') || '/';
  document.querySelectorAll('.nav-links a').forEach((a) => {
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#')) return;
    const norm = href.replace(/^\/|\.html$/g, '');
    const cur = path.replace(/^\/|\.html$/g, '') || 'index';
    if (norm === cur || (cur === 'index' && href === 'index.html')) {
      a.classList.add('active');
    }
  });

  // Pipeline node interactivity
  const nodes = document.querySelectorAll('.pipeline-node');
  nodes.forEach((n) => {
    n.addEventListener('click', () => {
      nodes.forEach((x) => x.classList.remove('active'));
      n.classList.add('active');
      // If a feature-detail target exists, swap panels
      const target = n.dataset.target;
      if (target) {
        document.querySelectorAll('.fd-panel').forEach((p) => p.classList.remove('active'));
        const p = document.getElementById(target);
        if (p) p.classList.add('active');
      }
    });
  });

  // Animate stats / kpi bars on scroll
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    document.querySelectorAll('.stat-item, .feature-card, .module-mockup').forEach((el) => io.observe(el));
  }
});
