import {defineField, defineType} from 'sanity'

/**
 * Eén enkel document met de losse teksten en regels van de site.
 * Zo kan KORST het telefoonnummer of het besteluur wijzigen
 * zonder dat er code aangepast moet worden.
 */
export const instellingen = defineType({
  name: 'instellingen',
  title: 'Instellingen',
  type: 'document',
  groups: [
    {name: 'contact', title: 'Contact', default: true},
    {name: 'bestellen', title: 'Bestelregels'},
  ],
  fields: [
    defineField({
      name: 'telefoon',
      title: 'Telefoonnummer',
      type: 'string',
      group: 'contact',
      description: 'Zoals het op de site staat, bv. +32 495 00 00 00.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'email',
      title: 'E-mailadres voor bestellingen',
      type: 'string',
      group: 'contact',
      description: 'Hier komen de bestelbonnen binnen.',
      validation: (Rule) => Rule.required().email(),
    }),
    defineField({
      name: 'adres',
      title: 'Adres of locatie',
      type: 'string',
      group: 'contact',
      initialValue: 'Bedrijvenpark De Prijkels',
    }),
    defineField({
      name: 'leveringsregio',
      title: 'Leveringsregio',
      type: 'string',
      group: 'bestellen',
      description: 'Verschijnt bij het leveradres in de bestelbon.',
      initialValue: 'regio Gent',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'minimumPersonen',
      title: 'Minimum aantal personen',
      type: 'number',
      group: 'bestellen',
      initialValue: 10,
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'besteldeadlineUur',
      title: 'Besteluur',
      type: 'number',
      group: 'bestellen',
      description:
        'Vóór dit uur besteld = levering de volgende dag. Erna wordt het de dag daarop. Nu 12 (middag).',
      initialValue: 12,
      validation: (Rule) => Rule.required().min(0).max(23),
    }),
    defineField({
      name: 'bevestigingstekst',
      title: 'Tekst na het versturen',
      type: 'text',
      rows: 3,
      group: 'bestellen',
      description: 'Wat de klant leest zodra de bestelbon verstuurd is.',
      initialValue:
        'We reageren binnen de 24 uur, altijd met een korstje af. Vragen in tussentijd? Bel ons gerust.',
    }),
  ],
  preview: {
    prepare: () => ({title: 'Instellingen', subtitle: 'Contactgegevens en bestelregels'}),
  },
})
