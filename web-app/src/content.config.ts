import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const chaptersCollection = defineCollection({
  loader: glob({ pattern: '**/[^._]*.{md,mdx}', base: './src/content/chapters' }),
  schema: z.preprocess((val: any) => {
    if (val) {
      if (!val.title && val.chapter_title) val.title = val.chapter_title;
      if (val.chapterNumber === undefined && val.chapter_number !== undefined) {
        val.chapterNumber = Number(val.chapter_number);
      }
      if (!val.releaseDate && val.date_in_world) val.releaseDate = val.date_in_world;
      if (!val.description && val.outcome) val.description = val.outcome;
    }
    return val;
  }, z.object({
    title: z.string(),
    chapterNumber: z.number().optional(),
    releaseDate: z.string().optional(),
    scenario: z.string(),
    description: z.string().optional(),
  })),
});

const almanacCollection = defineCollection({
  loader: glob({ pattern: '**/[^._]*.{md,mdx}', base: './src/content/almanac' }),
  schema: z.preprocess((val: any) => {
    if (val && !val.category) {
      const subtypeVal = val.subtype || '';
      const typeVal = val.type || '';
      const typeMap: Record<string, string> = {
        'character': 'Characters',
        'faction': 'Factions',
        'location': 'Locations',
        'concept': 'Concepts',
        'item': 'Items',
        'timeline': 'Timeline',
        'base': 'Base'
      };
      val.category = typeMap[subtypeVal.toLowerCase()] || typeMap[typeVal.toLowerCase()] || 'Other';
    }
    return val;
  }, z.object({
    title: z.string(),
    category: z.enum(['Characters', 'Factions', 'Locations', 'Concepts', 'Items', 'Base', 'Timeline', 'Other']),
    scenario: z.string(),
    tags: z.array(z.string()).optional(),
    aliases: z.array(z.string()).optional(),
    description: z.string().optional(),
  })),
});

export const collections = {
  chapters: chaptersCollection,
  almanac: almanacCollection,
};
