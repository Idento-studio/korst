# KORST Studio — productbeheer

De beheeromgeving waarin KORST haar broodjes en boxen onderhoudt. Wat hier gepubliceerd
wordt, verschijnt op de homepage en in de bestelbon.

Alles wat zonder account kan, is al gebouwd: het schema, de indeling van de zijbalk,
de KORST-kleuren en het logo. Hieronder staat wat jij nog moet doen.

---

## Wat je eenmalig doet

### 1. Sanity-account en project

```bash
cd korst-studio
npm install
npx sanity login          # account maken of inloggen (GitHub of Google kan)
npx sanity init --env     # kies: nieuw project, naam KORST, dataset production
```

`--env` schrijft je project-id meteen weg in een `.env`-bestand. Kreeg je die niet,
kopieer dan `.env.example` naar `.env` en vul je project-id zelf in. Je vindt die
terug op [sanity.io/manage](https://sanity.io/manage).

> Kiest de installatie een eigen schema of template? Antwoord **nee** op "add a
> sample dataset" en laat de bestaande bestanden staan — die zijn van ons.

### 2. Lokaal bekijken

```bash
npm run dev               # draait op http://localhost:3333
```

Je zou meteen de zijbalk moeten zien met Ontbijt, Lunch, Apero, Op de homepage,
Niet op de site, Alles samen en Instellingen.

### 3. Startproducten invullen

Zodat je klant niet in een leeg scherm begint, staan de vijf producten uit het ontwerp
klaar om geïmporteerd te worden, foto's inbegrepen.

Maak eerst een token op [sanity.io/manage](https://sanity.io/manage) → je project →
**API** → **Tokens** → *Add API token*, met rechten **Editor**. Zet die in `.env`
achter `SANITY_WRITE_TOKEN=`. Daarna:

```bash
npm run seed
```

Het token hoort enkel in `.env`, en die staat in `.gitignore`. Nooit in git zetten.

### 4. Online zetten

```bash
npx sanity deploy         # kies een hostnaam, bv. korst
```

De Studio staat dan op `https://korst.sanity.studio`. Gratis, en ze werkt zichzelf bij
naar de laatste Sanity-versie zonder dat jij opnieuw moet deployen.

**Liever onder je eigen domein?** Dan bouw je de Studio zelf en zet je de map `dist/`
mee op Cloudflare Pages. Voeg in dat geval `basePath: '/studio'` toe aan
`sanity.config.ts` en bouw met `npm run build`. Voor de eerste versie raad ik de
eenvoudige weg hierboven aan — dat scheelt een tweede deploy-stroom.

### 5. Je klant toegang geven

Op [sanity.io/manage](https://sanity.io/manage) → je project → **Members** →
*Invite members*. Kies de rol **Editor**: dan kan ze alles bewerken en publiceren,
maar niets aan het schema of de facturatie wijzigen.

Op het gratis plan zitten tot 20 gebruikers inbegrepen.

---

## Wat je klant te zien krijgt

De zijbalk is opgesplitst per categorie, zodat er nooit gefilterd of gezocht moet worden.
De plusknop binnen een categorie maakt meteen een product in die categorie aan.

| Onderdeel | Waarvoor |
|---|---|
| **Ontbijt / Lunch / Apero** | De producten per moment, in de volgorde waarin ze op de site staan |
| **Op de homepage** | De producten met *Tonen op de homepage* aan — bij voorkeur drie, één per categorie |
| **Niet op de site** | Alles wat tijdelijk uitgeschakeld staat. Handig voor seizoensbroodjes |
| **Alles samen** | Het volledige overzicht |
| **Instellingen** | Telefoonnummer, e-mail, leveringsregio, minimum personen en het besteluur |

Een product verdwijnt van de site door **Staat op de site** uit te zetten, niet door het
te verwijderen. Zo komt het volgend seizoen terug zonder opnieuw ingeven.

Wijzigingen gaan pas naar buiten na op **Publish** te klikken. Tot dan is het een klad
dat enkel in de Studio zichtbaar is.

---

## Hoe de site de producten ophaalt

Voor de volgende fase — dit hoort in de website-repo, niet hier. De query haalt enkel
actieve producten op, in de juiste volgorde, met een foto-URL die Sanity automatisch
verkleint.

```js
const PROJECT_ID = '<jouw project-id>'
const QUERY = `*[_type == "product" && actief == true] | order(categorie asc, volgorde asc, titel asc){
  "id": _id,
  titel,
  categorie,
  beschrijving,
  prijs,
  eenheid,
  allergenen,
  uitgelicht,
  "foto": foto.asset->url,
  "alt": foto.alt
}`

const url = `https://${PROJECT_ID}.apicdn.sanity.io/v2026-01-01/data/query/production?query=${encodeURIComponent(QUERY)}`
const {result} = await fetch(url).then((r) => r.json())
```

Achter een foto-URL plak je `?w=800&auto=format` en Sanity levert een verkleinde webp.
Het `apicdn`-adres is de gecachete variant: sneller, en hij telt mee in het ruime
gratis quotum.

---

## Bestanden

```
sanity.config.ts        Configuratie: schema, indeling, thema, logo
sanity.cli.ts           Project-id en dataset voor de opdrachtregel
schemaTypes/product.ts  Het productschema — hier voeg je velden toe
schemaTypes/instellingen.ts   De losse teksten en bestelregels
lib/structure.ts        Wat de klant in de zijbalk ziet
lib/korstTheme.ts       De merkkleuren in de Studio
lib/KorstLogo.tsx       Het woordmerk linksboven
scripts/seed.mjs        Eenmalige import van de startproducten
seed-fotos/             De foto's die daarbij horen
```

## Een veld toevoegen

Open `schemaTypes/product.ts`, kopieer een bestaand `defineField`-blok en pas het aan.
De Studio ververst zichzelf terwijl `npm run dev` draait. Vergeet niet het veld ook op
te nemen in de query hierboven, anders komt het niet op de site terecht.
