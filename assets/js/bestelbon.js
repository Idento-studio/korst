/* ==========================================================================
   bestelbon.js — de bestelwizard op /bestellen/.
   De producten komen uit producten.js (en dus uit Sanity); deze module doet
   de stappen, de validatie, het overzicht en het versturen.

   ┌─ HIER STEL JE IN WAAR BESTELLINGEN NAARTOE GAAN ──────────────────────┐
   │ Zelfde afspraak als contact-form.js:                                  │
   │ ENDPOINT leeg laten  → de mailclient van de bezoeker opent met een    │
   │                        volledig ingevulde bestelbon. Werkt vandaag.   │
   │ ENDPOINT invullen    → de bestelling vertrekt op de achtergrond en    │
   │                        de bezoeker blijft op de pagina.               │
   │                                                                       │
   │ Let op bij Formspree: het gratis plan stopt bij 50 inzendingen per    │
   │ maand. Voor contactvragen volstaat dat, voor dagelijkse bestellingen  │
   │ waarschijnlijk niet — reken op het betaalde plan, of stuur naar een   │
   │ eigen webhook (n8n) die de mail verzorgt.                             │
   └──────────────────────────────────────────────────────────────────────┘
   ========================================================================== */
(function () {
  'use strict';

  var ENDPOINT = '';
  var MAIL_TO = 'hallo@korst.be';

  var wizard = document.getElementById('stappen');
  if (!wizard || !window.KORST) return;

  var K = window.KORST;
  var STAP_LABELS = ['Bestelling', 'Gegevens', 'Overzicht'];

  var producten = [];
  var aantallen = {};
  var huidigeStap = 1;
  var verstStap = 1;
  var actieveCat = null;

  /* ── Leverdatum: nooit vandaag, en enkel morgen als er vóór 12u besteld
        wordt. Daarna schuift de vroegste dag op naar overmorgen. ── */
  function isoDatum(d) {
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var dag = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + dag;
  }
  function vroegsteLeverdag() {
    var nu = new Date();
    var middag = new Date(nu);
    middag.setHours(12, 0, 0, 0);
    var dagenVooruit = nu < middag ? 1 : 2;
    var d = new Date(nu);
    d.setDate(d.getDate() + dagenVooruit);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  var minDatum = isoDatum(vroegsteLeverdag());

  function toonDatum(iso) {
    if (!iso) return '—';
    return new Date(iso + 'T00:00:00')
      .toLocaleDateString('nl-BE', { weekday: 'long', day: 'numeric', month: 'long' });
  }
  function bedrag(n) { return '€ ' + Number(n).toFixed(2).replace('.', ','); }
  function totaalAantal() {
    return producten.reduce(function (s, p) { return s + (aantallen[p.id] || 0); }, 0);
  }
  function totaalPrijs() {
    return producten.reduce(function (s, p) { return s + (aantallen[p.id] || 0) * p.prijs; }, 0);
  }
  function gekozen() {
    return producten.filter(function (p) { return (aantallen[p.id] || 0) > 0; });
  }
  function veld(id) { return (document.getElementById(id).value || '').trim(); }

  /* ── Stappenbalk ── */
  function tekenStappen() {
    wizard.innerHTML = STAP_LABELS.map(function (label, i) {
      var n = i + 1;
      var bereikbaar = n <= verstStap;
      var klasse = n === huidigeStap ? 'actief' : (n < huidigeStap ? 'gedaan' : '');
      var bol = n < huidigeStap ? '✓' : n;
      return '<button type="button" class="stap-knop ' + klasse + '" data-ga="' + n + '"' +
        (bereikbaar ? '' : ' disabled') +
        ' aria-label="Stap ' + n + ': ' + label + '">' +
        '<span class="bol">' + bol + '</span><span>' + label + '</span></button>';
    }).join('');
    [].forEach.call(wizard.querySelectorAll('[data-ga]'), function (b) {
      b.addEventListener('click', function () { naarStap(parseInt(b.getAttribute('data-ga'), 10)); });
    });
  }

  function naarStap(n) {
    [].forEach.call(document.querySelectorAll('.stap[data-stap]'), function (sec) {
      sec.hidden = parseInt(sec.getAttribute('data-stap'), 10) !== n;
    });
    document.getElementById('bevestiging').hidden = true;
    huidigeStap = n;
    if (n > verstStap) verstStap = n;
    if (n === 3) bouwOverzicht();
    tekenStappen();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ── Stap 1: categorieën en producten ── */
  function tekenCategorieen() {
    var aanwezig = K.categorieen.filter(function (c) {
      return producten.some(function (p) { return p.categorie === c.waarde; });
    });
    if (!aanwezig.length) {
      document.getElementById('catPanelen').innerHTML =
        '<p class="laden">Er staat momenteel geen aanbod online. Bel ons gerust op +32 495 00 00 00.</p>';
      return;
    }
    if (!actieveCat) actieveCat = aanwezig[0].waarde;

    document.getElementById('catTabs').innerHTML = aanwezig.map(function (c) {
      return '<button type="button" class="cat-tab" role="tab" data-cat="' + c.waarde + '"' +
        ' aria-selected="' + (c.waarde === actieveCat) + '">' + c.label + '</button>';
    }).join('');

    document.getElementById('catPanelen').innerHTML = aanwezig.map(function (c) {
      var items = producten.filter(function (p) { return p.categorie === c.waarde; });
      return '<div class="cat-paneel" data-cat="' + c.waarde + '"' +
        (c.waarde === actieveCat ? '' : ' hidden') + '>' +
        '<div class="product-grid">' + items.map(kaart).join('') + '</div></div>';
    }).join('');

    [].forEach.call(document.querySelectorAll('.cat-tab'), function (b) {
      b.addEventListener('click', function () {
        actieveCat = b.getAttribute('data-cat');
        [].forEach.call(document.querySelectorAll('.cat-tab'), function (t) {
          t.setAttribute('aria-selected', String(t.getAttribute('data-cat') === actieveCat));
        });
        [].forEach.call(document.querySelectorAll('.cat-paneel'), function (pnl) {
          pnl.hidden = pnl.getAttribute('data-cat') !== actieveCat;
        });
        werkKnopBij();
      });
    });
    [].forEach.call(document.querySelectorAll('[data-tel]'), function (b) {
      b.addEventListener('click', tellerKlik);
    });
    ververs();
  }

  function kaart(p, i) {
    var allergenen = p.allergenen || 'Allergeneninfo op aanvraag — bel ons gerust.';
    return '' +
      '<article class="product' + (i % 2 === 1 ? ' alt' : '') + '">' +
        (p.foto ? '<div class="product-foto"><img src="' + K.fotoUrl(p.foto, 600) + '" alt="' +
          K.tekst(p.alt || p.titel) + '" loading="lazy"></div>' : '') +
        '<div class="product-body">' +
          '<div class="titel-rij">' +
            '<h3>' + K.tekst(p.titel) + '</h3>' +
            '<button type="button" class="info" data-tip="' + K.tekst(allergenen) +
              '" aria-label="Allergenen: ' + K.tekst(allergenen) + '">i</button>' +
          '</div>' +
          '<p>' + K.tekst(p.beschrijving) + '</p>' +
          '<p class="prijs">' + bedrag(p.prijs) + ' ' + K.tekst(p.eenheid || 'per persoon') + '</p>' +
          '<div class="teller">' +
            '<button type="button" data-tel="min" data-id="' + p.id + '" aria-label="Eén minder">−</button>' +
            '<span class="aantal" data-aantal="' + p.id + '">0</span>' +
            '<button type="button" data-tel="plus" data-id="' + p.id + '" aria-label="Eén meer">+</button>' +
          '</div>' +
        '</div>' +
      '</article>';
  }

  function tellerKlik(e) {
    var b = e.currentTarget;
    var id = b.getAttribute('data-id');
    aantallen[id] = Math.max(0, (aantallen[id] || 0) + (b.getAttribute('data-tel') === 'plus' ? 1 : -1));
    ververs();
  }

  function ververs() {
    producten.forEach(function (p) {
      var el = document.querySelector('[data-aantal="' + p.id + '"]');
      if (el) el.textContent = aantallen[p.id] || 0;
      var min = document.querySelector('[data-tel="min"][data-id="' + p.id + '"]');
      if (min) min.disabled = !(aantallen[p.id] > 0);
    });
    tekenBon();
  }

  function tekenBon() {
    var regels = document.getElementById('bonRegels');
    var lijst = gekozen();
    regels.innerHTML = lijst.length
      ? lijst.map(function (p) {
          return '<p class="bon-regel"><span class="naam">' + aantallen[p.id] + '× ' +
            K.tekst(p.titel) + '</span><span class="bedrag">' + bedrag(aantallen[p.id] * p.prijs) + '</span></p>';
        }).join('')
      : '<p class="bon-leeg">— nog niets gekozen —</p>';
    document.getElementById('bonTotaal').textContent = bedrag(totaalPrijs());
  }

  function werkKnopBij() {
    var cat = K.categorieen.filter(function (c) { return c.waarde === actieveCat; })[0];
    document.getElementById('vulAan').textContent =
      'Vul ' + (cat ? cat.label.toLowerCase() : '') + 'boxen automatisch aan volgens aantal medewerkers';
  }

  document.getElementById('vulAan').addEventListener('click', function () {
    var personen = parseInt(document.getElementById('personen').value, 10) || 0;
    var items = producten.filter(function (p) { return p.categorie === actieveCat; });
    if (personen <= 0 || !items.length) return;
    var per = Math.floor(personen / items.length);
    var rest = personen % items.length;
    items.forEach(function (p, i) { aantallen[p.id] = per + (i < rest ? 1 : 0); });
    ververs();
  });

  /* ── Validatie ── */
  function markeer(id, fout) {
    var el = document.getElementById(id);
    if (el) el.classList.toggle('has-error', fout);
  }

  var waarschuwing = document.createElement('p');
  waarschuwing.className = 'field-error';
  waarschuwing.style.display = 'block';

  document.getElementById('naarStap2').addEventListener('click', function () {
    if (totaalAantal() === 0) {
      waarschuwing.textContent = 'Kies minstens één box voor je verdergaat.';
      document.getElementById('catPanelen').appendChild(waarschuwing);
      return;
    }
    waarschuwing.remove();
    naarStap(2);
  });

  document.getElementById('naarStap3').addEventListener('click', function () {
    var ok = true;
    var naam = veld('naam'), bedrijf = veld('bedrijf'), email = veld('email'), adres = veld('adres');
    var datum = document.getElementById('datum').value;

    markeer('f-naam', !naam); if (!naam) ok = false;
    markeer('f-bedrijf', !bedrijf); if (!bedrijf) ok = false;
    var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    markeer('f-email', !emailOk); if (!emailOk) ok = false;
    markeer('f-adres', !adres); if (!adres) ok = false;

    var datumOk = !!datum && datum >= minDatum;
    var foutmelding = document.getElementById('datumFout');
    if (!datum) foutmelding.textContent = 'Kies een leverdatum.';
    else if (datum < minDatum) {
      foutmelding.textContent = 'Ten vroegste leverbaar op ' + toonDatum(minDatum) +
        ' — bel ons voor een last-minute bestelling.';
    }
    markeer('f-datum', !datumOk); if (!datumOk) ok = false;

    if (ok) naarStap(3);
  });

  [].forEach.call(document.querySelectorAll('[data-terug]'), function (b) {
    b.addEventListener('click', function () { naarStap(parseInt(b.getAttribute('data-terug'), 10)); });
  });

  /* ── Stap 3: overzicht ── */
  function bouwOverzicht() {
    var lijst = gekozen();
    var g = function (id) { return veld(id) || '—'; };

    var bestelling =
      '<div class="overzicht-blok">' +
        '<div class="overzicht-kop"><h3>Bestelling — ' + totaalAantal() + ' box(en)</h3>' +
        '<button type="button" class="bewerk" data-spring="1">bewerken</button></div>' +
        (lijst.length
          ? lijst.map(function (p) {
              return '<p class="overzicht-regel"><span>' + K.tekst(p.titel) + '</span>' +
                '<span class="n">' + aantallen[p.id] + '× ' + bedrag(p.prijs) + '</span></p>';
            }).join('')
          : '<p class="bon-leeg">Nog niets gekozen.</p>') +
        '<p class="overzicht-regel" style="border-top:1px dashed var(--border);margin-top:8px;padding-top:8px">' +
          '<strong>Richttotaal</strong><strong class="n">' + bedrag(totaalPrijs()) + '</strong></p>' +
      '</div>';

    var gegevens =
      '<div class="overzicht-blok">' +
        '<div class="overzicht-kop"><h3>Gegevens &amp; levering</h3>' +
        '<button type="button" class="bewerk" data-spring="2">bewerken</button></div>' +
        '<dl>' +
          '<dt>Contactpersoon</dt><dd>' + K.tekst(g('naam')) + ' · ' + K.tekst(g('bedrijf')) + '</dd>' +
          '<dt>Contact</dt><dd>' + K.tekst(g('email')) +
            (veld('telefoon') ? ' · ' + K.tekst(g('telefoon')) : '') + '</dd>' +
          '<dt>Leveradres</dt><dd>' + K.tekst(g('adres')) + '</dd>' +
          '<dt>Wanneer</dt><dd>' + toonDatum(document.getElementById('datum').value) +
            ' om ' + K.tekst(g('tijd')) + '</dd>' +
          (veld('bericht') ? '<dt>Bericht</dt><dd>' + K.tekst(g('bericht')) + '</dd>' : '') +
        '</dl>' +
      '</div>';

    var doel = document.getElementById('overzicht');
    doel.innerHTML = bestelling + gegevens;
    [].forEach.call(doel.querySelectorAll('[data-spring]'), function (b) {
      b.addEventListener('click', function () { naarStap(parseInt(b.getAttribute('data-spring'), 10)); });
    });
  }

  /* ── Versturen ── */
  function bestelRegels() {
    return gekozen().map(function (p) {
      return '- ' + aantallen[p.id] + '× ' + p.titel + ' (' + bedrag(p.prijs) + ' ' +
        (p.eenheid || 'per persoon') + ')';
    }).join('\n');
  }

  function bestelTekst(ref) {
    return [
      'Nieuwe bestelaanvraag via korst.be',
      'Referentie: ' + ref,
      '',
      'BESTELLING (' + totaalAantal() + ' box(en))',
      bestelRegels(),
      'Richttotaal: ' + bedrag(totaalPrijs()),
      '',
      'GEGEVENS',
      'Contactpersoon: ' + veld('naam'),
      'Bedrijf: ' + veld('bedrijf'),
      'E-mail: ' + veld('email'),
      'Telefoon: ' + (veld('telefoon') || '—'),
      'Aantal medewerkers: ' + (veld('personen') || '—'),
      '',
      'LEVERING',
      'Adres: ' + veld('adres'),
      'Datum: ' + toonDatum(document.getElementById('datum').value) + ' om ' + veld('tijd'),
      '',
      'BERICHT',
      veld('bericht') || '—'
    ].join('\n');
  }

  function toonBevestiging(ref) {
    document.getElementById('referentie').textContent = ref;
    [].forEach.call(document.querySelectorAll('.stap[data-stap]'), function (s) { s.hidden = true; });
    document.getElementById('bevestiging').hidden = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  document.getElementById('verstuur').addEventListener('click', function () {
    var knop = this;
    var ref = 'KRS-' + isoDatum(new Date()).replace(/-/g, '') + '-' +
      Math.floor(100 + Math.random() * 900);
    var tekst = bestelTekst(ref);

    if (!ENDPOINT) {
      // Geen endpoint ingesteld: de mailclient van de bezoeker opent met een
      // volledig ingevulde bestelbon. Werkt zonder account of server.
      window.location.href = 'mailto:' + MAIL_TO +
        '?subject=' + encodeURIComponent('Bestelling ' + ref + ' — ' + (veld('bedrijf') || veld('naam'))) +
        '&body=' + encodeURIComponent(tekst);
      toonBevestiging(ref);
      return;
    }

    knop.disabled = true;
    knop.textContent = 'Versturen…';
    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        referentie: ref,
        bedrijf: veld('bedrijf'),
        naam: veld('naam'),
        email: veld('email'),
        telefoon: veld('telefoon'),
        leveradres: veld('adres'),
        leverdatum: document.getElementById('datum').value,
        leveruur: veld('tijd'),
        medewerkers: veld('personen'),
        bericht: veld('bericht'),
        bestelling: bestelRegels(),
        richttotaal: bedrag(totaalPrijs())
      })
    })
      .then(function (r) {
        if (!r.ok) throw new Error('status ' + r.status);
        toonBevestiging(ref);
      })
      .catch(function () {
        knop.disabled = false;
        knop.textContent = 'Verstuur je aanvraag';
        waarschuwing.textContent = 'Versturen lukte niet. Probeer opnieuw, of mail je bestelling naar ' + MAIL_TO + '.';
        document.getElementById('overzicht').appendChild(waarschuwing);
      });
  });

  /* ── Opstarten ── */
  var datumVeld = document.getElementById('datum');
  datumVeld.min = minDatum;
  datumVeld.value = minDatum;
  document.getElementById('datumHint').innerHTML =
    'Vroegst mogelijke leverdatum: <strong>' + toonDatum(minDatum) + '</strong>.';

  tekenStappen();
  tekenBon();

  K.producten.then(function (lijst) {
    producten = lijst;
    producten.forEach(function (p) { aantallen[p.id] = 0; });
    tekenCategorieen();
    werkKnopBij();
  });
})();
