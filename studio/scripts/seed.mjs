/**
 * Vult de Studio met de producten uit het ontwerp, foto's inbegrepen.
 * Bedoeld om één keer te draaien zodat je klant niet in een leeg scherm begint.
 *
 *   npm run seed
 *
 * Vereist SANITY_STUDIO_PROJECT_ID en SANITY_WRITE_TOKEN in .env
 * Opnieuw draaien is veilig: bestaande documenten worden overschreven,
 * er komen geen dubbels bij.
 */
import {createClient} from '@sanity/client'
import {readFileSync, existsSync} from 'node:fs'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'

const hier = dirname(fileURLToPath(import.meta.url))
const wortel = join(hier, '..')

// .env inlezen zonder extra pakket
const envPad = join(wortel, '.env')
if (existsSync(envPad)) {
  for (const regel of readFileSync(envPad, 'utf8').split('\n')) {
    const m = regel.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}

const projectId = process.env.SANITY_STUDIO_PROJECT_ID
const token = process.env.SANITY_WRITE_TOKEN
const dataset = process.env.SANITY_STUDIO_DATASET || 'production'

if (!projectId || !token) {
  console.error(
    '\n  Ontbrekende gegevens.\n' +
      '  Zet SANITY_STUDIO_PROJECT_ID en SANITY_WRITE_TOKEN in je .env\n' +
      '  Een token maak je op sanity.io/manage > API > Tokens (rechten: Editor).\n',
  )
  process.exit(1)
}

const client = createClient({projectId, dataset, token, apiVersion: '2026-01-01', useCdn: false})

const producten = [
  {
    id: 'product-morning-reset',
    titel: 'Morning Reset',
    categorie: 'ontbijt',
    beschrijving: 'Croissant, vers fruit, notenmix, yoghurt en fijne charcuterie. De zachte landing van elke vergadering om 8u.',
    prijs: 8.5,
    eenheid: 'per persoon',
    allergenen: 'Bevat gluten, lactose, noten en varkensvlees (ham, salami).',
    volgorde: 10,
    foto: 'ontbijt-morning-reset.jpg',
    alt: 'KORST ontbijtbox Morning Reset met croissant, fruit en beleg',
  },
  {
    id: 'product-bulgur-salade',
    titel: 'Bulgur Salade',
    categorie: 'lunch',
    beschrijving: 'Een frisse, volwaardige lunch boordevol granen, groenten en kruiden.',
    prijs: 11.9,
    eenheid: 'per persoon',
    allergenen: 'Bevat gluten (bulgur). Vegetarisch.',
    volgorde: 10,
    foto: 'lunch-bulgur-salade.jpg',
    alt: 'Salade met boerenkool, avocado en geroosterde kikkererwten',
  },
  {
    id: 'product-italian-pearl-salad',
    titel: 'Italian Pearl Salad',
    categorie: 'lunch',
    beschrijving: 'Parelcouscous, zongedroogde tomaat, mozzarella en basilicum.',
    prijs: 12.5,
    eenheid: 'per persoon',
    allergenen: 'Bevat gluten (couscous) en lactose (mozzarella).',
    volgorde: 20,
    foto: 'lunch-italian-pearl.jpg',
    alt: 'Belegde focaccia met mozzarella, tomaat en pesto',
  },
  {
    id: 'product-borrelplank-compleet',
    titel: 'Borrelplank Compleet',
    categorie: 'apero',
    beschrijving: 'Kaas, charcuterie, dips en krokante bites — gemaakt om te delen.',
    prijs: 9.9,
    eenheid: 'per persoon',
    allergenen: 'Bevat lactose, gluten en varkensvlees (charcuterie).',
    volgorde: 10,
    foto: 'apero-borrelplank.jpg',
    alt: 'Aperoplank met kaas, charcuterie, fruit en dips',
  },
  {
    id: 'product-cocktailhapjes',
    titel: 'Cocktailhapjes',
    categorie: 'apero',
    beschrijving: 'Een mix van warme en koude hapjes voor elke afterwork of receptie.',
    prijs: 2.6,
    eenheid: 'per stuk',
    allergenen: 'Kan sporen bevatten van gluten, ei, lactose en schaaldieren.',
    volgorde: 20,
    foto: 'apero-cocktailhapjes.jpg',
    alt: 'Vers gebakken focaccia in stukken',
  },
]

async function uploadFoto(bestandsnaam) {
  const pad = join(wortel, 'seed-fotos', bestandsnaam)
  if (!existsSync(pad)) {
    console.warn(`   foto niet gevonden, overgeslagen: ${bestandsnaam}`)
    return null
  }
  const asset = await client.assets.upload('image', readFileSync(pad), {filename: bestandsnaam})
  return asset._id
}

async function main() {
  console.log(`\n  Producten toevoegen aan project ${projectId} (${dataset})\n`)

  for (const p of producten) {
    const assetId = await uploadFoto(p.foto)
    const doc = {
      _id: p.id,
      _type: 'product',
      titel: p.titel,
      categorie: p.categorie,
      beschrijving: p.beschrijving,
      prijs: p.prijs,
      eenheid: p.eenheid,
      allergenen: p.allergenen,
      actief: true,
      volgorde: p.volgorde,
      ...(assetId
        ? {foto: {_type: 'image', alt: p.alt, asset: {_type: 'reference', _ref: assetId}}}
        : {}),
    }
    await client.createOrReplace(doc)
    console.log(`   toegevoegd: ${p.titel}`)
  }

  await client.createOrReplace({
    _id: 'instellingen',
    _type: 'instellingen',
    telefoon: '+32 495 00 00 00',
    email: 'hallo@korst.be',
    adres: 'Bedrijvenpark De Prijkels',
    leveringsregio: 'regio Gent',
    minimumPersonen: 10,
    besteldeadlineUur: 12,
    bevestigingstekst:
      'We reageren binnen de 24 uur, altijd met een korstje af. Vragen in tussentijd? Bel ons gerust.',
  })
  console.log('   toegevoegd: Instellingen')

  console.log('\n  Klaar. Open de Studio met: npm run dev\n')
}

main().catch((err) => {
  console.error('\n  Er liep iets mis:', err.message, '\n')
  process.exit(1)
})
