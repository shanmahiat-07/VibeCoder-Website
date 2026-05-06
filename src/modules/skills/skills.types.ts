export type SkillSource = 'selise-blocks';

export interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  content: string;
  category?: string;
  tags?: string[];
  source: SkillSource;
}

export interface SkillDocument {
  folderName: string;
  markdown: string;
  sourceUrl?: string;
  source?: SkillSource;
}
