import type { SkillDefinition } from './skills.types';

export const skillsRegistry: SkillDefinition[] = [
  {
    id: 'blocks-idp',
    name: 'blocks-idp',
    description:
      'Authentication, user management, MFA, RBAC, SSO/OIDC, session handling, and organization operations for SELISE Blocks.',
    category: 'Identity & Access',
    implementation: 'https://github.com/SELISEdigitalplatforms/blocks-skills/tree/main/skills/blocks-idp',
  },
  {
    id: 'blocks-uilm',
    name: 'blocks-uilm',
    description:
      'Languages, translation keys, AI-powered auto-translation, and UILM import/export for SELISE Blocks.',
    category: 'Localization',
    implementation:
      'https://github.com/SELISEdigitalplatforms/blocks-skills/tree/main/skills/blocks-uilm',
  },
];

