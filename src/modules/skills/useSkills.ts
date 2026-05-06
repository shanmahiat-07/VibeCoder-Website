import { useMemo } from 'react';

import { skills } from './skills.generated';

export const useSkills = () => {
  const categories = useMemo(() => {
    return Array.from(new Set(skills.map((skill) => skill.category).filter(Boolean)));
  }, []);

  return {
    skills,
    categories,
    totalSkills: skills.length,
  };
};
