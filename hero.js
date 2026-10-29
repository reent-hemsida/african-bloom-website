/* Homepage hero behaviour: one rose at a time (swipe / arrows / dots / gentle autoplay),
   "from" prices fetched live (public_from_prices(): lowest ex-VAT price of the four featured roses only),
   and the countdown to the end of the price guarantee.
   Update GUARANTEE_END each year together with the texts in index.html. */
(function () {
  var GUARANTEE_END = new Date('2027-01-01T00:00:00+01:00'); // prices guaranteed through 31 Dec 2026
  var TX = {
    sv: { d0: 'Sista dagen att beställa är i dag', d1: 'Sista dagen: 1 dag kvar att beställa', dn: '{n} dagar kvar att beställa till garanterat pris', fmt: function (p) { return p + ' kr'; } },
    en: { d0: 'Last day to order is today', d1: 'Last day: 1 day left to order', dn: '{n} days left to order at the guaranteed price', fmt: function (p) { return 'SEK ' + p; } },
    es: { d0: 'Hoy es el último día para pedir', d1: 'Último día: queda 1 día para pedir', dn: 'Quedan {n} días para pedir al precio garantizado', fmt: function (p) { return p + ' SEK'; } },
    ru: { d0: 'Сегодня последний день для заказа', d1: 'Последний день: остался 1 день для заказа', dn: 'Осталось дней для заказа по гарантированной цене: {n}', fmt: function (p) { return p + ' SEK'; } },
    it: { d0: 'Oggi è l’ultimo giorno per ordinare', d1: 'Ultimo giorno: manca 1 giorno per ordinare', dn: 'Mancano {n} giorni per ordinare al prezzo garantito', fmt: function (p) { return p + ' SEK'; } },
    hu: { d0: 'Ma az utolsó nap a rendelésre', d1: 'Utolsó nap: még 1 nap a rendelésre', dn: 'Még {n} nap a rendelésre a garantált áron', fmt: function (p) { return p + ' SEK'; } }
  };
  var LOCALE = { sv: 'sv-SE', en: 'en-GB', es: 'es-ES', ru: 'ru-RU', hu: 'hu-HU', it: 'it-IT' };
  var heroes = Array.prototype.slice.call(document.querySelectorAll('[data-hero]'));
  if (!heroes.length) return;

  var daysLeft = Math.ceil((GUARANTEE_END - new Date()) / 86400000);
  var expired = daysLeft <= 0;

  heroes.forEach(function (h) {
    var lang = h.getAttribute('data-hero'), t = TX[lang] || TX.sv;
    var track = h.querySelector('.hs-track'), slides = h.querySelectorAll('.hs-slide');
    var dots = h.querySelector('.hs-dots'), cd = h.querySelector('.hs-cd');
    var paused = false, timer = null;

    if (expired) {
      h.classList.add('expired');
      var hh = h.querySelector('.hs-guar'); if (hh && hh.getAttribute('data-expired')) hh.textContent = hh.getAttribute('data-expired');
      var cta = h.querySelector('.hs-btn'); if (cta && cta.getAttribute('data-expired')) cta.textContent = cta.getAttribute('data-expired');
    } else if (cd) {
      cd.textContent = daysLeft === 1 ? t.d1 : t.dn.replace('{n}', daysLeft);
      cd.hidden = false;
    }

    function width() { return track.clientWidth || 1; }
    function index() { return Math.max(0, Math.min(slides.length - 1, Math.round(track.scrollLeft / width()))); }
    function mark() {
      var i = index();
      Array.prototype.forEach.call(dots.children, function (b, k) { b.className = k === i ? 'on' : ''; b.setAttribute('aria-current', k === i ? 'true' : 'false'); });
    }
    function go(i) {
      i = (i + slides.length) % slides.length;
      track.scrollTo({ left: i * width(), behavior: 'smooth' });
    }
    Array.prototype.forEach.call(slides, function (s, i) {
      var b = document.createElement('button'); b.type = 'button';
      b.setAttribute('aria-label', (i + 1) + ' / ' + slides.length);
      b.addEventListener('click', function () { go(i); });
      dots.appendChild(b);
    });
    h.querySelector('.hs-prev').addEventListener('click', function () { go(index() - 1); });
    h.querySelector('.hs-next').addEventListener('click', function () { go(index() + 1); });
    track.addEventListener('scroll', function () { window.requestAnimationFrame(mark); }, { passive: true });
    mark();

    // gentle autoplay; stops for good as soon as the visitor interacts or when motion is reduced
    function stop() { paused = true; if (timer) { clearInterval(timer); timer = null; } }
    ['pointerdown', 'focusin', 'keydown', 'wheel', 'touchstart'].forEach(function (ev) { h.addEventListener(ev, stop, { passive: true }); });
    h.addEventListener('mouseenter', function () { paused = true; });
    h.addEventListener('mouseleave', function () { if (timer) paused = false; });
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduce && slides.length > 1) {
      timer = setInterval(function () {
        if (paused || document.hidden || !h.offsetParent) return;
        go(index() + 1);
      }, 6000);
    }
  });

  // live "from" prices (public function; returns only the featured roses)
  var cfg = window.AB_SHOP_CONFIG;
  if (!cfg || !cfg.supabaseUrl) return;
  fetch(cfg.supabaseUrl + '/rest/v1/rpc/public_from_prices', {
    method: 'POST',
    headers: { 'apikey': cfg.supabaseAnonKey, 'Content-Type': 'application/json' },
    body: '{}'
  }).then(function (r) { return r.ok ? r.json() : []; }).then(function (rows) {
    var by = {}; (rows || []).forEach(function (r) { by[r.variety] = parseFloat(r.from_ex); });
    heroes.forEach(function (h) {
      var lang = h.getAttribute('data-hero'), t = TX[lang] || TX.sv;
      Array.prototype.forEach.call(h.querySelectorAll('.hs-price'), function (el) {
        var v = by[el.getAttribute('data-v')];
        if (!isFinite(v)) return;
        el.querySelector('.v').textContent = t.fmt(v.toLocaleString(LOCALE[lang] || 'sv-SE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
        el.hidden = false;
      });
    });
  }).catch(function () {});
})();
