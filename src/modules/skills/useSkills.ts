import { useMemo } from 'react';

import { skillsRegistry } from './skills.registry';

export const useSkills = () => {
  const skills = useMemo(() => skillsRegistry, []);

  const categories = useMemo(() => {
    return Array.from(new Set(skills.map((skill) => skill.category)));
  }, [skills]);

  return {
    skills,
    categories,
    totalSkills: skills.length,
  };
};

