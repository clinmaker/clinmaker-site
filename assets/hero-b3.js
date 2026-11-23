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
    var W = hub.clientWidth, H = hub.clientHeight, d0 = box(doc), out = '', pulses = '';
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);

    /* Left: straight from the protocol */
    left.forEach(function (n, k) {
      var b = box(n);
      var x1 = d0.x, y1 = d0.y + d0.h * (0.3 + 0.2 * k);
      var x2 = b.x + b.w, y2 = b.y + b.h / 2, dx = (x2 - x1) * 0.55;
      var d = 'M' + f(x1) + ' ' + f(y1) + ' C' + f(x1 + dx) + ' ' + f(y1) + ' ' + f(x2 - dx) + ' ' + f(y2) + ' ' + f(x2) + ' ' + f(y2);
      out += '<path class="hl now l" d="' + d + '" pathLength="1" style="--i:' + k + '"/>';
      out += '<circle class="hd now l" cx="' + f(x2) + '" cy="' + f(y2) + '" r="3" style="--i:' + k + '"/>';
      if (!still) pulses += pulse('l', d, 2.8, (2.2 + k * 0.6).toFixed(2));
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
      if (!still) { pulses += pulse('r', rail, 4.2, '2.4'); pulses += pulse('r', rail, 4.2, '4.5'); }
    }
    /* Two curved bands around the protocol: the standards it is built on (top) and the platform's
       Document centre and shared services (bottom). They span 120 degrees, so they stay clear of the lines. */
    var cx = d0.x + d0.w / 2, cy = d0.y + d0.h / 2;
    var rx = d0.w / 2 + 96, ry = Math.min(d0.h / 2 + 44, cy - 14, H - cy - 14);
    /* Where there is little height, the bands sweep less, so their ends stay clear of the lines */
    var tight = ry < d0.h / 2 + 40, ang = (tight ? 40 : 30) * Math.PI / 180;
    var c30 = Math.cos(ang), s30 = Math.sin(ang);
    /* and never reach past the gap between the card and the side boxes */
    var gapL = left.length ? cx - (box(left[0]).x + box(left[0]).w) : rx, gapR = right.length ? box(right[0]).x - cx : rx;
    rx = Math.max(d0.w / 2 + 24, Math.min(rx, (Math.min(gapL, gapR) - 40) / c30));
    /* tall enough that the ellipse clears the card's corners (plus the band's half-width) */
    var cw = d0.w / 2 + 14, ch = d0.h / 2 + 14, k = Math.min(0.97, cw / rx);
    ry = Math.min(Math.max(ry, ch / Math.sqrt(1 - k * k) + 14), cy - 14, H - cy - 14);
    var xl = f(cx - rx * c30), xr = f(cx + rx * c30);
    var top = 'M' + xl + ' ' + f(cy - ry * s30) + ' A' + f(rx) + ' ' + f(ry) + ' 0 0 1 ' + xr + ' ' + f(cy - ry * s30);
    var bot = 'M' + xl + ' ' + f(cy + ry * s30) + ' A' + f(rx) + ' ' + f(ry) + ' 0 0 0 ' + xr + ' ' + f(cy + ry * s30);
    var rings = '<g class="rings">' +
      '<path class="ring-band std" d="' + top + '" pathLength="1"/><path class="ring-glow std" d="' + top + '" pathLength="1"/><path id="ring-top" class="ring-path" d="' + top + '"/>' +
      '<text class="ring-txt std"><textPath href="#ring-top" startOffset="50%" text-anchor="middle">' + (hub.getAttribute('data-ring-top') || '') + '</textPath></text>' +
      '<path class="ring-band docs" d="' + bot + '" pathLength="1"/><path class="ring-glow docs" d="' + bot + '" pathLength="1"/><path id="ring-bot" class="ring-path" d="' + bot + '"/>' +
      '<text class="ring-txt docs"><textPath href="#ring-bot" startOffset="50%" text-anchor="middle">' + (hub.getAttribute('data-ring-bot') || '') + '</textPath></text></g>';
    svg.innerHTML = rings + '<g class="flow">' + out + '</g><g class="pulses">' + pulses + '</g>';
    /* If a label is longer than its arc, shrink it until it fits */
    Array.prototype.forEach.call(svg.querySelectorAll('.ring-txt'), function (t) {
      var path = svg.querySelector(t.classList.contains('std') ? '#ring-top' : '#ring-bot');
      var room = path.getTotalLength() - 24, size = 10.5;
      while (t.getComputedTextLength && t.getComputedTextLength() > room && size > 7.5) { size -= 0.5; t.style.fontSize = size + 'px'; }
    });
  };

  var queued = false;
  var schedule = function () { if (queued) return; queued = true; requestAnimationFrame(function () { queued = false; draw(); }); };
  draw();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(schedule);
  if ('ResizeObserver' in window) new ResizeObserver(schedule).observe(hub);
  else window.addEventListener('resize', schedule);
  /* After the first draw has played, later redraws (on resize) appear at once */
  setTimeout(function () { hub.classList.add('drawn'); }, 3400);
  /* The protocol card: a draft document, then its phrases tagged with ICH M11 sections, then the structured study.
     It holds the structured view, then plays again; it rests while off screen, and is still with reduced motion. */
  var timers = [], visible = true, playing = false;
  var later = function (ms, fn) { timers.push(setTimeout(fn, ms)); };
  var raw = function (on) { hub.classList.toggle('is-raw', on); doc.classList.toggle('is-raw', on); if (on) hub.classList.remove('ring-std-on', 'ring-docs-on'); };
  /* Once the protocol is structured: the standards light up, then the Document centre */
  var light = function () { later(250, function () { hub.classList.add('ring-std-on'); }); later(1000, function () { hub.classList.add('ring-docs-on'); }); };
  var cycle = function () {
    timers.forEach(clearTimeout); timers = [];
    if (!visible) { playing = false; return; }
    playing = true;
    doc.classList.remove('is-marking'); raw(true);
    later(1500, function () { doc.classList.add('is-marking'); });
    later(3900, function () { raw(false); light(); });
    later(3900 + 900, function () { doc.classList.remove('is-marking'); });
    later(3900 + 8000, cycle);
  };
  if (!still && doc.querySelector('.hd-raw')) {
    cycle();
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) {
        visible = en[0].isIntersecting;
        if (visible && !playing) cycle();
        if (!visible) { timers.forEach(clearTimeout); timers = []; playing = false; raw(false); }
      }, { threshold: 0.25 }).observe(hub);
    }
  }

  /* The points of light rest while the graphic is off screen */
  if ('IntersectionObserver' in window && svg && svg.pauseAnimations) {
    new IntersectionObserver(function (en) { if (en[0].isIntersecting) svg.unpauseAnimations(); else svg.pauseAnimations(); }).observe(hub);
  }

  /* Your challenge → ClinMaker delivers: the rows arrive when the block comes into view */
  var cd = document.querySelector('.cd');
  if (cd) {
    if (still || !('IntersectionObserver' in window)) cd.classList.add('in');
    else new IntersectionObserver(function (en, o) { if (en[0].isIntersecting) { cd.classList.add('in'); o.disconnect(); } }, { threshold: 0.2 }).observe(cd);
  }
  /* A one-time reading cue: when the panel first arrives, each row lights in turn, then all rest at full strength */
  var cdRows = cd ? Array.prototype.slice.call(cd.querySelectorAll('.cd-row')) : [];
  if (cdRows.length && !still && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (en, o) {
      if (!en[0].isIntersecting) return;
      o.disconnect();
      cdRows.forEach(function (row, n) {
        setTimeout(function () { cdRows.forEach(function (r) { r.classList.toggle('on', r === row); }); }, 900 + n * 1100);
      });
      setTimeout(function () { cdRows.forEach(function (r) { r.classList.remove('on'); }); }, 900 + cdRows.length * 1100);
    }, { threshold: 0.5 }).observe(cd);
  }


  /* The statistics count up once as they come into view ("68 days", "3.4", "Up to $1M") */
  var stats = Array.prototype.slice.call(document.querySelectorAll('#gap .stat .n'));
  if (stats.length && !still && 'IntersectionObserver' in window) {
    stats.forEach(function (n) {
      var node = n.firstChild; if (!node || node.nodeType !== 3) return;
      var text = node.nodeValue, m = text.match(/\d+(\.\d+)?/); if (!m) return;
      var target = parseFloat(m[0]), dec = m[1] ? m[1].length - 1 : 0, pre = text.slice(0, m.index), post = text.slice(m.index + m[0].length);
      node.nodeValue = pre + (0).toFixed(dec) + post;
      new IntersectionObserver(function (en, o) {
        if (!en[0].isIntersecting) return; o.disconnect();
        var t0 = performance.now(), dur = 1200;
        var step = function (t) {
          var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
          node.nodeValue = pre + (target * e).toFixed(dec) + post;
          if (k < 1) requestAnimationFrame(step); else node.nodeValue = text;
        };
        requestAnimationFrame(step);
      }, { threshold: 0.6 }).observe(n);
    });
  }
})();
