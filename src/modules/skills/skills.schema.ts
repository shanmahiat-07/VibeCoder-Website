import { z } from 'zod';

export const skillSourceSchema = z.literal('selise-blocks');

export const skillDefinitionSchema = z
  .object({
    id: z.string().min(1, 'Skill id is required'),
    name: z.string().min(1, 'Skill name is required'),
    description: z.string().min(1, 'Skill description is required'),
    content: z.string().min(1, 'Skill content is required'),
    category: z.string().min(1).optional(),
    tags: z.array(z.string().min(1)).optional(),
    source: skillSourceSchema,
  })
  .strict();
