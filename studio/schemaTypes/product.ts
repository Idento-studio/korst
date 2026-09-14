import {defineField, defineType} from 'sanity'

export const CATEGORIEEN = [
  {title: 'Ontbijt', value: 'ontbijt'},
  {title: 'Lunch', value: 'lunch'},
  {title: 'Apero', value: 'apero'},
] as const

export const product = defineType({
  name: 'product',
  title: 'Broodje of box',
  type: 'document',
  groups: [
    {name: 'inhoud', title: 'Inhoud', default: true},
    {name: 'prijs', title: 'Prijs'},
    {name: 'zichtbaarheid', title: 'Zichtbaarheid'},
  ],
  fields: [
    defineField({
      name: 'titel',
      title: 'Naam',
      type: 'string',
      group: 'inhoud',
      description: 'Zoals het op de site verschijnt, bv. "Bulgur Salade".',
      validation: (Rule) => Rule.required().max(60).warning('Houd de naam kort — lange namen breken af op de kaart.'),
    }),
    defineField({
      name: 'categorie',
      title: 'Categorie',
      type: 'string',
      group: 'inhoud',
      description: 'Bepaalt onder welke tab dit product in de bestelbon staat.',
      options: {list: [...CATEGORIEEN], layout: 'radio', direction: 'horizontal'},
      initialValue: 'lunch',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'beschrijving',
      title: 'Beschrijving',
      type: 'text',
      rows: 3,
      group: 'inhoud',
      description: 'Eén of twee zinnen: de ingrediënten of waarom het lekker is.',
      validation: (Rule) =>
        Rule.required().max(180).warning('Boven de 180 tekens wordt de tekst op de kaart erg lang.'),
    }),
    defineField({
      name: 'foto',
      title: 'Foto',
      type: 'image',
      group: 'inhoud',
      options: {hotspot: true},
      description:
        'Liefst liggend formaat. Met het hotspot-kader duid je aan wat altijd in beeld moet blijven als de foto wordt bijgesneden.',
      validation: (Rule) => Rule.required(),
      fields: [
        defineField({
          name: 'alt',
          title: 'Omschrijving van de foto',
          type: 'string',
          description: 'Voor slechtziende bezoekers en voor Google. Bv. "Belegde focaccia met mozzarella en tomaat".',
        }),
      ],
    }),
    defineField({
      name: 'allergenen',
      title: 'Allergenen',
      type: 'text',
      rows: 2,
      group: 'inhoud',
      description:
        'Verschijnt achter het i-icoontje in de bestelbon. Bv. "Bevat gluten en lactose." Laat leeg als je het niet zeker weet.',
    }),

    defineField({
      name: 'prijs',
      title: 'Prijs in euro',
      type: 'number',
      group: 'prijs',
      description: 'Enkel het getal, bv. 11.90. Gebruik een punt, geen komma.',
      validation: (Rule) =>
        Rule.required()
          .min(0)
          .max(500)
          .custom((value) =>
            typeof value === 'number' && value < 1
              ? 'Prijs onder € 1 — klopt dat wel? Controleer even voor je publiceert.'
              : true,
          )
          .warning(),
    }),
    defineField({
      name: 'eenheid',
      title: 'Prijs geldt',
      type: 'string',
      group: 'prijs',
      options: {
        list: [
          {title: 'per persoon', value: 'per persoon'},
          {title: 'per box', value: 'per box'},
          {title: 'per stuk', value: 'per stuk'},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'per persoon',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'actief',
      title: 'Staat op de site',
      type: 'boolean',
      group: 'zichtbaarheid',
      description:
        'Zet dit uit om een product tijdelijk van de site te halen. Beter dan verwijderen — zo staat het er volgend seizoen zo weer op.',
      initialValue: true,
    }),
    defineField({
      name: 'uitgelicht',
      title: 'Tonen op de homepage',
      type: 'boolean',
      group: 'zichtbaarheid',
      description: 'De homepage toont drie uitgelichte producten, bij voorkeur één per categorie.',
      initialValue: false,
    }),
    defineField({
      name: 'volgorde',
      title: 'Volgorde',
      type: 'number',
      group: 'zichtbaarheid',
      description: 'Lager getal staat vooraan binnen de categorie. Laat leeg en we sorteren op naam.',
    }),
  ],

  orderings: [
    {
      title: 'Categorie, dan volgorde',
      name: 'categorieVolgorde',
      by: [
        {field: 'categorie', direction: 'asc'},
        {field: 'volgorde', direction: 'asc'},
        {field: 'titel', direction: 'asc'},
      ],
    },
    {title: 'Naam A → Z', name: 'titelAsc', by: [{field: 'titel', direction: 'asc'}]},
    {title: 'Prijs laag → hoog', name: 'prijsAsc', by: [{field: 'prijs', direction: 'asc'}]},
  ],

  preview: {
    select: {title: 'titel', categorie: 'categorie', prijs: 'prijs', eenheid: 'eenheid', actief: 'actief', media: 'foto'},
    prepare({title, categorie, prijs, eenheid, actief, media}) {
      const label = CATEGORIEEN.find((c) => c.value === categorie)?.title ?? categorie
      const bedrag = typeof prijs === 'number' ? `€ ${prijs.toFixed(2).replace('.', ',')}` : 'geen prijs'
      return {
        title: actief ? title : `${title} — staat niet op de site`,
        subtitle: [label, `${bedrag} ${eenheid ?? ''}`.trim()].filter(Boolean).join(' · '),
        media,
      }
    },
  },
})
