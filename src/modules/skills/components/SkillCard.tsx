import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { useState } from 'react';

import type { Skill } from '../skills.types';
import { MarkdownRenderer } from './MarkdownRenderer';

interface SkillCardProps {
  skill: Skill;
}

export const SkillCard = ({ skill }: SkillCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <article className="group rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-lg shadow-slate-950/20 transition duration-300 hover:-translate-y-1 hover:border-cyan-300/30 hover:bg-slate-900">
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/15 text-cyan-200 ring-1 ring-cyan-300/20 transition group-hover:scale-105">
          <Sparkles className="size-5" />
        </div>
        {skill.category ? (
          <span className="shrink-0 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-medium text-cyan-100">
            {skill.category}
          </span>
        ) : null}
      </div>

      <h3 className="mt-5 text-xl font-semibold text-white">{skill.name}</h3>
      <p className="mt-3 text-sm leading-7 text-slate-400">{skill.description}</p>

      {skill.tags && skill.tags.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {skill.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setIsExpanded((value) => !value)}
        className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:border-cyan-300/30 hover:bg-white/10"
      >
        {isExpanded ? 'Hide Details' : 'View Details'}
        {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
      </button>

      {isExpanded ? (
        <div className="mt-5 rounded-3xl border border-white/10 bg-slate-950/60 p-5">
          <MarkdownRenderer content={skill.content} />
        </div>
      ) : null}
    </article>
  );
};
