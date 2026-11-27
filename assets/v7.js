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

  /* The logo on the page it links to: back to the top, without a reload */
  each('a.brand', function (a) {
    var href = (a.getAttribute('href') || '').split('#')[0].split('/').pop().toLowerCase() || 'index.html';
    if (href !== here) return;
    a.addEventListener('click', function (e) {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: still ? 'auto' : 'smooth' });
      if (location.hash && history.replaceState) history.replaceState(null, '', location.pathname + location.search);
    });
  });

  /* Scroll cue: a moment after load, on the first screen only; it leaves for good once the visitor scrolls */
  var cue = doc.querySelector('.scroll-cue');
  if (cue) {
    var cueGone = false;
    var cueScroll = function () { if (window.scrollY > 40) cueLeave(); };
    var cueLeave = function () {
      if (cueGone) return;
      cueGone = true;
      window.removeEventListener('scroll', cueScroll);
      cue.classList.remove('in');
      setTimeout(function () { cue.hidden = true; }, 600);
    };
    window.addEventListener('scroll', cueScroll, { passive: true });
    cue.addEventListener('click', cueLeave);
    setTimeout(function () {
      if (cueGone || window.scrollY > 40) return;
      cue.hidden = false;
      requestAnimationFrame(function () { requestAnimationFrame(function () { cue.classList.add('in'); }); });
    }, 3500);
  }

  /* Recognition notice: slides in once per visit, leaves on its own, ends after its date */
  var toast = doc.getElementById('award-toast');
  if (toast) {
    var until = toast.getAttribute('data-until');
    var expired = until && new Date() > new Date(until + 'T23:59:59');
    var seen = false;
    try { seen = window.sessionStorage.getItem('cm-award') === '1'; } catch (e) {}
    if (!expired && !seen) {
      var timer = null;
      var hide = function () {
        clearTimeout(timer);
        toast.classList.remove('in');
        setTimeout(function () { toast.hidden = true; }, 650);
        try { window.sessionStorage.setItem('cm-award', '1'); } catch (e) {}
      };
      var showToast = function () {
        toast.hidden = false;
        requestAnimationFrame(function () { requestAnimationFrame(function () { toast.classList.add('in'); }); });
        timer = setTimeout(hide, 10000);
      };
      /* On phones it waits until the visitor has scrolled past most of the first screen */
      if (window.matchMedia && window.matchMedia('(max-width: 600px)').matches) {
        var waitScroll = function () {
          if (window.scrollY < window.innerHeight * 0.7) return;
          window.removeEventListener('scroll', waitScroll);
          showToast();
        };
        window.addEventListener('scroll', waitScroll, { passive: true });
      } else {
        setTimeout(showToast, 1600);
      }
      toast.addEventListener('mouseenter', function () { clearTimeout(timer); });
      toast.addEventListener('mouseleave', function () { timer = setTimeout(hide, 4000); });
      toast.addEventListener('focusin', function () { clearTimeout(timer); });
      var close = toast.querySelector('button');
      if (close) close.addEventListener('click', hide);
    }
  }

  /* Horizontal rails: dots that fill while the rail waits, then it moves on one card. Visitors can scroll
     or swipe at any time. It holds while pointed at, focused or off screen, stops at the end, and never
     auto-plays for people who ask for reduced motion. */
  var stillMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var RAIL_ICONS = {
    play: '<path d="M7 4.6v10.8l8.6-5.4z" fill="currentColor"/>',
    pause: '<rect x="5.6" y="4.6" width="3" height="10.8" rx="1" fill="currentColor"/><rect x="11.4" y="4.6" width="3" height="10.8" rx="1" fill="currentColor"/>',
    replay: '<path d="M4.6 10.4a5.6 5.6 0 1 0 1.9-4.6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M6.2 2.6v3.6h3.6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>'
  };
  var RAIL_LABELS = { play: 'Play the cards', pause: 'Pause the cards', replay: 'Play the cards again from the start' };
  each('[data-rail]', function (box) {
    var track = box.querySelector('.xrail');
    if (!track || !track.children.length) return;
    var nav = doc.createElement('div');
    nav.className = 'rail-nav';
    nav.innerHTML = '<div class="rail-dots" role="group" aria-label="Choose cards"></div>' +
      '<button type="button" class="rail-play"><svg viewBox="0 0 20 20" aria-hidden="true"></svg></button>';
    track.insertAdjacentElement('afterend', nav);
    var dots = nav.querySelector('.rail-dots'), play = nav.querySelector('.rail-play'), icon = play.querySelector('svg');
    var cur = 0, count = 0, per = 0, playing = !stillMotion, done = false, settle = null, resized = null;
    var holds = { view: 'IntersectionObserver' in window };

    var gap = function () { return parseFloat(getComputedStyle(track).columnGap) || 20; };
    var step = function () { return track.firstElementChild.getBoundingClientRect().width + gap(); };
    var held = function () { for (var k in holds) if (holds[k]) return true; return false; };
    var paint = function () {
      var state = done ? 'replay' : (playing ? 'pause' : 'play');
      icon.innerHTML = RAIL_ICONS[state];
      play.setAttribute('aria-label', RAIL_LABELS[state]);
      nav.classList.toggle('frozen', !playing || held());
    };
    var restart = function () {
      var f = dots.querySelector('[aria-current="true"] i');
      if (f) { f.style.animation = 'none'; void f.offsetWidth; f.style.animation = ''; }
    };
    var mark = function () {
      Array.prototype.forEach.call(dots.children, function (b, k) {
        if (k === cur) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
      });
      if (!playing) nav.classList.remove('timed');
      restart(); paint();
    };
    var build = function () {
      /* Cards in full view come from the stylesheet; stops come from how far the rail can scroll */
      var p = Math.max(1, parseInt(getComputedStyle(track).getPropertyValue('--per'), 10) || 1);
      var c = Math.max(1, Math.round((track.scrollWidth - track.clientWidth) / step()) + 1);
      if (p === per && c === count && dots.children.length) return;
      per = p; count = c; cur = Math.min(cur, count - 1);
      var html = '';
      for (var k = 0; k < count; k++) {
        html += '<button type="button" aria-label="' + (per > 1 ? 'Cards ' + (k + 1) + ' to ' + Math.min(k + per, track.children.length) : 'Card ' + (k + 1)) +
          '"><span class="d"><i></i></span></button>';
      }
      dots.innerHTML = html;
      nav.hidden = count < 2;
      mark();
    };
    var go = function (k) {
      cur = Math.max(0, Math.min(count - 1, k));
      track.scrollTo({ left: Math.min(cur * step(), track.scrollWidth - track.clientWidth), behavior: stillMotion ? 'instant' : 'smooth' });
      mark();
    };
    var hold = function (k, on) { holds[k] = on; paint(); };

    dots.addEventListener('animationend', function () {
      if (!playing || held()) return;
      if (cur >= count - 1) { done = true; playing = false; nav.classList.remove('timed'); paint(); return; }
      go(cur + 1);
    });
    dots.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      done = false;
      go(Array.prototype.indexOf.call(dots.children, b));
    });
    play.addEventListener('click', function () {
      if (done) { done = false; playing = true; nav.classList.add('timed'); go(0); return; }
      playing = !playing;
      if (playing) nav.classList.add('timed');
      paint();
    });
    /* Visitors scroll freely; the dots follow, and the wait starts again from the card they chose */
    track.addEventListener('scroll', function () {
      clearTimeout(settle);
      settle = setTimeout(function () {
        var max = track.scrollWidth - track.clientWidth;
        var k = track.scrollLeft >= max - 2 ? count - 1 : Math.round(track.scrollLeft / step());
        if (k !== cur) { cur = k; done = false; mark(); }
      }, 140);
    }, { passive: true });
    track.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') hold('hover', true); });
    track.addEventListener('pointerleave', function () { hold('hover', false); });
    track.addEventListener('focusin', function () { hold('focus', true); });
    track.addEventListener('focusout', function (e) { if (!track.contains(e.relatedTarget)) hold('focus', false); });
    doc.addEventListener('visibilitychange', function () { hold('tab', doc.hidden); });
    doc.addEventListener('cm-sheet', function (e) { hold('sheet', !!e.detail); });
    if (holds.view) {
      new IntersectionObserver(function (en) { hold('view', en[0].intersectionRatio < 0.5); }, { threshold: [0, 0.5, 1] }).observe(track);
    }
    window.addEventListener('resize', function () { clearTimeout(resized); resized = setTimeout(build, 150); });
    if (playing) nav.classList.add('timed');
    build();
  });

  /* Award highlight: the wreath grows in once the card is well in view */
  if (!stillMotion && 'IntersectionObserver' in window) {
    each('.award-hl', function (sec) {
      var card = sec.querySelector('.award-card') || sec;
      sec.classList.add('armed');
      var seen = new IntersectionObserver(function (en) {
        if (en[0].intersectionRatio < 0.45) return;
        sec.classList.add('in-view');
        seen.disconnect();
      }, { threshold: [0, 0.45] });
      seen.observe(card);
    });
  }

  /* Tile sheets: a card's "+" (or the card itself) opens a little more in a sheet over the blurred page.
     A native modal dialog keeps focus inside, closes on Esc, and returns focus to the card's button. */
  var sheetSources = doc.querySelectorAll('template.uc-more');
  var sheetLinks = doc.querySelectorAll('[data-sheet]');
  if ((sheetSources.length || sheetLinks.length) && typeof HTMLDialogElement === 'function') {
    var sheet = doc.createElement('dialog');
    sheet.className = 'sheet';
    sheet.setAttribute('aria-labelledby', 'sheet-h');
    sheet.innerHTML = '<button type="button" class="sheet-close" aria-label="Close"><svg viewBox="0 0 20 20" aria-hidden="true">' +
      '<path d="M5.5 5.5l9 9M14.5 5.5l-9 9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button><div class="sheet-body"></div>';
    doc.body.appendChild(sheet);
    var sheetBody = sheet.querySelector('.sheet-body');
    var openSheet = function (tpl) {
      sheetBody.innerHTML = '';
      sheetBody.appendChild(tpl.content.cloneNode(true));
      if (stillMotion) Array.prototype.forEach.call(sheetBody.querySelectorAll('video[autoplay]'), function (v) { v.removeAttribute('autoplay'); });
      var h = sheetBody.querySelector('h2');
      if (h) h.id = 'sheet-h';
      sheet.showModal();
      sheet.scrollTop = 0;
      doc.dispatchEvent(new CustomEvent('cm-sheet', { detail: true }));
    };
    sheet.addEventListener('close', function () {
      Array.prototype.forEach.call(sheetBody.querySelectorAll('video'), function (v) { v.pause(); });
      doc.dispatchEvent(new CustomEvent('cm-sheet', { detail: false }));
    });
    /* Links that open a sheet (the walkthrough); without JS they go to the page they name */
    Array.prototype.forEach.call(sheetLinks, function (link) {
      var tpl = doc.getElementById(link.getAttribute('data-sheet'));
      if (!tpl || !tpl.content) return;
      link.setAttribute('aria-haspopup', 'dialog');
      link.addEventListener('click', function (e) {
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        openSheet(tpl);
      });
    });
    sheet.querySelector('.sheet-close').addEventListener('click', function () { sheet.close(); });
    sheet.addEventListener('click', function (e) {
      if (e.target !== sheet) return;
      var r = sheet.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) sheet.close();
    });
    Array.prototype.forEach.call(sheetSources, function (tpl) {
      var card = tpl.parentElement, btn = card.querySelector('.uc-plus');
      if (!btn) return;
      btn.hidden = false;
      card.classList.add('has-sheet');
      btn.addEventListener('click', function (e) { e.stopPropagation(); openSheet(tpl); });
      card.addEventListener('click', function (e) {
        if (e.target.closest('a, button') || String(window.getSelection())) return;
        btn.focus({ preventScroll: true });
        openSheet(tpl);
      });
    });
  }

  /* Scroll reveal: content that starts below the fold eases in once as it arrives. Items that arrive
     together are staggered. Nothing above the fold is touched, and nothing moves for reduced motion. */
  if (!stillMotion && 'IntersectionObserver' in window) {
    var GROUPS = '.feat-grid, .why-list, .why-grid, .gap-grid, .included, .team, .steps, .stage-defs, .co-grid, .stats, .proof-row, ' +
      '.opts, .price-parts, .ben-row, .vals, .incl, .eq, [data-rail]';
    var UNITS = '.sec-head, .team-head, .xcards, main figure, .ctl-card, .faq, .placeholder, .std-line, .spec-list, .prose, ' +
      '.status-strip, .ticks, .handoff, .split, .form-card, .note-side, .letter, .td, .chips, .cmp-note, .rates-note, .incl-note, .next-hook';
    var picked = [];
    var take = function (el) {
      for (var k = 0; k < picked.length; k++) if (picked[k] === el || picked[k].contains(el) || el.contains(picked[k])) return;
      picked.push(el);
    };
    each(GROUPS, function (g) { Array.prototype.forEach.call(g.children, take); });
    each(UNITS, take);
    var fold = window.innerHeight * 0.92;
    var waiting = picked.filter(function (el) {
      if (el.getBoundingClientRect().top < fold || el.closest('.site-header, .award-toast')) return false;
      el.classList.add('rv');
      return true;
    });
    var seen = new IntersectionObserver(function (entries) {
      var batch = entries.filter(function (e) { return e.isIntersecting; }).map(function (e) { return e.target; });
      batch.sort(function (a, b) { return a.compareDocumentPosition(b) & 4 ? -1 : 1; });
      batch.forEach(function (el, k) {
        var d = Math.min(k * 0.08, 0.32);
        seen.unobserve(el);
        el.style.setProperty('--rv-d', d + 's');
        el.classList.add('in');
        setTimeout(function () { el.classList.remove('rv', 'in'); el.style.removeProperty('--rv-d'); }, (d + 1) * 1000);
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    waiting.forEach(function (el) { seen.observe(el); });
    /* At the very bottom of the page nothing can scroll higher, so show whatever is on screen */
    var atEnd = function () {
      if (window.innerHeight + window.scrollY < doc.documentElement.scrollHeight - 2) return;
      waiting.forEach(function (el) {
        if (el.classList.contains('rv') && !el.classList.contains('in') && el.getBoundingClientRect().top < window.innerHeight) {
          seen.unobserve(el); el.classList.add('in');
          setTimeout(function () { el.classList.remove('rv', 'in'); }, 1000);
        }
      });
    };
    window.addEventListener('scroll', atEnd, { passive: true });
  }

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

  /* Request form: pre-select the request type from the link, submit to the form service */
  var form = doc.getElementById('request-form');
  if (form) {
    var params = new URLSearchParams(location.search);
    var type = params.get('type');
    if (type) {
      var map = { demo: 'req-demo', early: 'req-pilot', pilot: 'req-pilot', teardown: 'req-demo', quote: 'req-quote' };
      var box = doc.getElementById(map[type]); if (box) box.checked = true;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var status = doc.getElementById('form-status');
      var picked = form.querySelectorAll('input[name="request"]:checked').length;
      if (!picked) { status.hidden = false; status.className = 'form-status warn'; status.textContent = 'Choose at least one: a demo, the early adopter program or a quote.'; return; }
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

  /* Walkthrough player: plays only when asked; says so plainly if the recording isn't there yet */
  Array.prototype.forEach.call(doc.querySelectorAll('[data-video]'), function (fig) {
    var video = fig.querySelector('video'), cover = fig.querySelector('.vp-cover'), msg = fig.querySelector('.vp-msg');
    if (!video || !cover) return;
    var sources = video.querySelectorAll('source'), failed = 0;
    function missing() {
      video.pause(); video.hidden = true; cover.hidden = false;
      cover.setAttribute('aria-disabled', 'true');
      if (msg) msg.hidden = false;
    }
    Array.prototype.forEach.call(sources, function (s) {
      s.addEventListener('error', function () { failed += 1; if (failed >= sources.length) missing(); });
    });
    video.addEventListener('error', missing);
    cover.addEventListener('click', function () {
      if (cover.getAttribute('aria-disabled') === 'true') return;
      cover.hidden = true; video.hidden = false;
      var p = video.play(); if (p && p.catch) p.catch(function () {});
      video.focus();
    });
  });
})();
