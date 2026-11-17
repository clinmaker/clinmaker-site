/* B3 hero graphic: draws a line from the protocol card to each team's card, with a point of light
   travelling along the ones that are ready. Positions come from layout (offsets), not from transforms,
   so the entrance animations do not throw them off. Redrawn when the graphic changes size. */
(function () {
  'use strict';
  var hub = document.querySelector('.hub');
  if (!hub) return;
  var svg = hub.querySelector('.hub-lines');
  var doc = hub.querySelector('.hub-doc');
  var nodes = Array.prototype.slice.call(hub.querySelectorAll('.hub-node'));
  var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var f = function (n) { return n.toFixed(1); };
  var box = function (el) {
    var x = 0, y = 0, w = el.offsetWidth, h = el.offsetHeight;
    while (el && el !== hub) { x += el.offsetLeft; y += el.offsetTop; el = el.offsetParent; }
    return { x: x, y: y, w: w, h: h };
  };

  var draw = function () {
    if (!svg || getComputedStyle(svg).display === 'none') return;
    var W = hub.clientWidth, H = hub.clientHeight, d0 = box(doc), seen = { l: 0, r: 0 }, out = '';
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    nodes.forEach(function (n, i) {
      var side = n.parentNode.classList.contains('hub-l') ? 'l' : 'r';
      var k = seen[side]++;
      var b = box(n);
      var x1 = side === 'l' ? d0.x : d0.x + d0.w;
      var y1 = d0.y + d0.h * (0.3 + 0.2 * k);
      var x2 = side === 'l' ? b.x + b.w : b.x;
      var y2 = b.y + b.h / 2;
      var dx = (x2 - x1) * 0.55;
      var d = 'M' + f(x1) + ' ' + f(y1) + ' C' + f(x1 + dx) + ' ' + f(y1) + ' ' + f(x2 - dx) + ' ' + f(y2) + ' ' + f(x2) + ' ' + f(y2);
      var cls = (n.classList.contains('now') ? 'now ' : 'next ') + side;
      out += '<path class="hl ' + cls + '" d="' + d + '" pathLength="1" style="--i:' + i + '"/>';
      out += '<circle class="hd ' + cls + '" cx="' + f(x2) + '" cy="' + f(y2) + '" r="3" style="--i:' + i + '"/>';
      if (!still && n.classList.contains('now')) {
        var t = (2.2 + i * 0.55).toFixed(2) + 's';
        out += '<circle class="hp ' + side + '" r="3" opacity="0">' +
          '<animateMotion dur="2.8s" begin="' + t + '" repeatCount="indefinite" path="' + d + '" calcMode="spline" keyPoints="0;1" keyTimes="0;1" keySplines=".45 0 .25 1"/>' +
          '<animate attributeName="opacity" dur="2.8s" begin="' + t + '" repeatCount="indefinite" values="0;1;1;0" keyTimes="0;.15;.8;1"/></circle>';
      }
    });
    svg.innerHTML = out;
  };

  var queued = false;
  var schedule = function () { if (queued) return; queued = true; requestAnimationFrame(function () { queued = false; draw(); }); };
  draw();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(schedule);
  if ('ResizeObserver' in window) new ResizeObserver(schedule).observe(hub);
  else window.addEventListener('resize', schedule);
  /* After the first draw has played, later redraws (on resize) appear at once */
  setTimeout(function () { hub.classList.add('drawn'); }, 3200);
  /* The points of light rest while the graphic is off screen */
  if ('IntersectionObserver' in window && svg.pauseAnimations) {
    new IntersectionObserver(function (en) { if (en[0].isIntersecting) svg.unpauseAnimations(); else svg.pauseAnimations(); }).observe(hub);
  }
})();
