/* ClinMaker website · v7 behaviour. Small, dependency-free. */
(function () {
  'use strict';
  var doc = document;
  var each = function (sel, fn, root) { Array.prototype.forEach.call((root || doc).querySelectorAll(sel), fn); };

  /* Header: firmer glass once the page scrolls */
  var header = doc.querySelector('.site-header');
  function onScroll() { if (header) header.classList.toggle('scrolled', window.scrollY > 8); }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* Mobile menu */
  var toggle = doc.querySelector('.menu-toggle');
  if (toggle && header) {
    toggle.addEventListener('click', function () {
      var open = header.classList.toggle('menu-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
  }

  /* Dropdowns: click or keyboard opens, Escape or outside click closes */
  var items = Array.prototype.slice.call(doc.querySelectorAll('.nav-item[data-dd]'));
  function closeAll(except) {
    items.forEach(function (it) {
      if (it !== except) { it.classList.remove('open'); var b = it.querySelector('.nav-trigger'); if (b) b.setAttribute('aria-expanded', 'false'); }
    });
  }
  items.forEach(function (it) {
    var btn = it.querySelector('.nav-trigger');
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = !it.classList.contains('open');
      closeAll(it);
      it.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', String(open));
    });
  });
  doc.addEventListener('click', function () { closeAll(null); });
  doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeAll(null); });

  /* Mark the current page in the navigation */
  var here = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  each('.nav-link, .dd-link', function (a) {
    var href = (a.getAttribute('href') || '').split('#')[0].toLowerCase();
    if (href && href === here) {
      a.setAttribute('aria-current', 'page');
      var item = a.closest('.nav-item');
      if (item) { var t = item.querySelector('.nav-trigger'); if (t) t.classList.add('current'); }
    }
  });

  /* Home hero: show the whole product screen, scaled so it fits in the first view */
  var heroShot = doc.querySelector('.hero > .hero-shot');
  if (heroShot) {
    var fitHero = function () {
      if (window.innerWidth < 921) { heroShot.style.width = ''; return; }
      var img = heroShot.querySelector('img');
      var frame = heroShot.querySelector('.glass-frame');
      if (!img || !frame) return;
      heroShot.style.width = '100%';
      var full = frame.getBoundingClientRect().width;
      var imgBox = img.getBoundingClientRect();
      var chrome = full - imgBox.width;
      var below = frame.getBoundingClientRect().bottom - imgBox.bottom;
      var avail = window.innerHeight - (imgBox.top + window.scrollY) - below - 16;
      var ratio = (img.naturalWidth && img.naturalHeight) ? img.naturalWidth / img.naturalHeight : 1496 / 711;
      var target = Math.min(full, Math.max(full * 0.72, avail * ratio + chrome));
      heroShot.style.width = Math.round(target) + 'px';
    };
    fitHero();
    window.addEventListener('resize', fitHero);
    window.addEventListener('load', fitHero);
  }

  /* Horizontal rails: arrow buttons, progress bar, disabled ends */
  each('[data-rail]', function (box) {
    var track = box.querySelector('.xrail');
    if (!track) return;
    var prev = box.querySelector('[data-rail-prev]');
    var next = box.querySelector('[data-rail-next]');
    var bar = box.querySelector('.rail-progress i');
    var step = function () {
      var card = track.firstElementChild;
      var gap = parseFloat(getComputedStyle(track).columnGap) || 18;
      return card ? card.getBoundingClientRect().width + gap : 320;
    };
    var sync = function () {
      var max = track.scrollWidth - track.clientWidth;
      if (prev) prev.disabled = track.scrollLeft <= 2;
      if (next) next.disabled = track.scrollLeft >= max - 2;
      if (bar) {
        var share = max > 0 ? track.clientWidth / track.scrollWidth : 1;
        bar.style.width = (share * 100) + '%';
        bar.style.marginLeft = (max > 0 ? (track.scrollLeft / max) * (1 - share) * 100 : 0) + '%';
      }
    };
    if (prev) prev.addEventListener('click', function () { track.scrollBy({ left: -step(), behavior: 'smooth' }); });
    if (next) next.addEventListener('click', function () { track.scrollBy({ left: step(), behavior: 'smooth' }); });
    track.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    sync();
  });

  /* Expanding cards: click, or a short hover, opens one card */
  each('.xcards', function (row) {
    var cards = Array.prototype.slice.call(row.querySelectorAll('.xcard'));
    var wide = window.matchMedia('(min-width: 921px)');
    var canHover = window.matchMedia('(hover: hover)');
    var timer = null;
    var open = function (card) {
      if (card.classList.contains('is-open')) return;
      cards.forEach(function (c) {
        var on = c === card;
        c.classList.toggle('is-open', on);
        var t = c.querySelector('.x-toggle');
        if (t) t.setAttribute('aria-expanded', String(on));
      });
    };
    cards.forEach(function (c) {
      var t = c.querySelector('.x-toggle');
      if (t) t.addEventListener('click', function () {
        open(c);
        var link = c.querySelector('.x-opened a');
        if (link) setTimeout(function () { link.focus({ preventScroll: true }); }, 450);
      });
      c.addEventListener('mouseenter', function () {
        if (!(wide.matches && canHover.matches)) return;
        clearTimeout(timer);
        timer = setTimeout(function () { open(c); }, 160);
      });
      c.addEventListener('mouseleave', function () { clearTimeout(timer); });
    });
  });

  /* Tabs (any [role=tablist]) */
  each('[role="tablist"]', function (list) {
    var tabs = Array.prototype.slice.call(list.querySelectorAll('[role="tab"]'));
    function select(tab) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        var panel = doc.getElementById(t.getAttribute('aria-controls'));
        if (panel) panel.hidden = !on;
      });
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(t); });
      t.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          var n = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
          select(n); n.focus(); e.preventDefault();
        }
      });
    });
  });

  /* Pricing: build-your-plan configurator */
  var cfg = doc.getElementById('config');
  if (cfg) {
    var labelOf = function (input) { var t = input.closest('.opt'); return t ? t.querySelector('.t').firstChild.textContent.trim() : input.value; };
    var update = function () {
      var mods = Array.prototype.slice.call(cfg.querySelectorAll('input[name="modules"]:checked')).map(labelOf);
      var early = Array.prototype.slice.call(cfg.querySelectorAll('input[name="early"]:checked')).map(labelOf);
      var pick = function (name) { var el = cfg.querySelector('input[name="' + name + '"]:checked'); return el ? labelOf(el) : '—'; };
      var services = Array.prototype.slice.call(cfg.querySelectorAll('input[name="services"]:checked')).map(labelOf);
      var set = function (id, v) { var el = doc.getElementById(id); if (el) el.textContent = v; };
      set('sum-modules', mods.length ? mods.join(', ') : 'None selected yet');
      set('sum-early', early.length ? early.join(', ') : 'None selected');
      set('sum-scale', pick('scale'));
      set('sum-start', pick('start'));
      set('sum-hosting', pick('hosting'));
      set('sum-services', services.length ? services.join(', ') : 'None selected');
      var q = new URLSearchParams();
      q.set('type', 'quote');
      cfg.querySelectorAll('input:checked').forEach(function (i) { q.append(i.name, i.value); });
      var link = doc.getElementById('sum-request');
      if (link) link.href = 'request.html?' + q.toString() + '#request-form';
    };
    cfg.addEventListener('change', update);
    update();
  }

  /* Request form: prefill from the pricing configurator, submit to the form service */
  var form = doc.getElementById('request-form');
  if (form) {
    var params = new URLSearchParams(location.search);
    var type = params.get('type');
    if (type) {
      var map = { demo: 'req-demo', pilot: 'req-pilot', teardown: 'req-teardown', quote: 'req-quote' };
      var box = doc.getElementById(map[type]); if (box) box.checked = true;
    }
    var plan = [];
    ['modules', 'early', 'scale', 'start', 'hosting', 'services'].forEach(function (k) {
      var v = params.getAll(k); if (v.length) plan.push(k + ': ' + v.join(', '));
    });
    var planField = doc.getElementById('f-plan');
    if (planField && plan.length) { planField.value = plan.join('\n'); var wrapP = doc.getElementById('plan-wrap'); if (wrapP) wrapP.hidden = false; }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var status = doc.getElementById('form-status');
      var picked = form.querySelectorAll('input[name="request"]:checked').length;
      if (!picked) { status.hidden = false; status.className = 'form-status warn'; status.textContent = 'Choose at least one: a demo, a pilot, a Protocol Teardown or a quote.'; return; }
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var endpoint = form.getAttribute('action') || '';
      if (endpoint.indexOf('__FORMSPREE_ENDPOINT__') !== -1 || !endpoint) {
        status.hidden = false; status.className = 'form-status warn';
        status.textContent = 'This form is not connected yet. Please email contact@clinmaker.com and we will reply within two business days.';
        return;
      }
      var btn = form.querySelector('button[type="submit"]'); if (btn) btn.disabled = true;
      fetch(endpoint, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
        .then(function (r) {
          status.hidden = false;
          if (r.ok) { status.className = 'form-status ok'; status.textContent = 'Thank you. We have your request and will reply within two business days.'; form.reset(); }
          else { status.className = 'form-status warn'; status.textContent = 'Something went wrong sending the form. Please email contact@clinmaker.com.'; }
        })
        .catch(function () { status.hidden = false; status.className = 'form-status warn'; status.textContent = 'We could not reach the form service. Please email contact@clinmaker.com.'; })
        .then(function () { if (btn) btn.disabled = false; });
    });
  }
})();
