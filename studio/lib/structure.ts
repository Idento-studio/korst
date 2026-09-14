import type {StructureResolver} from 'sanity/structure'

/**
 * Wat de klant in de zijbalk ziet.
 * Bewust per categorie opgesplitst: zo hoeft ze nooit te filteren of te zoeken,
 * en maakt de plusknop meteen een product in de juiste categorie aan.
 */
export const structure: StructureResolver = (S) => {
  const categorieLijst = (titel: string, waarde: string) =>
    S.listItem()
      .title(titel)
      .id(waarde)
      .child(
        S.documentList()
          .title(titel)
          .schemaType('product')
          .filter('_type == "product" && categorie == $categorie')
          .params({categorie: waarde})
          .defaultOrdering([
            {field: 'volgorde', direction: 'asc'},
            {field: 'titel', direction: 'asc'},
          ])
          .initialValueTemplates([S.initialValueTemplateItem(`product-${waarde}`)]),
      )

  return S.list()
    .title('KORST')
    .items([
      categorieLijst('Ontbijt', 'ontbijt'),
      categorieLijst('Lunch', 'lunch'),
      categorieLijst('Apero', 'apero'),

      S.divider(),

      S.listItem()
        .title('Op de homepage')
        .id('uitgelicht')
        .child(
          S.documentList()
            .title('Uitgelicht op de homepage')
            .schemaType('product')
            .filter('_type == "product" && uitgelicht == true')
            .defaultOrdering([{field: 'categorie', direction: 'asc'}]),
        ),

      S.listItem()
        .title('Niet op de site')
        .id('inactief')
        .child(
          S.documentList()
            .title('Staat niet op de site')
            .schemaType('product')
            .filter('_type == "product" && actief != true')
            .defaultOrdering([{field: 'titel', direction: 'asc'}]),
        ),

      S.listItem()
        .title('Alles samen')
        .id('alles')
        .child(
          S.documentTypeList('product')
            .title('Alle producten')
            .defaultOrdering([
              {field: 'categorie', direction: 'asc'},
              {field: 'volgorde', direction: 'asc'},
            ]),
        ),

      S.divider(),

      S.listItem()
        .title('Instellingen')
        .id('instellingen')
        .child(S.document().schemaType('instellingen').documentId('instellingen').title('Instellingen')),
    ])
}
