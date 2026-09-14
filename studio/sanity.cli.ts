import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID,
    dataset: process.env.SANITY_STUDIO_DATASET || 'production',
  },
  // Houdt de Studio automatisch bij op de laatste versie na het uitrollen,
  // zodat we niet voor elke Sanity-update opnieuw moeten deployen.
  deployment: {autoUpdates: true},
})
