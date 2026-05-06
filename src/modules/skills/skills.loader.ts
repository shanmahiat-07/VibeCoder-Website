import type { Skill } from './skills.types';
import { skills } from './skills.generated';

export interface SkillsSource {
  load: () => Promise<Skill[]>;
}

export const staticSkillsSource: SkillsSource = {
  load: async () => skills,
};

export const createSkillsLoader = (source: SkillsSource = staticSkillsSource) => {
  return {
    load: async (): Promise<Skill[]> => {
      return source.load();
    },
  };
};

export const loadSkills = async (source?: SkillsSource): Promise<Skill[]> => {
  return createSkillsLoader(source).load();
};
