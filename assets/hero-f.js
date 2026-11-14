/* Hero F: the field flow plays twice, then each field settles in the casebook as its CDASH name.
   One control pauses it while it plays and replays it once it rests. It holds while the hero is off screen.
   Reduced motion: nothing runs, and hero E's static end state shows. */
(function () {
  'use strict';
  var hero = document.querySelector('.hf');
  if (!hero || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
  var chips = Array.prototype.slice.call(hero.querySelectorAll('.fv-chip'));
  var cap = hero.querySelector('.flowviz figcaption');
  if (!chips.length || !cap) return;

  var ICONS = {
    pause: '<rect x="5.6" y="4.6" width="3" height="10.8" rx="1" fill="currentColor"/><rect x="11.4" y="4.6" width="3" height="10.8" rx="1" fill="currentColor"/>',
    play: '<path d="M7 4.6v10.8l8.6-5.4z" fill="currentColor"/>',
    replay: '<path d="M4.6 10.4a5.6 5.6 0 1 0 1.9-4.6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M6.2 2.6v3.6h3.6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
  };
  var LABELS = { pause: 'Pause the animation', play: 'Play the animation', replay: 'Play the animation again' };
  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'hf-ctl';
  btn.innerHTML = '<svg viewBox="0 0 20 20" aria-hidden="true"></svg>';
  cap.appendChild(btn);
  var icon = btn.querySelector('svg');
  var paused = false, offscreen = false, tabHidden = false, landed = 0;

  var paint = function () {
    var done = landed === chips.length;
    var state = done ? 'replay' : (paused ? 'play' : 'pause');
    icon.innerHTML = ICONS[state];
    btn.setAttribute('aria-label', LABELS[state]);
    hero.classList.toggle('held', paused || offscreen || tabHidden);
    hero.classList.toggle('rested', done);
  };

  /* A field lands once its second pass ends */
  chips.forEach(function (chip) {
    chip.addEventListener('animationend', function (e) {
      if (e.target !== chip || e.animationName !== 'chip-move') return;
      chip.classList.add('settled');
      landed += 1;
      paint();
    });
  });

  btn.addEventListener('click', function () {
    if (landed === chips.length) {
      landed = 0; paused = false;
      hero.classList.add('again');
      chips.forEach(function (c) { c.classList.remove('settled'); });
    } else {
      paused = !paused;
    }
    paint();
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) { offscreen = !en[0].isIntersecting; paint(); }).observe(hero.querySelector('.flowviz'));
  }
  document.addEventListener('visibilitychange', function () { tabHidden = document.hidden; paint(); });
  paint();
})();
