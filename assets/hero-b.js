/* Hero B: each highlighted phrase in the protocol flies through the ClinMaker mark and lands in the
   casebook as its CDASH field. Visitors can pick a protocol section (adverse events, vital signs,
   eligibility) and, once a build is done, click any highlighted phrase to send it again.
   One clock drives everything, so pause, off-screen holds, replay and switching are exact.
   Reduced motion: each section shows its finished state. */
(function () {
  'use strict';
  var stage = document.querySelector('.tb-stage');
  var cap = document.querySelector('.tb-foot');
  if (!stage || !cap) return;
  var docCard = stage.querySelector('.tb-doc');
  var rowsBox = stage.querySelector('.tb-rows');
  var formName = stage.querySelector('.tb-form .head b');
  var colLabel = stage.querySelectorAll('.tb-cols span')[1];
  var refLabel = stage.querySelector('.tb-col .tb-label small');
  var capText = cap.querySelector('span');
  var hub = stage.querySelector('.tb-bridge svg.mark');
  var link = stage.querySelector('.tb-real-link');
  var picks = document.querySelector('.tb-picks');
  var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* The sections: adverse events is what the page shows first; the others come from templates */
  var sets = {
    ae: { doc: docCard.innerHTML, rows: rowsBox.innerHTML, form: formName.textContent, col: colLabel.textContent,
          ref: refLabel.textContent, cap: capText.textContent, real: true }
  };
  Array.prototype.forEach.call(document.querySelectorAll('template.tb-set'), function (t) {
    var frag = t.content;
    sets[t.getAttribute('data-set')] = {
      doc: frag.querySelector('.doc').innerHTML, rows: frag.querySelector('.rows').innerHTML,
      form: t.getAttribute('data-form'), col: t.getAttribute('data-col'), ref: t.getAttribute('data-ref'),
      cap: t.getAttribute('data-cap'), real: false
    };
  });
  var current = 'ae', marks = [], rows = [];

  /* Which rows each phrase lands in: data-rows="0,1" sends one phrase to two fields; otherwise the next row */
  var map = function () {
    marks = Array.prototype.slice.call(docCard.querySelectorAll('mark'));
    rows = Array.prototype.slice.call(rowsBox.querySelectorAll('.tb-row'));
    var next = 0;
    marks.forEach(function (m) {
      var listed = m.getAttribute('data-rows');
      var idx = listed ? listed.split(',').map(Number) : [next];
      m._rows = idx.map(function (i) { return rows[i]; }).filter(Boolean);
      next = Math.max.apply(null, idx) + 1;
    });
  };
  var apply = function (key) {
    var s = sets[key];
    docCard.innerHTML = s.doc; rowsBox.innerHTML = s.rows;
    formName.textContent = s.form; colLabel.textContent = s.col; refLabel.textContent = s.ref; capText.textContent = s.cap;
    stage.classList.toggle('no-real', !s.real);
    current = key;
    map();
  };
  var finalState = function () {
    marks.forEach(function (m) { m.classList.remove('on'); m.classList.add('done'); });
    rows.forEach(function (r) { r.classList.add('in'); });
    stage.classList.add('done');
  };
  map();

  /* Section choices (shown only when this script runs) */
  var tabs = picks ? Array.prototype.slice.call(picks.querySelectorAll('[role="tab"]')) : [];
  if (picks) picks.hidden = false;

  if (still || !window.requestAnimationFrame) {
    finalState();
    tabs.forEach(function (t) {
      t.addEventListener('click', function () {
        tabs.forEach(function (x) { x.setAttribute('aria-selected', String(x === t)); });
        stage.classList.remove('done'); apply(t.getAttribute('data-set')); finalState();
      });
    });
    return;
  }

  /* The control, beside the caption */
  var ICONS = {
    pause: '<rect x="5.6" y="4.6" width="3" height="10.8" rx="1" fill="currentColor"/><rect x="11.4" y="4.6" width="3" height="10.8" rx="1" fill="currentColor"/>',
    play: '<path d="M7 4.6v10.8l8.6-5.4z" fill="currentColor"/>',
    replay: '<path d="M4.6 10.4a5.6 5.6 0 1 0 1.9-4.6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M6.2 2.6v3.6h3.6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
  };
  var LABELS = { pause: 'Pause the animation', play: 'Play the animation', replay: 'Play the animation again' };
  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'hb-ctl';
  btn.innerHTML = '<svg viewBox="0 0 20 20" aria-hidden="true"></svg>';
  cap.appendChild(btn);
  var icon = btn.querySelector('svg');

  var paused = false, offscreen = false, tabHidden = false, done = false, started = false, swapping = false, nudged = false;
  var held = function () { return paused || offscreen || tabHidden; };
  var paint = function () {
    var state = done ? 'replay' : (paused ? 'play' : 'pause');
    icon.innerHTML = ICONS[state];
    btn.setAttribute('aria-label', LABELS[state]);
  };

  /* One clock: time only advances while nothing holds it */
  var clock = 0, last = 0, tasks = [], flights = [];
  var at = function (ms, fn) { tasks.push({ t: clock + ms, fn: fn }); };
  var FLY = 980;
  var ease = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };

  /* A phrase in flight, along a curve, turning into its CDASH name as it crosses the mark */
  var launch = function (mark, row) {
    var box = stage.getBoundingClientRect(), a = mark.getBoundingClientRect();
    var target = row.querySelector('code') || row, b = target.getBoundingClientRect();
    var chip = document.createElement('span');
    chip.className = 'tb-fly';
    chip.setAttribute('aria-hidden', 'true');
    chip.innerHTML = '<span class="p"></span><span class="v"></span>';
    chip.firstChild.textContent = mark.getAttribute('data-short') || mark.textContent;
    chip.lastChild.textContent = row.getAttribute('data-var');
    stage.appendChild(chip);
    var w = chip.offsetWidth, h = chip.offsetHeight;
    var x0 = a.left - box.left + a.width / 2 - w / 2, y0 = a.top - box.top + a.height / 2 - h / 2;
    var x1 = b.left - box.left + b.width / 2 - w / 2, y1 = b.top - box.top + b.height / 2 - h / 2;
    var wide = Math.abs(x1 - x0) > Math.abs(y1 - y0);
    var cx = wide ? (x0 + x1) / 2 : Math.max(x0, x1) + 70, cy = wide ? Math.min(y0, y1) - 70 : (y0 + y1) / 2;
    flights.push({ chip: chip, row: row, x0: x0, y0: y0, x1: x1, y1: y1, cx: cx, cy: cy, t0: clock, morphed: false, pulsed: false, landed: false });
  };
  var step = function (f) {
    var p = Math.min(1, (clock - f.t0) / FLY), e = ease(p), q = 1 - e;
    var x = q * q * f.x0 + 2 * q * e * f.cx + e * e * f.x1;
    var y = q * q * f.y0 + 2 * q * e * f.cy + e * e * f.y1;
    var s = 1 + 0.06 * Math.sin(Math.PI * e);
    var o = p < .12 ? p / .12 : (p > .9 ? Math.max(0, (1 - p) / .1) : 1);
    f.chip.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) scale(' + s.toFixed(3) + ')';
    f.chip.style.opacity = o.toFixed(3);
    if (!f.pulsed && e >= .42) { f.pulsed = true; if (hub) { hub.classList.remove('pulse'); void hub.getBoundingClientRect(); hub.classList.add('pulse'); } }
    if (!f.morphed && e >= .5) { f.morphed = true; f.chip.classList.add('var'); }
    if (!f.landed && p >= .86) { f.landed = true; f.row.classList.remove('land'); void f.row.offsetWidth; f.row.classList.add('in', 'land'); }
    if (p >= 1) { f.chip.remove(); flights.splice(flights.indexOf(f), 1); }
  };
  var frame = function (now) {
    var dt = last ? Math.min(now - last, 64) : 0;
    last = now;
    if (!held()) clock += dt;
    var due = tasks.filter(function (k) { return k.t <= clock; });
    tasks = tasks.filter(function (k) { return k.t > clock; });
    due.forEach(function (k) { k.fn(); });
    if (flights.length) flights.slice().forEach(step);
    requestAnimationFrame(frame);
  };

  /* One phrase: highlight, fly to each of its fields, settle */
  var send = function (mark, t0) {
    var targets = mark._rows || [];
    if (!targets.length) return t0;
    at(t0, function () { mark.classList.remove('done'); mark.classList.add('on'); });
    targets.forEach(function (row, j) { at(t0 + 320 + j * 170, function () { launch(mark, row); }); });
    var span = 320 + FLY + (targets.length - 1) * 170;
    at(t0 + span, function () { mark.classList.remove('on'); mark.classList.add('done'); });
    return t0 + span + 120;
  };
  var stop = function () {
    tasks = []; flights.forEach(function (f) { f.chip.remove(); }); flights = [];
  };

  /* The whole section */
  var play = function () {
    stop();
    marks.forEach(function (m) { m.classList.remove('on', 'done'); });
    rows.forEach(function (r) { r.classList.remove('in', 'land'); });
    stage.classList.remove('done');
    if (link) link.classList.remove('nudge');
    done = false; paused = false; paint();
    var t = 0;
    marks.forEach(function (mark) { t = send(mark, t); });
    at(t + 350, function () {
      stage.classList.add('done');
      if (link && !stage.classList.contains('no-real')) link.classList.add('nudge');
      done = true; paint();
      /* Once, after the first build: invite a look at another section */
      if (!nudged && tabs[1]) { nudged = true; tabs[1].classList.add('nudge'); }
    });
  };

  /* Switching section: fade the cards, swap the content, build it */
  var choose = function (key) {
    if (swapping || !sets[key]) return;
    tabs.forEach(function (t) { var on = t.getAttribute('data-set') === key; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; t.classList.remove('nudge'); });
    if (key === current && !done) return;
    started = true; swapping = true; stop();
    stage.classList.add('swap');
    setTimeout(function () {
      apply(key);
      marks.forEach(function (m) { m.classList.remove('on', 'done'); });
      rows.forEach(function (r) { r.classList.remove('in', 'land'); });
      stage.classList.remove('done');
      requestAnimationFrame(function () { stage.classList.remove('swap'); swapping = false; at(250, play); });
    }, 260);
  };
  tabs.forEach(function (t, i) {
    t.tabIndex = t.getAttribute('aria-selected') === 'true' ? 0 : -1;
    t.addEventListener('click', function () { choose(t.getAttribute('data-set')); });
    t.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' ? 1 : (e.key === 'ArrowLeft' ? -1 : 0);
      if (!d) return;
      e.preventDefault();
      var n = tabs[(i + d + tabs.length) % tabs.length];
      n.focus(); choose(n.getAttribute('data-set'));
    });
  });

  /* Once a build is done, any highlighted phrase can be sent again */
  docCard.addEventListener('click', function (e) {
    var m = e.target.closest('mark');
    if (!m || !done || paused) return;
    send(m, 0);
  });

  btn.addEventListener('click', function () {
    if (done) { play(); return; }
    paused = !paused;
    paint();
  });
  document.addEventListener('visibilitychange', function () { tabHidden = document.hidden; });
  /* Start once the hero is in view; hold while it is off screen */
  var begin = function () {
    if (started) return;
    started = true;
    at(1500, play);
  };
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) {
      offscreen = !en[0].isIntersecting;
      if (en[0].intersectionRatio >= 0.35) begin();
    }, { threshold: [0, 0.35] }).observe(stage);
  } else {
    begin();
  }
  paint();
  requestAnimationFrame(frame);
})();
