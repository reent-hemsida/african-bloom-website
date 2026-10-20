/* Africane Bloom webshop — shared core (used by login.html, shop.html, admin.html, privacy.html).
   - 4-language strings, header/footer shell
   - two backends behind one interface: Supabase (live) and a localStorage demo (localhost only)
   - catalogue, volume-price calculation and cart
   Prices are never stored in this repository; they live in the database and are only
   readable by approved customers (see supabase/schema.sql). */
(function () {
  'use strict';

  var CFG = window.AB_SHOP_CONFIG || {};
  var SB_SRC = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js';
  var SB_SRI = 'sha384-0w2KAL2YHP6wKOkUDzkCDGgVvfmHnj02DHeQ6XcHOgTfFsGyonKOpShMH1x6nk9o';
  var LANGS = ['sv', 'en']; // es/ru hidden for now (strings kept in S/CAT_LABELS/COLOR_LABELS)
  var LOCALES = { en: 'en-GB', es: 'es-ES', ru: 'ru-RU', sv: 'sv-SE' };
  var GROUPS = ['red', 'white', 'pink', 'yellow', 'orange', 'peach', 'spray', 'special_spray'];
  var HEADS = ['standard', 'large', 'xlarge'];

  var isLocal = /^(localhost|127\.0\.0\.1|\[::1\]|.*\.localhost)$/.test(location.hostname) || location.protocol === 'file:';
  var forceDemo = isLocal && /[?&]demo=1\b/.test(location.search);
  var configured = !!(CFG.supabaseUrl && CFG.supabaseAnonKey) && !forceDemo;
  var MODE = configured ? 'supabase' : (isLocal ? 'demo' : 'off');

  /* ------------------------------------------------------------------ strings */
  var S = {
    en: {
      c_home: 'Home', c_about: 'About', c_collection: 'Collection', c_order: 'How to Order', c_faq: 'FAQ', c_contact: 'Contact',
      c_shop: 'Webshop', c_customer: 'Customer login', c_login: 'Log in', c_logout: 'Log out', c_admin: 'Admin',
      c_complaints: 'Complaints Policy', c_privacy: 'Privacy policy', c_loading: 'Loading…',
      c_cm: 'cm', c_stems: 'stems', c_sek: 'SEK', c_error: 'Something went wrong. Please try again.',
      c_demo: '<b>DEMO MODE</b> — test data in this browser only, nothing is sent. Admin: admin@demo.test / demo1234'
    },
    sv: {
      c_home: 'Hem', c_about: 'Om Oss', c_collection: 'Kollektion', c_order: 'Beställning', c_faq: 'FAQ', c_contact: 'Kontakt',
      c_shop: 'Webbshop', c_customer: 'Kundinloggning', c_login: 'Logga in', c_logout: 'Logga ut', c_admin: 'Admin',
      c_complaints: 'Reklamationspolicy', c_privacy: 'Integritetspolicy', c_loading: 'Laddar…',
      c_cm: 'cm', c_stems: 'stjälkar', c_sek: 'SEK', c_error: 'Något gick fel. Försök igen.',
      c_demo: '<b>DEMOLÄGE</b> — testdata endast i den här webbläsaren, inget skickas. Admin: admin@demo.test / demo1234'
    },
    es: {
      c_home: 'Inicio', c_about: 'Nosotros', c_collection: 'Colección', c_order: 'Cómo Pedir', c_faq: 'FAQ', c_contact: 'Contacto',
      c_shop: 'Tienda online', c_customer: 'Acceso de clientes', c_login: 'Iniciar sesión', c_logout: 'Cerrar sesión', c_admin: 'Admin',
      c_complaints: 'Política de Reclamaciones', c_privacy: 'Política de privacidad', c_loading: 'Cargando…',
      c_cm: 'cm', c_stems: 'tallos', c_sek: 'SEK', c_error: 'Algo salió mal. Inténtelo de nuevo.'
    },
    ru: {
      c_home: 'Главная', c_about: 'О нас', c_collection: 'Коллекция', c_order: 'Как Заказать', c_faq: 'FAQ', c_contact: 'Контакты',
      c_shop: 'Интернет-магазин', c_customer: 'Вход для клиентов', c_login: 'Войти', c_logout: 'Выйти', c_admin: 'Админ',
      c_complaints: 'Политика рекламаций', c_privacy: 'Политика конфиденциальности', c_loading: 'Загрузка…',
      c_cm: 'см', c_stems: 'стеблей', c_sek: 'SEK', c_error: 'Что-то пошло не так. Попробуйте ещё раз.'
    }
  };
  var PDF = { en: 'complaints-policy.pdf', sv: 'reklamationspolicy.pdf', es: 'politica-de-reclamaciones.pdf', ru: 'politika-reklamatsiy.pdf' };
  var CAT_KEYS = { r: 'Roses', g: 'Garden Roses', s: 'Spray Roses', c: 'Carnations', a: 'Alstroemeria', u: 'Ranunculus', y: 'Gypsophila', o: 'Other Flowers' };
  var CAT_LABELS = {
    en: { r: 'Roses', g: 'Garden Roses', s: 'Spray Roses', c: 'Carnations', a: 'Alstroemeria', u: 'Ranunculus', y: 'Gypsophila', o: 'Other Flowers' },
    es: { r: 'Rosas', g: 'Rosas de Jardín', s: 'Rosas Spray', c: 'Claveles', a: 'Alstroemeria', u: 'Ranúnculos', y: 'Gypsophila', o: 'Otras Flores' },
    ru: { r: 'Розы', g: 'Садовые розы', s: 'Спрей-розы', c: 'Гвоздики', a: 'Альстромерия', u: 'Ранункулюс', y: 'Гипсофила', o: 'Другие цветы' },
    sv: { r: 'Rosor', g: 'Trädgårdsrosor', s: 'Sprayrosor', c: 'Nejlikor', a: 'Alstroemeria', u: 'Ranunkel', y: 'Gypsophila', o: 'Övriga blommor' }
  };
  var COLOR_LABELS = {
    en: ['Bicolor', 'Blue', 'Bronze', 'Burgundy', 'Cream', 'Gold', 'Green', 'Hot Pink', 'Lavender', 'Light Blue', 'Light Pink', 'Mix Color', 'Orange', 'Peach', 'Pink', 'Purple', 'Red', 'White', 'Yellow'],
    es: ['Bicolor', 'Azul', 'Bronce', 'Burdeos', 'Crema', 'Dorado', 'Verde', 'Rosa fuerte', 'Lavanda', 'Azul claro', 'Rosa claro', 'Multicolor', 'Naranja', 'Melocotón', 'Rosa', 'Morado', 'Rojo', 'Blanco', 'Amarillo'],
    ru: ['Двухцветный', 'Синий', 'Бронзовый', 'Бордовый', 'Кремовый', 'Золотой', 'Зелёный', 'Ярко-розовый', 'Лавандовый', 'Голубой', 'Светло-розовый', 'Микс', 'Оранжевый', 'Персиковый', 'Розовый', 'Фиолетовый', 'Красный', 'Белый', 'Жёлтый'],
    sv: ['Tvåfärgad', 'Blå', 'Brons', 'Vinröd', 'Gräddvit', 'Guld', 'Grön', 'Cerise', 'Lavendel', 'Ljusblå', 'Ljusrosa', 'Blandade färger', 'Orange', 'Persika', 'Rosa', 'Lila', 'Röd', 'Vit', 'Gul']
  };

  var lang = 'sv';
  try { var sv = localStorage.getItem('ab-lang'); if (LANGS.indexOf(sv) >= 0) lang = sv; } catch (e) {}
  var langCbs = [];

  function addStrings(dict) {
    Object.keys(dict).forEach(function (l) {
      S[l] = S[l] || {};
      Object.keys(dict[l]).forEach(function (k) { S[l][k] = dict[l][k]; });
    });
  }
  function t(key, vars) {
    var s = (S[lang] && S[lang][key]);
    if (s === undefined) s = S.en[key];
    if (s === undefined) return key;
    if (vars) s = s.replace(/\{(\w+)\}/g, function (m, k) { return vars[k] === undefined ? m : vars[k]; });
    return s;
  }
  function esc(v) {
    return String(v === null || v === undefined ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function applyI18n(root) {
    root = root || document;
    root.querySelectorAll('[data-i18n]').forEach(function (el) { el.textContent = t(el.getAttribute('data-i18n')); });
    root.querySelectorAll('[data-i18n-html]').forEach(function (el) { el.innerHTML = t(el.getAttribute('data-i18n-html')); });
    root.querySelectorAll('[data-i18n-ph]').forEach(function (el) { el.setAttribute('placeholder', t(el.getAttribute('data-i18n-ph'))); });
    root.querySelectorAll('[data-lang-show]').forEach(function (el) { el.hidden = el.getAttribute('data-lang-show') !== lang; });
  }
  function setLang(code) {
    if (LANGS.indexOf(code) < 0) return;
    lang = code;
    try { localStorage.setItem('ab-lang', code); } catch (e) {}
    document.documentElement.lang = code;
    renderShell();
    applyI18n(document);
    langCbs.forEach(function (cb) { cb(code); });
  }

  /* ------------------------------------------------------------------ formatting */
  function fmt(n) {
    return new Intl.NumberFormat(LOCALES[lang], { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
  }
  function fmtInt(n) { return new Intl.NumberFormat(LOCALES[lang]).format(n); }
  function fmtDate(iso) {
    try { return new Date(iso).toLocaleString(LOCALES[lang], { dateStyle: 'medium', timeStyle: 'short' }); } catch (e) { return iso; }
  }
  function round2(x) { return Math.round(x * 100) / 100; }

  /* ------------------------------------------------------------------ catalogue + pricing */
  var VARIETIES = (window.VARIETY_DATA || '').split('\n').filter(Boolean).map(function (l) {
    var p = l.split('|');
    return { name: p[0], cat: p[1], sub: p[2] || '', colour: p[3] === '' || p[3] === undefined ? -1 : parseInt(p[3], 10), photo: p[4] || '' };
  });

  /* rows: [{price_group, head_size, length_cm, tier_qty, price_ex_vat, price_inc_vat}] */
  function buildCatalog(rows, groups, settings) {
    var idx = {}, byGroup = {};
    rows.forEach(function (r) {
      var k = r.price_group + '|' + r.head_size + '|' + r.length_cm;
      (idx[k] = idx[k] || []).push(r);
      var g = byGroup[r.price_group] = byGroup[r.price_group] || { heads: {}, minTier: Infinity, maxTier: 0 };
      (g.heads[r.head_size] = g.heads[r.head_size] || {})[r.length_cm] = true;
      g.minTier = Math.min(g.minTier, r.tier_qty);
      g.maxTier = Math.max(g.maxTier, r.tier_qty);
    });
    Object.keys(idx).forEach(function (k) { idx[k].sort(function (a, b) { return b.tier_qty - a.tier_qty; }); });
    var cat = { rows: rows, idx: idx, byGroup: byGroup, groups: groups || {}, settings: settings || {} };
    cat.minStems = parseInt(cat.settings.min_total_stems, 10) || 0;
    var vp = parseFloat(cat.settings.vat_percent);
    cat.vatPct = isFinite(vp) && vp >= 0 ? vp : 25;
    return cat;
  }
  function priceFor(cat, group, head, len, vqty) {
    var list = cat.idx[group + '|' + head + '|' + len];
    if (!list) return null;
    for (var i = 0; i < list.length; i++) if (list[i].tier_qty <= vqty) return list[i];
    return null;
  }
  function groupInfo(cat, variety) {
    var g = cat.groups[variety];
    return g && cat.byGroup[g] ? { group: g, info: cat.byGroup[g] } : null;
  }
  function lengthsFor(cat, variety, head) {
    var gi = groupInfo(cat, variety);
    if (!gi) return [40, 50, 60, 70, 80];
    var h = gi.info.heads[head] || gi.info.heads.standard || {};
    return Object.keys(h).map(Number).sort(function (a, b) { return a - b; });
  }
  function headsFor(cat, variety) {
    var gi = groupInfo(cat, variety);
    if (!gi) return ['standard'];
    return HEADS.filter(function (h) { return gi.info.heads[h]; });
  }
  /* cart: [{variety, category, head, len, qty}] */
  function calcCart(cat, cart) {
    var vat = cat.vatPct === undefined ? 25 : cat.vatPct;
    var vq = {};
    cart.forEach(function (i) { vq[i.variety] = (vq[i.variety] || 0) + i.qty; });
    var lines = cart.map(function (i) {
      var gi = groupInfo(cat, i.variety);
      var r = gi ? priceFor(cat, gi.group, i.head, i.len, vq[i.variety]) : null;
      var lineEx = r ? round2(r.price_ex_vat * i.qty) : null;
      return {
        item: i, group: gi ? gi.group : null, varietyQty: vq[i.variety],
        unitEx: r ? r.price_ex_vat : null, unitInc: r ? round2(r.price_ex_vat * (1 + vat / 100)) : null,
        lineEx: lineEx, lineInc: lineEx === null ? null : round2(lineEx * (1 + vat / 100)),
        tier: r ? r.tier_qty : null
      };
    });
    var hints = [];
    Object.keys(vq).forEach(function (v) {
      var gi = groupInfo(cat, v);
      if (!gi) return;
      var tiers = {};
      cat.rows.forEach(function (r) { if (r.price_group === gi.group) tiers[r.tier_qty] = true; });
      var list = Object.keys(tiers).map(Number).sort(function (a, b) { return a - b; });
      for (var i = 0; i < list.length; i++) {
        if (vq[v] < list[i]) { hints.push({ variety: v, have: vq[v], next: list[i], first: i === 0 }); break; }
      }
    });
    var tot = { stems: 0, ex: 0, inc: 0, vat: 0, vatPct: vat, unpriced: 0 };
    lines.forEach(function (l) {
      tot.stems += l.item.qty;
      if (l.lineEx === null) tot.unpriced++; else tot.ex += l.lineEx;
    });
    // VAT is calculated on the net total, as on an invoice.
    tot.ex = round2(tot.ex); tot.inc = round2(tot.ex * (1 + vat / 100)); tot.vat = round2(tot.inc - tot.ex);
    return { lines: lines, hints: hints, totals: tot };
  }

  /* cart persistence (a per-browser convenience only; the order itself is stored server-side) */
  var CART_KEY = 'ab-cart';
  var cart = {
    get: function () { try { var c = JSON.parse(localStorage.getItem(CART_KEY)); return Array.isArray(c) ? c : []; } catch (e) { return []; } },
    set: function (c) { try { localStorage.setItem(CART_KEY, JSON.stringify(c)); } catch (e) {} },
    add: function (item) {
      var c = cart.get();
      for (var i = 0; i < c.length; i++) {
        if (c[i].variety === item.variety && c[i].head === item.head && c[i].len === item.len) { c[i].qty += item.qty; cart.set(c); return c; }
      }
      c.push(item); cart.set(c); return c;
    },
    remove: function (i) { var c = cart.get(); c.splice(i, 1); cart.set(c); return c; },
    clear: function () { cart.set([]); }
  };

  /* ------------------------------------------------------------------ CSV */
  function parseCSV(text) {
    var rows = [], row = [], f = '', q = false, i = 0;
    text = String(text).replace(/^﻿/, '');
    for (; i < text.length; i++) {
      var c = text[i];
      if (q) {
        if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c;
      } else if (c === '"') q = true;
      else if (c === ',' || c === ';') { row.push(f); f = ''; }
      else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(f); f = ''; if (row.some(function (x) { return x !== ''; })) rows.push(row); row = []; }
      else f += c;
    }
    row.push(f); if (row.some(function (x) { return x !== ''; })) rows.push(row);
    if (!rows.length) return [];
    var head = rows[0].map(function (h) { return h.trim().toLowerCase(); });
    return rows.slice(1).map(function (r) {
      var o = {}; head.forEach(function (h, k) { o[h] = (r[k] || '').trim(); }); return o;
    });
  }
  function toCSV(rows, cols) {
    function cell(v) { v = v === null || v === undefined ? '' : String(v); return /[",\n;]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
    return [cols.join(',')].concat(rows.map(function (r) { return cols.map(function (c) { return cell(r[c]); }).join(','); })).join('\n');
  }

  /* ------------------------------------------------------------------ owner notifications */
  function notify(subject, fields) {
    if (MODE !== 'supabase' || !CFG.notifyEndpoint) return Promise.resolve(false);
    var fd = new FormData();
    fd.append('_subject', subject);
    fd.append('_template', 'table');
    fd.append('_captcha', 'false');
    Object.keys(fields).forEach(function (k) { fd.append(k, fields[k]); });
    return fetch(CFG.notifyEndpoint, { method: 'POST', headers: { Accept: 'application/json' }, body: fd })
      .then(function (r) { return r.ok; }).catch(function () { return false; });
  }

  /* ------------------------------------------------------------------ backends */
  function err(code, extra) { var e = new Error(code); e.code = code; e.extra = extra; return e; }

  function SupabaseBackend() {
    var sb = null, recovery = false;
    function loadLib() {
      return new Promise(function (res, rej) {
        if (window.supabase && window.supabase.createClient) return res();
        var s = document.createElement('script');
        s.src = SB_SRC; s.integrity = SB_SRI; s.crossOrigin = 'anonymous';
        s.onload = res; s.onerror = function () { rej(err('generic')); };
        document.head.appendChild(s);
      });
    }
    function mapAuth(e) {
      var m = (e && e.message || '').toLowerCase();
      if (m.indexOf('invalid login') >= 0) return err('invalid_credentials');
      if (m.indexOf('not confirmed') >= 0) return err('email_not_confirmed');
      if (m.indexOf('at least') >= 0 || m.indexOf('weak') >= 0) return err('weak_password');
      if (m.indexOf('rate') >= 0 || m.indexOf('too many') >= 0 || e.status === 429) return err('rate_limit');
      return err('generic');
    }
    function must(r) { if (r.error) throw err('generic', r.error.message); return r.data; }
    var api = {
      init: function () {
        return loadLib().then(function () {
          sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
          sb.auth.onAuthStateChange(function (ev) { if (ev === 'PASSWORD_RECOVERY') recovery = true; });
        });
      },
      isRecovery: function () { return recovery || /type=recovery/.test(location.hash); },
      user: function () {
        return sb.auth.getSession().then(function (r) { var u = r.data && r.data.session && r.data.session.user; return u ? { id: u.id, email: u.email } : null; });
      },
      signUp: function (email, pw, meta) {
        return sb.auth.signUp({ email: email, password: pw, options: { data: meta, emailRedirectTo: location.origin + location.pathname.replace(/[^/]*$/, '') + 'login.html' } })
          .then(function (r) { if (r.error) throw mapAuth(r.error); return { confirm: !(r.data && r.data.session) }; });
      },
      signIn: function (email, pw) {
        return sb.auth.signInWithPassword({ email: email, password: pw }).then(function (r) { if (r.error) throw mapAuth(r.error); });
      },
      signOut: function () { return sb.auth.signOut(); },
      resetPassword: function (email) {
        return sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname }).then(function (r) { if (r.error) throw mapAuth(r.error); });
      },
      updatePassword: function (pw) { return sb.auth.updateUser({ password: pw }).then(function (r) { if (r.error) throw mapAuth(r.error); }); },
      profile: function (uid) { return sb.from('profiles').select('*').eq('id', uid).maybeSingle().then(must); },
      catalog: function () {
        // Supabase caps every response at 1000 rows, so read the big tables page by page.
        function fetchAll(table, cols, order) {
          var out = [], size = 1000;
          function page(from) {
            return sb.from(table).select(cols).order(order, { ascending: true }).range(from, from + size - 1).then(must).then(function (rows) {
              out = out.concat(rows);
              return rows.length === size ? page(from + size) : out;
            });
          }
          return page(0);
        }
        return Promise.all([
          fetchAll('price_rows', 'price_group,head_size,length_cm,tier_qty,price_ex_vat,price_inc_vat', 'id'),
          fetchAll('variety_groups', 'variety,price_group', 'variety'),
          sb.from('shop_settings').select('key,value').then(must)
        ]).then(function (a) {
          var g = {}, s = {};
          a[1].forEach(function (x) { g[x.variety] = x.price_group; });
          a[2].forEach(function (x) { s[x.key] = x.value; });
          return buildCatalog(a[0], g, s);
        });
      },
      placeOrder: function (items, note, delivery) {
        return sb.rpc('place_order', { p_items: items, p_note: note || null, p_delivery: delivery || null }).then(function (r) {
          if (r.error) {
            var m = r.error.message || '';
            if (m.indexOf('below_minimum') >= 0) throw err('below_minimum', (m.split(':')[1] || '').trim());
            if (m.indexOf('not_approved') >= 0) throw err('not_approved');
            throw err('generic', m);
          }
          var row = Array.isArray(r.data) ? r.data[0] : r.data;
          return { id: row.order_id, order_no: row.order_no, total_ex_vat: row.total_ex_vat, total_inc_vat: row.total_inc_vat, unpriced_lines: row.unpriced_lines };
        });
      },
      myOrders: function (uid) {
        return sb.from('orders').select('*, order_items(*)').eq('user_id', uid).order('created_at', { ascending: false }).then(must);
      },
      /* admin */
      listProfiles: function () { return sb.from('profiles').select('*').order('created_at', { ascending: false }).then(must); },
      setProfileStatus: function (id, status) { return sb.from('profiles').update({ status: status }).eq('id', id).then(must); },
      setProfileLang: function (id, lang) { return sb.from('profiles').update({ lang: lang }).eq('id', id).then(must); },
      /* Sends the "account approved" e-mail through the send-approval Edge Function. */
      notifyApproved: function (id) {
        return sb.functions.invoke('send-approval', { body: { customer_id: id } }).then(function (r) {
          if (r.error) throw err('generic', r.error.message);
          if (r.data && r.data.error) throw err('generic', r.data.error);
          return r.data;
        });
      },
      listOrders: function () { return sb.from('orders').select('*, order_items(*)').order('created_at', { ascending: false }).limit(500).then(must); },
      setOrderStatus: function (id, status) { return sb.from('orders').update({ status: status }).eq('id', id).then(must); },
      replacePrices: function (rows) { return sb.rpc('admin_replace_prices', { p_rows: rows }).then(must); },
      replaceVarietyGroups: function (rows) { return sb.rpc('admin_replace_variety_groups', { p_rows: rows }).then(must); },
      saveSetting: function (k, v) { return sb.from('shop_settings').upsert({ key: k, value: String(v) }).then(must); }
    };
    return api;
  }

  /* Demo backend: everything lives in this browser's localStorage. Localhost only. */
  function MockBackend() {
    var KEY = 'ab-demo-db-v1', SKEY = 'ab-demo-session';
    var db;
    function uid() { return 'u' + Math.random().toString(36).slice(2, 10); }
    function demoPrices() {
      var base = { red: 3.0, white: 3.2, pink: 3.1, yellow: 3.2, orange: 3.2, peach: 3.3, spray: 2.2, special_spray: 2.6 }, rows = [];
      Object.keys(base).forEach(function (g) {
        (g === 'red' ? HEADS : g === 'spray' || g === 'special_spray' ? ['standard'] : ['standard', 'large']).forEach(function (h, hi) {
          [40, 50, 60, 70, 80].forEach(function (len) {
            [5000, 10000, 20000].forEach(function (q, qi) {
              var p = (base[g] + (len - 40) / 10 * 0.3 + hi * 0.5) * (1 - qi * 0.05);
              rows.push({ price_group: g, head_size: h, length_cm: len, tier_qty: q, price_ex_vat: round2(p), price_inc_vat: round2(p * 1.25) });
            });
          });
        });
      });
      return rows;
    }
    function seed() {
      var d = { users: [], profiles: {}, price_rows: demoPrices(), groups: {}, settings: { min_total_stems: '1000' }, orders: [], orderNo: 1000 };
      var map = { 16: 'red', 17: 'white', 14: 'pink', 10: 'pink', 7: 'pink', 18: 'yellow', 12: 'orange', 13: 'peach', 4: 'peach' };
      VARIETIES.forEach(function (v) {
        if (v.cat === 'r' && map[v.colour]) d.groups[v.name] = map[v.colour];
        if (v.cat === 's') d.groups[v.name] = 'spray';
      });
      var id = uid();
      d.users.push({ id: id, email: 'admin@demo.test', pw: 'demo1234' });
      d.profiles[id] = { id: id, email: 'admin@demo.test', company: 'Africane Bloom (demo admin)', contact_name: 'Demo Admin', phone: '', country: 'SE', vat_no: '', lang: 'en', status: 'approved', is_admin: true, created_at: new Date().toISOString() };
      save(d);
      return d;
    }
    function load() { try { var d = JSON.parse(localStorage.getItem(KEY)); if (d && d.users) return d; } catch (e) {} return seed(); }
    function save(d) { localStorage.setItem(KEY, JSON.stringify(d || db)); }
    function me() { var s = sessionStorage.getItem(SKEY); return s ? db.profiles[s] : null; }
    function needAdmin() { var p = me(); if (!p || !p.is_admin) throw err('generic', 'not_admin'); }
    function resolve(v) { return Promise.resolve(JSON.parse(JSON.stringify(v === undefined ? null : v))); }

    return {
      init: function () { db = load(); return Promise.resolve(); },
      isRecovery: function () { return false; },
      user: function () { var p = me(); return resolve(p ? { id: p.id, email: p.email } : null); },
      signUp: function (email, pw, meta) {
        db = load();
        if (pw.length < 6) return Promise.reject(err('weak_password'));
        if (db.users.some(function (u) { return u.email === email.toLowerCase(); })) return Promise.resolve({ confirm: true });
        var id = uid();
        db.users.push({ id: id, email: email.toLowerCase(), pw: pw });
        db.profiles[id] = { id: id, email: email.toLowerCase(), company: meta.company || '-', contact_name: meta.contact_name || '-', phone: meta.phone || '', country: meta.country || '', vat_no: meta.vat_no || '', lang: meta.lang || 'en', status: 'pending', is_admin: false, created_at: new Date().toISOString() };
        save();
        return Promise.resolve({ confirm: false });
      },
      signIn: function (email, pw) {
        db = load();
        var u = db.users.filter(function (x) { return x.email === email.toLowerCase() && x.pw === pw; })[0];
        if (!u) return Promise.reject(err('invalid_credentials'));
        sessionStorage.setItem(SKEY, u.id);
        return Promise.resolve();
      },
      signOut: function () { sessionStorage.removeItem(SKEY); return Promise.resolve(); },
      resetPassword: function () { return Promise.resolve(); },
      updatePassword: function () { return Promise.resolve(); },
      profile: function (id) { db = load(); return resolve(db.profiles[id] || null); },
      catalog: function () {
        db = load();
        var p = me();
        if (!p || (p.status !== 'approved' && !p.is_admin)) return Promise.resolve(buildCatalog([], {}, {}));
        return Promise.resolve(buildCatalog(db.price_rows, db.groups, db.settings));
      },
      placeOrder: function (items, note, delivery) {
        db = load();
        var p = me();
        if (!p || p.status !== 'approved') return Promise.reject(err('not_approved'));
        var total = items.reduce(function (a, i) { return a + i.qty; }, 0);
        var min = parseInt(db.settings.min_total_stems, 10) || 0;
        if (total < min) return Promise.reject(err('below_minimum', String(min)));
        var cat = buildCatalog(db.price_rows, db.groups, db.settings);
        var calc = calcCart(cat, items.map(function (i) { return { variety: i.variety, category: i.category, head: i.head_size, len: i.length_cm, qty: i.qty }; }));
        db.orderNo += 1;
        var o = {
          id: uid(), order_no: db.orderNo, user_id: p.id, status: 'new', note: note || '', delivery_note: delivery || '',
          total_ex_vat: calc.totals.ex, total_inc_vat: calc.totals.inc, unpriced_lines: calc.totals.unpriced, created_at: new Date().toISOString(),
          order_items: calc.lines.map(function (l) {
            return { variety: l.item.variety, category: l.item.category, price_group: l.group, head_size: l.item.head, length_cm: l.item.len, qty: l.item.qty, unit_ex_vat: l.unitEx, unit_inc_vat: l.unitInc, line_ex_vat: l.lineEx, line_inc_vat: l.lineInc };
          })
        };
        db.orders.unshift(o); save();
        return resolve({ id: o.id, order_no: o.order_no, total_ex_vat: o.total_ex_vat, total_inc_vat: o.total_inc_vat, unpriced_lines: o.unpriced_lines });
      },
      myOrders: function (id) { db = load(); return resolve(db.orders.filter(function (o) { return o.user_id === id; })); },
      listProfiles: function () { db = load(); needAdmin(); return resolve(Object.keys(db.profiles).map(function (k) { return db.profiles[k]; }).sort(function (a, b) { return b.created_at < a.created_at ? -1 : 1; })); },
      setProfileStatus: function (id, status) { db = load(); needAdmin(); db.profiles[id].status = status; save(); return resolve(true); },
      setProfileLang: function (id, lang) { db = load(); needAdmin(); db.profiles[id].lang = lang; save(); return resolve(true); },
      notifyApproved: function () { return resolve({ demo: true }); },
      listOrders: function () { db = load(); needAdmin(); return resolve(db.orders); },
      setOrderStatus: function (id, status) { db = load(); needAdmin(); db.orders.forEach(function (o) { if (o.id === id) o.status = status; }); save(); return resolve(true); },
      replacePrices: function (rows) { db = load(); needAdmin(); db.price_rows = rows.map(function (r) { return { price_group: r.price_group, head_size: r.head_size || 'standard', length_cm: +r.length_cm, tier_qty: +r.tier_qty, price_ex_vat: +r.price_ex_vat, price_inc_vat: +r.price_inc_vat }; }); save(); return resolve(rows.length); },
      replaceVarietyGroups: function (rows) { db = load(); needAdmin(); db.groups = {}; rows.forEach(function (r) { db.groups[r.variety] = r.price_group; }); save(); return resolve(rows.length); },
      saveSetting: function (k, v) { db = load(); needAdmin(); db.settings[k] = String(v); save(); return resolve(true); },
      reset: function () { localStorage.removeItem(KEY); sessionStorage.removeItem(SKEY); db = seed(); }
    };
  }

  /* ------------------------------------------------------------------ session */
  var AB = {
    mode: MODE, lang: function () { return lang; }, langs: LANGS, groups: GROUPS, heads: HEADS,
    t: t, esc: esc, addStrings: addStrings, applyI18n: applyI18n, setLang: setLang,
    onLang: function (cb) { langCbs.push(cb); },
    fmt: fmt, fmtInt: fmtInt, fmtDate: fmtDate, round2: round2,
    varieties: VARIETIES, catLabel: function (c) { return CAT_LABELS[lang][c] || c; }, catLabels: function () { return CAT_LABELS[lang]; },
    colourLabel: function (i) { return i >= 0 ? COLOR_LABELS[lang][i] : ''; }, colourLabels: function () { return COLOR_LABELS[lang]; },
    buildCatalog: buildCatalog, priceFor: priceFor, groupInfo: groupInfo, lengthsFor: lengthsFor, headsFor: headsFor, calcCart: calcCart,
    cart: cart, parseCSV: parseCSV, toCSV: toCSV, notify: notify,
    backend: null, user: null, profile: null, active: ''
  };
  window.AB = AB;

  AB.init = function () {
    if (MODE === 'off') return Promise.resolve(AB);
    AB.backend = MODE === 'supabase' ? SupabaseBackend() : MockBackend();
    return AB.backend.init().then(function () { return AB.refresh(); }).then(function () { return AB; });
  };
  AB.refresh = function () {
    return AB.backend.user().then(function (u) {
      AB.user = u;
      if (!u) { AB.profile = null; return null; }
      return AB.backend.profile(u.id).then(function (p) { AB.profile = p; });
    }).then(function () { renderShell(); });
  };
  AB.logout = function () {
    return AB.backend.signOut().then(function () { AB.user = null; AB.profile = null; location.href = 'login.html'; });
  };
  AB.resetDemo = function () { if (AB.backend && AB.backend.reset) AB.backend.reset(); };

  /* ------------------------------------------------------------------ shell (header + footer) */
  function renderShell() {
    var h = document.getElementById('sh-header'), f = document.getElementById('sh-footer');
    if (!h || !f) return;
    var nav = [
      ['index.html', 'c_home'], ['about.html', 'c_about'], ['collection.html', 'c_collection'],
      ['ordering.html', 'c_order'], ['faq.html', 'c_faq'], ['contact.html', 'c_contact'], ['shop.html', 'c_shop']
    ];
    var right = '';
    if (AB.user) {
      right += '<span class="sh-user">' + esc(AB.profile && AB.profile.company && AB.profile.company !== '-' ? AB.profile.company : AB.user.email) + '</span>';
      if (AB.profile && AB.profile.is_admin) right += '<a href="admin.html">' + esc(t('c_admin')) + '</a>';
      right += '<button class="linkbtn" id="sh-logout" type="button">' + esc(t('c_logout')) + '</button>';
    } else if (MODE !== 'off') {
      right += '<a href="login.html">' + esc(t('c_login')) + '</a>';
    }
    var demo = MODE === 'demo' ? '<div class="sh-demo">' + t('c_demo') + '</div>' : '';
    h.innerHTML = demo +
      '<div class="sh-header">' +
      '<a class="sh-brand" href="index.html"><img src="logo-header.png" alt=""><span>AFRICANE BLOOM</span></a>' +
      '<nav class="sh-nav">' + nav.map(function (n) {
        return '<a href="' + n[0] + '"' + (n[0] === AB.active ? ' class="on"' : '') + '>' + esc(t(n[1])) + '</a>';
      }).join('') + '</nav>' +
      '<div class="sh-right">' + right +
      '<span class="sh-lang">' + LANGS.map(function (l) {
        return '<button type="button" data-l="' + l + '"' + (l === lang ? ' class="on"' : '') + '>' + l.toUpperCase() + '</button>';
      }).join('') + '</span></div></div>';
    f.innerHTML =
      '<div class="sh-footer"><span>&copy; 2026 Africane Bloom &middot; Cabrera Group AB</span>' +
      '<span class="links"><a href="' + PDF[lang] + '" target="_blank" rel="noopener">' + esc(t('c_complaints')) + '</a>' +
      '<a href="privacy.html">' + esc(t('c_privacy')) + '</a>' +
      '<a href="login.html">' + esc(t('c_customer')) + '</a><span>info@africane.se</span></span></div>';
    h.querySelectorAll('.sh-lang button').forEach(function (b) { b.addEventListener('click', function () { setLang(b.getAttribute('data-l')); }); });
    var lo = document.getElementById('sh-logout');
    if (lo) lo.addEventListener('click', AB.logout);
  }
  AB.renderShell = function (active) { if (active !== undefined) AB.active = active; renderShell(); applyI18n(document); };

  document.documentElement.lang = lang;
})();
