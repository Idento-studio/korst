/* ==========================================================================
   producten.js — haalt het aanbod op bij Sanity en zet het klaar voor de
   rest van de site. Zowel de homepage als de bestelbon gebruiken dit.

   ┌─ WAAR DE PRODUCTEN VANDAAN KOMEN ─────────────────────────────────────┐
   │ KORST beheert de broodjes in de Studio. Wat daar gepubliceerd wordt,  │
   │ staat binnen de seconde op de site: er zit geen bouwstap tussen.      │
   │ Wijzigt het project-id ooit, dan pas je enkel PROJECT_ID hieronder    │
   │ aan — en in studio/.env staat dezelfde waarde.                        │
   └──────────────────────────────────────────────────────────────────────┘

   Valt Sanity weg, of is de dataset nog leeg, dan toont de site data/
   producten.json: de laatst bekende lijst die mee in de repo zit. Zo staat
   er nooit een lege pagina, ook niet op de dag dat er iets misloopt.
   ========================================================================== */
(function () {
  'use strict';

  var PROJECT_ID = '7x379x0b';
  var DATASET = 'production';
  var API_VERSIE = '2026-01-01';

  // Enkel wat de site nodig heeft, in de volgorde waarin het getoond wordt.
  var QUERY = [
    '*[_type == "product" && actief == true]',
    '| order(categorie asc, volgorde asc, titel asc){',
    '"id": _id, titel, categorie, beschrijving, prijs, eenheid,',
    'allergenen, uitgelicht, "foto": foto.asset->url, "alt": foto.alt',
    '}'
  ].join(' ');

  // De site kan onder een submap draaien (github.io/korst/). Het pad van dit
  // script zelf is de betrouwbaarste manier om de siteroot te vinden.
  var basis = (function () {
    var s = document.currentScript;
    if (s && s.src) return s.src.replace(/assets\/js\/producten\.js.*$/, '');
    return '/';
  })();

  var CATEGORIEEN = [
    { waarde: 'ontbijt', label: 'Ontbijt' },
    { waarde: 'lunch', label: 'Lunch' },
    { waarde: 'apero', label: 'Apero' }
  ];

  function sanityUrl() {
    return 'https://' + PROJECT_ID + '.apicdn.sanity.io/v' + API_VERSIE +
      '/data/query/' + DATASET + '?query=' + encodeURIComponent(QUERY);
  }

  /* Sanity levert één grote afbeelding; deze parameters vragen een verkleinde
     versie in het formaat dat de browser het liefst heeft (meestal webp). */
  function fotoUrl(url, breedte) {
    if (!url) return '';
    if (url.indexOf('cdn.sanity.io') === -1) return basis + url.replace(/^\//, '');
    return url + '?w=' + breedte + '&fit=crop&auto=format';
  }

  function reserve() {
    return fetch(basis + 'data/producten.json', { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (d) { return (d && d.producten) || []; })
      .catch(function () { return []; });
  }

  function laad() {
    return fetch(sanityUrl(), { cache: 'no-cache' })
      .then(function (r) {
        if (!r.ok) throw new Error('Sanity antwoordde ' + r.status);
        return r.json();
      })
      .then(function (d) {
        var lijst = (d && d.result) || [];
        // Een lege dataset is geen fout, maar we tonen dan wél de reservelijst:
        // een bezoeker hoort nooit een leeg aanbod te zien.
        return lijst.length ? lijst : reserve();
      })
      .catch(function (err) {
        if (window.console) console.warn('[KORST] aanbod uit reservelijst:', err.message);
        return reserve();
      });
  }

  function prijsTekst(p) {
    var bedrag = '€ ' + Number(p.prijs).toFixed(2).replace('.', ',');
    return { bedrag: bedrag, eenheid: p.eenheid || 'per persoon' };
  }

  /* — Homepage: de uitgelichte boxen —
     De drie kaarten staan al in de HTML, zodat de pagina ook zonder JS en
     zonder Sanity klopt. Zijn er uitgelichte producten, dan vervangen we ze. */
  function vulHomepage(producten) {
    var grid = document.querySelector('[data-boxen]');
    if (!grid) return;
    var uitgelicht = producten.filter(function (p) { return p.uitgelicht; }).slice(0, 3);
    if (!uitgelicht.length) return;

    grid.innerHTML = uitgelicht.map(function (p, i) {
      var prijs = prijsTekst(p);
      var cat = CATEGORIEEN.filter(function (c) { return c.waarde === p.categorie; })[0];
      var stempel = cat
        ? basis + 'assets/img/merk/stempel-' + (i === 1 ? cat.waarde + '-licht' : cat.waarde) + '.svg'
        : '';
      var feature = i === 1 ? ' box-card-feature' : '';
      var knop = i === 1 ? ' btn-scallop-flour' : '';
      return '' +
        '<article class="box-card' + feature + '">' +
          (stempel ? '<img class="box-card-stamp" src="' + stempel + '" alt="" width="104" height="104" loading="lazy">' : '') +
          '<div class="box-card-photo">' +
            '<img src="' + fotoUrl(p.foto, 760) + '" alt="' + tekst(p.alt || p.titel) + '" width="760" height="475" loading="lazy">' +
          '</div>' +
          '<div class="box-card-body">' +
            '<h3>' + tekst(p.titel) + '</h3>' +
            '<p>' + tekst(p.beschrijving) + '</p>' +
            '<p class="prijs">vanaf ' + prijs.bedrag + ' <small>' + tekst(prijs.eenheid) + '</small></p>' +
            '<p><a href="' + basis + 'bestellen/" class="btn btn-primary btn-scallop btn-scallop-sm' + knop + '">Kies ' + tekst(cat ? cat.label.toLowerCase() : 'deze box') + '</a></p>' +
          '</div>' +
        '</article>';
    }).join('');
  }

  function tekst(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Beschikbaar maken voor bestelbon.js, dat op hetzelfde antwoord wacht.
  window.KORST = window.KORST || {};
  window.KORST.basis = basis;
  window.KORST.categorieen = CATEGORIEEN;
  window.KORST.fotoUrl = fotoUrl;
  window.KORST.prijsTekst = prijsTekst;
  window.KORST.tekst = tekst;
  window.KORST.producten = laad();

  window.KORST.producten.then(vulHomepage);
})();
