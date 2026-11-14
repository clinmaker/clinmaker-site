/* Hero B: each highlighted phrase in the protocol flies through the ClinMaker mark and lands in the
   casebook as its CDASH field. Then the way to the real Study Build screen appears, and it rests.
   One clock drives everything, so pause, off-screen holds and replay are exact. Reduced motion: final state. */
(function () {
  'use strict';
  var stage = document.querySelector('.tb-stage');
  var cap = document.querySelector('.tb-foot');
  if (!stage || !cap) return;
  var marks = Array.prototype.slice.call(stage.querySelectorAll('.tb-doc mark'));
  var rows = Array.prototype.slice.call(stage.querySelectorAll('.tb-row'));
  var hub = stage.querySelector('.tb-bridge svg.mark');
  var link = stage.querySelector('.tb-real-link');
  var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var finalState = function () {
    marks.forEach(function (m) { m.classList.remove('on'); m.classList.add('done'); });
    rows.forEach(function (r) { r.classList.add('in'); });
    stage.classList.add('done');
  };
  if (still || !window.requestAnimationFrame) { finalState(); return; }

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

  var paused = false, offscreen = false, tabHidden = false, done = false, started = false;
  var held = function () { return paused || offscreen || tabHidden; };
  var paint = function () {
    var state = done ? 'replay' : (paused ? 'play' : 'pause');
    icon.innerHTML = ICONS[state];
    btn.setAttribute('aria-label', LABELS[state]);
  };

  /* One clock: time only advances while nothing holds it */
  var clock = 0, last = 0, tasks = [];
  var at = function (ms, fn) { tasks.push({ t: clock + ms, fn: fn }); };
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

  /* A phrase in flight, along a curve, turning into its CDASH name as it crosses the mark */
  var flights = [];
  var FLY = 980;
  var ease = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
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
    if (!f.landed && p >= .86) { f.landed = true; f.row.classList.add('in', 'land'); }
    if (p >= 1) { f.chip.remove(); flights.splice(flights.indexOf(f), 1); }
  };

  /* The sequence: highlight, fly, land, next */
  var play = function () {
    tasks = []; flights.forEach(function (f) { f.chip.remove(); }); flights = [];
    marks.forEach(function (m) { m.classList.remove('on', 'done'); });
    rows.forEach(function (r) { r.classList.remove('in', 'land'); });
    stage.classList.remove('done');
    if (link) link.classList.remove('nudge');
    done = false; paused = false; paint();
    var t = 0;
    marks.forEach(function (mark, i) {
      var row = rows[i];
      if (!row) return;
      at(t, function () { mark.classList.add('on'); });
      at(t + 320, function () { launch(mark, row); });
      at(t + 320 + FLY, function () { mark.classList.remove('on'); mark.classList.add('done'); });
      t += 320 + FLY + 120;
    });
    at(t + 350, function () {
      stage.classList.add('done');
      if (link) link.classList.add('nudge');
      done = true; paint();
    });
  };

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
