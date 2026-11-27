/* B3 Platform map: curved connectors from each input into the study, and from the study to each output */
(function () {
  'use strict';
  var main = document.querySelector('.pmx-main'); if (!main) return;
  var svg = main.querySelector('.pmx-lines'), core = main.querySelector('[data-pm-core]');
  var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var f = function (n) { return Math.round(n * 10) / 10; };
  var rel = function (el) { var a = el.getBoundingClientRect(), m = main.getBoundingClientRect(); return { x: a.left - m.left, y: a.top - m.top, w: a.width, h: a.height }; };
  var draw = function () {
    if (getComputedStyle(svg).display === 'none') return;
    var W = main.clientWidth, H = main.clientHeight, c = rel(core), out = '', dots = '';
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    var cy = c.y + c.h * 0.32;
    var defs = '<defs><linearGradient id="pmx-gin" x1="0" x2="1"><stop offset="0" stop-color="#0e7490" stop-opacity=".55"/><stop offset="1" stop-color="#d87654"/></linearGradient>' +
      '<linearGradient id="pmx-gout" x1="0" x2="1"><stop offset="0" stop-color="#d87654"/><stop offset="1" stop-color="#7850dc" stop-opacity=".6"/></linearGradient></defs>';
    var curve = function (x1, y1, x2, y2) { var dx = (x2 - x1) * 0.55; return 'M' + f(x1) + ' ' + f(y1) + ' C' + f(x1 + dx) + ' ' + f(y1) + ' ' + f(x2 - dx) + ' ' + f(y2) + ' ' + f(x2) + ' ' + f(y2); };
    main.querySelectorAll('.pmx-in .pm-card').forEach(function (el, i) {
      var b = rel(el), y = b.y + b.h / 2, d = curve(b.x + b.w, y, c.x, cy + (i - 1) * 14), dev = el.classList.contains('dev');
      out += '<path class="ln-in' + (dev ? ' ln-dev' : '') + '" d="' + d + '"/><circle cx="' + f(b.x + b.w) + '" cy="' + f(y) + '" r="3.5" stroke="#0e7490"/>';
      if (!still && !dev) dots += '<circle r="2.6" fill="#d87654"><animateMotion dur="3.2s" begin="' + (i * 0.9) + 's" repeatCount="indefinite" path="' + d + '"/></circle>';
    });
    main.querySelectorAll('.pmx-out .pm-card').forEach(function (el, i) {
      var b = rel(el), y = b.y + b.h / 2, d = curve(c.x + c.w, cy + (i - 1.5) * 12, b.x, y), dev = el.classList.contains('dev');
      out += '<path class="ln-out' + (dev ? ' ln-dev' : '') + '" d="' + d + '"/><circle cx="' + f(b.x) + '" cy="' + f(y) + '" r="3.5" stroke="' + (dev ? '#b9b2aa' : '#d87654') + '"/>';
      if (!still && !dev) dots += '<circle r="2.6" fill="#7850dc"><animateMotion dur="3.2s" begin="' + (1.6 + i * 0.9) + 's" repeatCount="indefinite" path="' + d + '"/></circle>';
    });
    svg.innerHTML = defs + out + dots;
  };
  var q = false, sched = function () { if (q) return; q = true; requestAnimationFrame(function () { q = false; draw(); }); };
  draw();
  if ('ResizeObserver' in window) new ResizeObserver(sched).observe(main); else window.addEventListener('resize', sched);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(sched);
})();
/* Product clips: play only while on screen, and never for people who ask for reduced motion */
(function () {
  'use strict';
  var clips = document.querySelectorAll('video.pf-clip'); if (!clips.length) return;
  var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (still || !('IntersectionObserver' in window)) return;
  var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { var p = e.target.play(); if (p && p.catch) p.catch(function () {}); } else e.target.pause(); }); }, { threshold: 0.4 });
  clips.forEach(function (v) { io.observe(v); });
})();
