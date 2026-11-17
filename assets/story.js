/* Amendment story: one change followed all the way through, told as the page scrolls.
   The section is flat (every step and panel visible) unless this script pins it, which it does only
   on wide screens without reduced motion. Scroll position picks the step; the steps are buttons too. */
(function () {
  'use strict';
  var story = document.querySelector('.story');
  if (!story) return;
  var track = story.querySelector('.story-track');
  var pin = story.querySelector('.story-pin');
  var steps = Array.prototype.slice.call(story.querySelectorAll('.story-step'));
  var panels = Array.prototype.slice.call(story.querySelectorAll('.sp'));
  var bar = story.querySelector('.story-progress i');
  var wide = window.matchMedia('(min-width: 921px)');
  var still = window.matchMedia('(prefers-reduced-motion: reduce)');
  var cur = -1, ticking = false;

  var show = function (k) {
    if (k === cur) return;
    cur = k;
    steps.forEach(function (s, i) {
      s.classList.toggle('is-on', i === k);
      s.classList.toggle('is-past', i < k);
      s.setAttribute('aria-current', i === k ? 'step' : 'false');
    });
    panels.forEach(function (p, i) { p.classList.toggle('on', i === k); p.classList.toggle('past', i < k); });
  };
  var pinned = function () { return wide.matches && !still.matches; };
  var update = function () {
    ticking = false;
    var on = pinned();
    story.classList.toggle('pinned', on);
    if (!on) { cur = -1; return; }
    var r = track.getBoundingClientRect();
    var total = Math.max(1, track.offsetHeight - pin.offsetHeight);
    var p = Math.min(1, Math.max(0, -r.top / total));
    if (bar) bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    show(Math.min(steps.length - 1, Math.floor(p * steps.length * 0.9999)));
  };
  var onScroll = function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  if (wide.addEventListener) { wide.addEventListener('change', onScroll); still.addEventListener('change', onScroll); }

  /* A step can be chosen directly: scroll to the middle of its part of the track */
  var go = function (i, smooth) {
    if (!pinned()) return;
    var top = track.getBoundingClientRect().top + window.scrollY;
    var total = track.offsetHeight - pin.offsetHeight;
    window.scrollTo({ top: top + total * (i + 0.5) / steps.length, behavior: smooth ? 'smooth' : 'auto' });
  };
  steps.forEach(function (s, i) { s.addEventListener('click', function () { go(i, true); }); });
  /* Tabbing into a panel that is not showing (its link) brings that step up first */
  panels.forEach(function (p, i) { p.addEventListener('focusin', function () { if (i !== cur) go(i, false); }); });
  update();
})();
