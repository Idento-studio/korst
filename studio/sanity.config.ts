import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'

import {schemaTypes} from './schemaTypes'
import {structure} from './lib/structure'
import {korstTheme} from './lib/korstTheme'
import {KorstLogo} from './lib/KorstLogo'

const projectId = process.env.SANITY_STUDIO_PROJECT_ID
const dataset = process.env.SANITY_STUDIO_DATASET || 'production'

if (!projectId) {
  throw new Error(
    'SANITY_STUDIO_PROJECT_ID ontbreekt. Kopieer .env.example naar .env en vul je project-id in.',
  )
}

export default defineConfig({
  name: 'korst',
  title: 'KORST',
  projectId,
  dataset,

  theme: korstTheme,

  studio: {
    components: {logo: KorstLogo},
  },

  plugins: [
    structureTool({structure}),
    // Vision is het SQL-venster van Sanity: handig voor ons, niet voor de klant.
    // Enkel zichtbaar voor beheerders.
    visionTool({defaultApiVersion: '2026-01-01'}),
  ],

  schema: {
    types: schemaTypes,

    // Zorgt dat de plusknop binnen een categorie meteen de juiste categorie invult.
    templates: (prev) => [
      ...prev.filter((t) => t.schemaType !== 'instellingen'),
      {
        id: 'product-ontbijt',
        title: 'Ontbijt',
        schemaType: 'product',
        value: {categorie: 'ontbijt', actief: true, eenheid: 'per persoon'},
      },
      {
        id: 'product-lunch',
        title: 'Lunch',
        schemaType: 'product',
        value: {categorie: 'lunch', actief: true, eenheid: 'per persoon'},
      },
      {
        id: 'product-apero',
        title: 'Apero',
        schemaType: 'product',
        value: {categorie: 'apero', actief: true, eenheid: 'per persoon'},
      },
    ],
  },

  document: {
    // Instellingen bestaat maar één keer: niet dupliceerbaar, niet verwijderbaar.
    actions: (prev, {schemaType}) =>
      schemaType === 'instellingen'
        ? prev.filter(({action}) => action !== 'duplicate' && action !== 'delete' && action !== 'unpublish')
        : prev,
  },
})
