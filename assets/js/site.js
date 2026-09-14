/* ==========================================================================
   site.js — progressive enhancement voor de hele site.
   Alles is optioneel: zonder JS blijft de pagina volledig leesbaar.
   Home-specifieke hooks (sticky bar, nudge, hero-parallax) doen niets
   op pagina's waar die elementen niet bestaan.
   ========================================================================== */
(function () {
  document.documentElement.classList.add('js');
  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Fade/settle-in on scroll (content itself is never opacity:0 — see .reveal CSS)
  var els = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && els.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (el) { io.observe(el); });
  }

  // Count-up numbers (stat row), once each, while visible
  var counters = document.querySelectorAll('[data-count-to]');
  if ('IntersectionObserver' in window && counters.length) {
    var countIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        countIo.unobserve(entry.target);
        var el = entry.target;
        var target = parseInt(el.getAttribute('data-count-to'), 10) || 0;
        var suffix = el.getAttribute('data-suffix') || '';
        if (reducedMotion) { el.textContent = target + suffix; return; }
        var start = null;
        var duration = 1100;
        function step(ts) {
          if (start === null) start = ts;
          var progress = Math.min((ts - start) / duration, 1);
          var eased = 1 - Math.pow(1 - progress, 3);
          el.textContent = Math.round(eased * target) + suffix;
          if (progress < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.4 });
    counters.forEach(function (el) { countIo.observe(el); });
  }

  // Thin scroll progress bar
  var progressFill = document.getElementById('progressFill');
  var heroEl = document.getElementById('hero');
  var heroPhoto = document.getElementById('heroPhoto');
  var heroImg = heroPhoto ? heroPhoto.querySelector('img') : null;
  var stickyBar = document.getElementById('stickyBar');
  // Referentiepunt voor de nudge: die schuift binnen zodra de bezoeker
    // voorbij deze sectie is. Hernoem je #aanbod in de HTML, pas dit
    // dan mee aan.
    var nudgeAnchorEl = document.getElementById('aanbod');
  var nudgeEl = document.getElementById('nudge');
  var nudgeShown = false;
  var nudgeDismissed = false;
  var ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var doc = document.documentElement;
      var scrollTop = window.scrollY || doc.scrollTop;
      var scrollable = (doc.scrollHeight - doc.clientHeight) || 1;
      if (progressFill) progressFill.style.transform = 'scaleX(' + Math.min(scrollTop / scrollable, 1) + ')';

      if (heroEl) {
        var heroBottom = heroEl.offsetTop + heroEl.offsetHeight;
        if (stickyBar) stickyBar.classList.toggle('is-visible', scrollTop > heroBottom - 120);

        if (!reducedMotion && heroImg && scrollTop < heroBottom) {
          var shift = Math.min(scrollTop * 0.08, 28);
          heroImg.style.transform = 'translateY(' + shift + 'px)';
        }
      }

      if (nudgeAnchorEl && !nudgeShown && !nudgeDismissed) {
        var nudgeAnchorBottom = nudgeAnchorEl.offsetTop + nudgeAnchorEl.offsetHeight;
        if (scrollTop > nudgeAnchorBottom) {
          nudgeShown = true;
          if (nudgeEl) nudgeEl.classList.add('is-visible');
        }
      }
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var nudgeClose = document.getElementById('nudgeClose');
  if (nudgeClose && nudgeEl) {
    nudgeClose.addEventListener('click', function () {
      nudgeDismissed = true;
      nudgeEl.classList.remove('is-visible');
    });
  }
  // — Lopende band: de woorden twee keer uitschrijven zodat de lus naadloos is —
  var marquee = document.getElementById('marquee');
  if (marquee) {
    var woorden = ['Ontbijt', 'Lunch', 'Apero', 'Met een korstje af', 'Dagvers op kantoor', 'Voor bedrijven met smaak'];
    var reeks = woorden.map(function (w) { return '<span>' + w + '</span>'; }).join('');
    marquee.innerHTML = reeks + reeks + reeks + reeks;
  }

  // — Zwevende stickers en stempels —
  // Elke sticker beweegt ten opzichte van de sectie waarin hij staat, niet
  // ten opzichte van de hele pagina. Zo blijft de verplaatsing begrensd en
  // drijft er niets weg op een lange pagina.
  var stickers = [].slice.call(document.querySelectorAll('.sticker'));
  stickers.forEach(function (el) {
    el.__sectie = el.closest('section') || el.parentElement;
    el.__tilt = parseFloat(el.getAttribute('data-tilt') || 0);
    el.__drift = parseFloat(el.getAttribute('data-drift') || 0);
    el.__spin = parseFloat(el.getAttribute('data-spin') || 0);
    el.style.transform = 'rotate(' + el.__tilt + 'deg)';
  });

  function verplaatsStickers() {
    if (reducedMotion || !stickers.length) return;
    var vh = window.innerHeight;
    stickers.forEach(function (el) {
      var r = el.__sectie.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      // 0 = sectie komt net in beeld, 1 = sectie verlaat het beeld
      var voortgang = (vh - r.top) / (vh + r.height);
      var d = (voortgang - 0.5) * 2;
      el.style.transform =
        'translate3d(0,' + (d * el.__drift).toFixed(1) + 'px,0) rotate(' +
        (el.__tilt + d * el.__spin).toFixed(2) + 'deg)';
    });
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(function () { verplaatsStickers(); ticking = false; }); }
  }, { passive: true });
  window.addEventListener('resize', verplaatsStickers);
  verplaatsStickers();
})();
