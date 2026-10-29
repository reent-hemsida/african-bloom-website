/* Offer banner: sample box of 100 roses for 995 kr (excl. VAT).
   Shown once when a visitor enters the site; the X (or Esc / a click outside) closes it and it stays
   closed for 7 days. A small button at the bottom left re-opens it at any time. To change the offer, edit the texts below. */
(function () {
  if (/sample-box\.html$/.test(location.pathname)) return; // the offer page itself needs no banner
  var KEY = 'ab-offer-closed', DAYS = 7;
  var TXT = {
    sv: { pill: 'Provlåda 995 kr', tag: 'Erbjudande till företag', title: 'Provlåda: 100 rosor för 995 kr', vat: 'exkl. moms',
          body: 'Prova våra rosor innan du beställer i större volym. Välj 100 rosor ur vår katalog med de 35 mest populära rosorna.',
          cta: 'Beställ provlåda', more: 'Se rosorna', close: 'Stäng' },
    en: { pill: 'Sample box', tag: 'Offer for businesses', title: 'Sample box: 100 roses for SEK 995', vat: 'excl. VAT',
          body: 'Try our roses before you order larger volumes. Choose 100 roses from our catalogue of our 35 most popular roses.',
          cta: 'Order a sample box', more: 'See the roses', close: 'Close' },
    es: { pill: 'Caja de prueba', tag: 'Oferta para empresas', title: 'Caja de prueba: 100 rosas por 995 SEK', vat: 'sin IVA',
          body: 'Pruebe nuestras rosas antes de pedir mayores volúmenes. Elija 100 rosas de nuestro catálogo de las 35 rosas más populares.',
          cta: 'Pedir caja de prueba', more: 'Ver las rosas', close: 'Cerrar' },
    ru: { pill: 'Пробная коробка', tag: 'Предложение для компаний', title: 'Пробная коробка: 100 роз за 995 SEK', vat: 'без НДС',
          body: 'Попробуйте наши розы, прежде чем заказывать большие объёмы. Выберите 100 роз из каталога наших 35 самых популярных роз.',
          cta: 'Заказать пробную коробку', more: 'Смотреть розы', close: 'Закрыть' },
    it: { pill: 'Scatola di prova', tag: 'Offerta per aziende', title: 'Scatola di prova: 100 rose a 995 SEK', vat: 'IVA esclusa',
          body: 'Provate le nostre rose prima di ordinare volumi maggiori. Scegliete 100 rose dal nostro catalogo delle 35 rose più richieste.',
          cta: 'Ordina una scatola di prova', more: 'Vedi le rose', close: 'Chiudi' },
    hu: { pill: 'Próbadoboz', tag: 'Ajánlat vállalkozásoknak', title: 'Próbadoboz: 100 rózsa 995 SEK-ért', vat: '+ ÁFA',
          body: 'Próbálja ki rózsáinkat, mielőtt nagyobb mennyiséget rendel. Válasszon 100 rózsát a 35 legnépszerűbb rózsánkat tartalmazó katalógusunkból.',
          cta: 'Próbadoboz rendelése', more: 'Rózsák megtekintése', close: 'Bezárás' }
  };
  // card docked beside the homepage hero (desktop only; the markup is in index.html, hero.css styles it)
  var DOCK = {
    sv: { big: '100 rosor', small: 'i en provlåda', price: '995 kr', vat: 'exkl. moms' },
    en: { big: '100 roses', small: 'in a sample box', price: 'SEK 995', vat: 'excl. VAT' },
    es: { big: '100 rosas', small: 'en una caja de prueba', price: '995 SEK', vat: 'sin IVA' },
    ru: { big: '100 роз', small: 'в пробной коробке', price: '995 SEK', vat: 'без НДС' },
    it: { big: '100 rose', small: 'in una scatola di prova', price: '995 SEK', vat: 'IVA esclusa' },
    hu: { big: '100 rózsa', small: 'egy próbadobozban', price: '995 SEK', vat: '+ ÁFA' }
  };
  function fillDocks() {
    document.querySelectorAll('.ab-dock').forEach(function (d) {
      var l = d.getAttribute('data-dock') || 'sv', t = TXT[l] || TXT.sv, k = DOCK[l] || DOCK.sv;
      d.innerHTML = '<p class="dtag"></p><p class="dbig"><span></span><small></small></p><p class="dprice"><b></b><span></span></p><p class="dbody"></p><a class="dcta" href="sample-box.html"></a>';
      d.querySelector('.dtag').textContent = t.tag; d.querySelector('.dbig span').textContent = k.big; d.querySelector('.dbig small').textContent = k.small;
      d.querySelector('.dprice b').textContent = k.price; d.querySelector('.dprice span').textContent = k.vat;
      d.querySelector('.dbody').textContent = t.body; d.querySelector('.dcta').textContent = t.cta;
    });
  }
  function watchDocks() {
    var docks = document.querySelectorAll('.ab-dock'); if (!docks.length) return;
    // the floating button is hidden while the docked card is on screen (see hero.css)
    if ('IntersectionObserver' in window) {
      var seen = {};
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { seen[e.target.getAttribute('data-dock')] = e.isIntersecting; });
        var any = false; for (var k in seen) if (seen[k]) any = true;
        document.body.classList.toggle('ab-dock-seen', any);
      }, { threshold: 0.3 });
      docks.forEach(function (d) { io.observe(d); });
    }
  }
  function pulseDock() {
    document.querySelectorAll('.ab-dock').forEach(function (d) {
      if (!d.offsetParent) return;
      d.classList.remove('pulse'); void d.offsetWidth; d.classList.add('pulse');
    });
  }
  function recentlyClosed() {
    try { var t = parseInt(localStorage.getItem(KEY), 10); return t && Date.now() - t < DAYS * 86400000; } catch (e) { return false; }
  }
  function remember() { try { localStorage.setItem(KEY, String(Date.now())); } catch (e) {} }

  var css = document.createElement('style');
  css.textContent =
    '#ab-offer{position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(32,28,26,.55);opacity:0;transition:opacity .25s;}' +
    '#ab-offer.on{opacity:1;}' +
    '#ab-offer .box{position:relative;width:100%;max-width:460px;background:#FBF6EC;border-top:4px solid #8A4A1E;box-shadow:0 18px 50px rgba(0,0,0,.35);padding:34px 30px 28px;text-align:center;transform:translateY(10px);transition:transform .25s;}' +
    '#ab-offer.on .box{transform:none;}' +
    '#ab-offer .x{position:absolute;top:8px;right:8px;width:40px;height:40px;border:0;background:none;cursor:pointer;color:#5E564F;font-size:26px;line-height:40px;}' +
    '#ab-offer .x:hover{color:#201C1A;}#ab-offer .x:focus-visible,#ab-offer a:focus-visible{outline:3px solid #201C1A;outline-offset:2px;}' +
    '#ab-offer .tag{font-family:Inter,Arial,sans-serif;font-size:11.5px;letter-spacing:.14em;text-transform:uppercase;color:#8A4A1E;font-weight:600;margin:0 0 10px;}' +
    '#ab-offer h2{font-family:"Cormorant Garamond",Georgia,serif;font-weight:500;font-size:34px;line-height:1.15;color:#201C1A;margin:0 0 12px;}' +
    '#ab-offer .vat{font-family:Inter,Arial,sans-serif;font-size:14px;font-weight:400;color:#5E564F;white-space:nowrap;}' +
    '#ab-offer p.b{font-family:Inter,Arial,sans-serif;font-size:14.5px;line-height:1.7;color:#3A342E;margin:0 0 22px;}' +
    '#ab-offer .cta{display:inline-block;background:#8A4A1E;color:#fff;text-decoration:none;font-family:Inter,Arial,sans-serif;font-size:13px;letter-spacing:.08em;text-transform:uppercase;padding:13px 26px;}' +
    '#ab-offer .cta:hover{background:#6F3A17;}' +
    '#ab-offer .more{display:block;margin-top:14px;font-family:Inter,Arial,sans-serif;font-size:13px;color:#5E564F;}' +
    '#ab-offer-pill{position:fixed;left:18px;bottom:22px;z-index:900;display:flex;align-items:center;gap:8px;border:0;cursor:pointer;background:#8A4A1E;color:#fff;font-family:Inter,Arial,sans-serif;font-size:13px;font-weight:600;letter-spacing:.04em;padding:12px 18px;border-radius:999px;box-shadow:0 4px 14px rgba(0,0,0,.28);transition:transform .15s,background .15s;}' +
    '#ab-offer-pill:hover{background:#6F3A17;transform:scale(1.04);}#ab-offer-pill:focus-visible{outline:3px solid #201C1A;outline-offset:3px;}' +
    '#ab-offer-pill svg{width:18px;height:18px;flex:none;}' +
    '@media print{#ab-offer-pill{display:none;}}' +
    '@media (max-width:480px){#ab-offer .box{padding:30px 20px 22px;}#ab-offer h2{font-size:28px;}#ab-offer-pill{left:12px;bottom:14px;padding:10px 14px;font-size:12px;}}';
  document.head.appendChild(css);

  var el = document.createElement('div');
  el.id = 'ab-offer'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-labelledby', 'ab-offer-t');
  el.innerHTML = '<div class="box"><button type="button" class="x">&times;</button><p class="tag"></p><h2 id="ab-offer-t"></h2><p class="b"></p>' +
    '<a class="cta" href="sample-box.html"></a><a class="more" href="collection.html"></a></div>';

  var pill = document.createElement('button');
  pill.id = 'ab-offer-pill'; pill.type = 'button';
  pill.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 12v9H4v-9"/><path d="M2 7h20v5H2z"/><path d="M12 21V7"/><path d="M12 7H7.5a2.5 2.5 0 1 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 1 0 0-5C13 2 12 7 12 7z"/></svg><span></span>';

  function fill() {
    var t = TXT[document.documentElement.lang] || TXT.sv;
    el.querySelector('.tag').textContent = t.tag; var h = el.querySelector('h2'); h.textContent = t.title + ' '; var sp = document.createElement('span'); sp.className = 'vat'; sp.textContent = t.vat; h.appendChild(sp); el.querySelector('p.b').textContent = t.body;
    el.querySelector('.cta').textContent = t.cta; el.querySelector('.more').textContent = t.more;
    el.querySelector('.x').setAttribute('aria-label', t.close);
    pill.querySelector('span').textContent = t.pill; pill.setAttribute('aria-label', t.title + ' ' + t.vat);
    fillDocks();
  }
  function onKey(e) { if (e.key === 'Escape') close(); }
  function open() {
    fill(); pill.style.display = 'none'; document.body.appendChild(el);
    document.addEventListener('keydown', onKey);
    requestAnimationFrame(function () { el.classList.add('on'); el.querySelector('.x').focus(); });
  }
  function close() {
    remember(); el.classList.remove('on'); pill.style.display = '';
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 260);
    document.removeEventListener('keydown', onKey);
    pill.focus();
    setTimeout(pulseDock, 300);
  }

  function init() {
    fill(); document.body.appendChild(pill); watchDocks();
    new MutationObserver(fill).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    el.querySelector('.x').addEventListener('click', close);
    el.addEventListener('click', function (e) { if (e.target === el) close(); });
    el.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', remember); });
    pill.addEventListener('click', open);
    // open by itself on a first visit (or after 7 days); otherwise only the small button is shown
    if (!recentlyClosed()) open();
  }
  fillDocks(); // docked card on the homepage: fill straight away so it is never shown empty
  // wait a moment so the page's own language switch has run
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(init, 700); });
  else setTimeout(init, 700);
})();
