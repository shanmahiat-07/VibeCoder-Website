import { useSkills } from '../useSkills';
import { SkillCard } from './SkillCard';

export const SkillsSection = () => {
  const { skills } = useSkills();

  return (
    <section id="skills" className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-200">
            SELISE Skills
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
            SELISE Blocks Skills available to the website layer.
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-300">
            These skills are loaded from a generated registry, so the SPA stays lightweight while
            the sync pipeline remains separate from runtime rendering.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {skills.map((skill) => (
            <SkillCard key={skill.id} skill={skill} />
          ))}
        </div>
      </div>
    </section>
  );
};
