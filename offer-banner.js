/* Offer banner: sample box of 100 roses for 995 kr.
   Shown once when a visitor enters the site; the X (or Esc / a click outside) closes it and it stays
   closed for 7 days. To change the offer, edit the texts below. */
(function () {
  var KEY = 'ab-offer-closed', DAYS = 7;
  var TXT = {
    sv: { tag: 'Erbjudande till företag', title: 'Provlåda: 100 rosor för 995 kr',
          body: 'Prova våra rosor innan du beställer i större volym. Välj 100 rosor ur vår katalog med de 35 mest populära rosorna.',
          cta: 'Beställ provlåda', more: 'Se rosorna', close: 'Stäng' },
    en: { tag: 'Offer for businesses', title: 'Sample box: 100 roses for SEK 995',
          body: 'Try our roses before you order larger volumes. Choose 100 roses from our catalogue of our 35 most popular roses.',
          cta: 'Order a sample box', more: 'See the roses', close: 'Close' },
    es: { tag: 'Oferta para empresas', title: 'Caja de prueba: 100 rosas por 995 SEK',
          body: 'Pruebe nuestras rosas antes de pedir mayores volúmenes. Elija 100 rosas de nuestro catálogo de las 35 rosas más populares.',
          cta: 'Pedir caja de prueba', more: 'Ver las rosas', close: 'Cerrar' },
    ru: { tag: 'Предложение для компаний', title: 'Пробная коробка: 100 роз за 995 SEK',
          body: 'Попробуйте наши розы, прежде чем заказывать большие объёмы. Выберите 100 роз из каталога наших 35 самых популярных роз.',
          cta: 'Заказать пробную коробку', more: 'Смотреть розы', close: 'Закрыть' },
    hu: { tag: 'Ajánlat vállalkozásoknak', title: 'Próbadoboz: 100 rózsa 995 SEK-ért',
          body: 'Próbálja ki rózsáinkat, mielőtt nagyobb mennyiséget rendel. Válasszon 100 rózsát a 35 legnépszerűbb rózsánkat tartalmazó katalógusunkból.',
          cta: 'Próbadoboz rendelése', more: 'Rózsák megtekintése', close: 'Bezárás' }
  };
  function recentlyClosed() {
    try { var t = parseInt(localStorage.getItem(KEY), 10); return t && Date.now() - t < DAYS * 86400000; } catch (e) { return false; }
  }
  function remember() { try { localStorage.setItem(KEY, String(Date.now())); } catch (e) {} }
  if (recentlyClosed()) return;

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
    '#ab-offer p.b{font-family:Inter,Arial,sans-serif;font-size:14.5px;line-height:1.7;color:#3A342E;margin:0 0 22px;}' +
    '#ab-offer .cta{display:inline-block;background:#8A4A1E;color:#fff;text-decoration:none;font-family:Inter,Arial,sans-serif;font-size:13px;letter-spacing:.08em;text-transform:uppercase;padding:13px 26px;}' +
    '#ab-offer .cta:hover{background:#6F3A17;}' +
    '#ab-offer .more{display:block;margin-top:14px;font-family:Inter,Arial,sans-serif;font-size:13px;color:#5E564F;}' +
    '@media (max-width:480px){#ab-offer .box{padding:30px 20px 22px;}#ab-offer h2{font-size:28px;}}';
  document.head.appendChild(css);

  var el = document.createElement('div');
  el.id = 'ab-offer'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-labelledby', 'ab-offer-t');
  el.innerHTML = '<div class="box"><button type="button" class="x">&times;</button><p class="tag"></p><h2 id="ab-offer-t"></h2><p class="b"></p>' +
    '<a class="cta" href="contact.html"></a><a class="more" href="collection.html"></a></div>';

  function fill() {
    var t = TXT[document.documentElement.lang] || TXT.sv;
    el.querySelector('.tag').textContent = t.tag; el.querySelector('h2').textContent = t.title; el.querySelector('p.b').textContent = t.body;
    el.querySelector('.cta').textContent = t.cta; el.querySelector('.more').textContent = t.more;
    el.querySelector('.x').setAttribute('aria-label', t.close);
  }
  function close() {
    remember(); el.classList.remove('on');
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 260);
    document.removeEventListener('keydown', onKey);
  }
  function onKey(e) { if (e.key === 'Escape') close(); }

  function show() {
    fill(); document.body.appendChild(el);
    new MutationObserver(fill).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    el.querySelector('.x').addEventListener('click', close);
    el.addEventListener('click', function (e) { if (e.target === el) close(); });
    el.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', remember); });
    document.addEventListener('keydown', onKey);
    requestAnimationFrame(function () { el.classList.add('on'); el.querySelector('.x').focus(); });
  }
  // wait a moment so the page's own language switch has run
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(show, 700); });
  else setTimeout(show, 700);
})();
