/* B3 hero graphic. Left: a line from the protocol to each output that comes straight from it.
   Right: one thread from the protocol into a numbered rail that runs down through each downstream step
   to the submission package, with points of light flowing along it. Positions come from layout (offsets),
   not from transforms, so the entrance animations do not throw them off. Redrawn when the graphic resizes. */
(function () {
  'use strict';
  var hub = document.querySelector('.hub');
  if (!hub) return;
  var svg = hub.querySelector('.hub-lines');
  var doc = hub.querySelector('.hub-doc');
  var left = Array.prototype.slice.call(hub.querySelectorAll('.hub-l .hub-node'));
  var right = Array.prototype.slice.call(hub.querySelectorAll('.hub-r .hub-node'));
  var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var f = function (n) { return n.toFixed(1); };
  var box = function (el) {
    var x = 0, y = 0, w = el.offsetWidth, h = el.offsetHeight;
    while (el && el !== hub) { x += el.offsetLeft; y += el.offsetTop; el = el.offsetParent; }
    return { x: x, y: y, w: w, h: h };
  };
  var pulse = function (cls, d, dur, begin) {
    return '<circle class="hp ' + cls + '" r="3" opacity="0">' +
      '<animateMotion dur="' + dur + 's" begin="' + begin + 's" repeatCount="indefinite" path="' + d + '" calcMode="spline" keyPoints="0;1" keyTimes="0;1" keySplines=".45 0 .25 1"/>' +
      '<animate attributeName="opacity" dur="' + dur + 's" begin="' + begin + 's" repeatCount="indefinite" values="0;1;1;0" keyTimes="0;.1;.88;1"/></circle>';
  };

  var draw = function () {
    if (!svg || getComputedStyle(svg).display === 'none') return;
    var W = hub.clientWidth, H = hub.clientHeight, d0 = box(doc), out = '';
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);

    /* Left: straight from the protocol */
    left.forEach(function (n, k) {
      var b = box(n);
      var x1 = d0.x, y1 = d0.y + d0.h * (0.3 + 0.2 * k);
      var x2 = b.x + b.w, y2 = b.y + b.h / 2, dx = (x2 - x1) * 0.55;
      var d = 'M' + f(x1) + ' ' + f(y1) + ' C' + f(x1 + dx) + ' ' + f(y1) + ' ' + f(x2 - dx) + ' ' + f(y2) + ' ' + f(x2) + ' ' + f(y2);
      out += '<path class="hl now l" d="' + d + '" pathLength="1" style="--i:' + k + '"/>';
      out += '<circle class="hd now l" cx="' + f(x2) + '" cy="' + f(y2) + '" r="3" style="--i:' + k + '"/>';
      if (!still) out += pulse('l', d, 2.8, (2.2 + k * 0.6).toFixed(2));
    });

    /* Right: the pipeline, protocol to submission */
    if (right.length) {
      var bs = right.map(box);
      var railX = bs[0].x - 26;
      var ys = bs.map(function (b) { return b.y + b.h / 2; });
      var x1 = d0.x + d0.w, y1 = d0.y + d0.h * 0.32;
      var dx = (railX - x1) * 0.6;
      var thread = 'M' + f(x1) + ' ' + f(y1) + ' C' + f(x1 + dx) + ' ' + f(y1) + ' ' + f(railX - dx * 0.4) + ' ' + f(ys[0]) + ' ' + f(railX) + ' ' + f(ys[0]);
      var rail = thread + ' L' + f(railX) + ' ' + f(ys[ys.length - 1]);
      out += '<path class="hl now r" d="' + thread + '" pathLength="1" style="--i:3"/>';
      out += '<path class="rail" d="M' + f(railX) + ' ' + f(ys[0]) + ' L' + f(railX) + ' ' + f(ys[ys.length - 1]) + '" pathLength="1"/>';
      bs.forEach(function (b, k) {
        var end = right[k].classList.contains('end');
        out += '<line class="tick" x1="' + f(railX + 9) + '" y1="' + f(ys[k]) + '" x2="' + f(b.x) + '" y2="' + f(ys[k]) + '" style="--i:' + (k + 3) + '"/>';
        out += '<g class="stop' + (end ? ' end' : '') + '" style="--i:' + (k + 3) + '"><circle cx="' + f(railX) + '" cy="' + f(ys[k]) + '" r="9"/><text x="' + f(railX) + '" y="' + f(ys[k]) + '">' + (k + 1) + '</text></g>';
      });
      if (!still) { out += pulse('r', rail, 4.2, '2.4'); out += pulse('r', rail, 4.2, '4.5'); }
    }
    svg.innerHTML = out;
  };

  var queued = false;
  var schedule = function () { if (queued) return; queued = true; requestAnimationFrame(function () { queued = false; draw(); }); };
  draw();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(schedule);
  if ('ResizeObserver' in window) new ResizeObserver(schedule).observe(hub);
  else window.addEventListener('resize', schedule);
  /* After the first draw has played, later redraws (on resize) appear at once */
  setTimeout(function () { hub.classList.add('drawn'); }, 3400);
  /* The points of light rest while the graphic is off screen */
  if ('IntersectionObserver' in window && svg && svg.pauseAnimations) {
    new IntersectionObserver(function (en) { if (en[0].isIntersecting) svg.unpauseAnimations(); else svg.pauseAnimations(); }).observe(hub);
  }
})();
