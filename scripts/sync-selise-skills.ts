import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseSkillMarkdown } from '../src/modules/skills/core/skills.parser.ts';
import { skillDefinitionSchema } from '../src/modules/skills/skills.schema.ts';
import type { SkillDefinition, SkillDocument } from '../src/modules/skills/skills.types.ts';

interface SkillsIndexEntry {
  name: string;
  type?: string;
}

const REPOSITORY = 'SELISEdigitalplatforms/blocks-skills';
const BRANCH = 'main';
const SKILLS_PATH = 'skills';
const PREDEFINED_SKILL_FOLDERS = [
  'blocks-uilm',
  'blocks-uds',
  'blocks-idp',
  'blocks-deployment',
  'blocks-deployment-readiness',
];

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const generatedFilePath = path.join(rootDir, 'src', 'modules', 'skills', 'skills.generated.ts');

const toRawSkillUrl = (folderName: string) => {
  return `https://raw.githubusercontent.com/${REPOSITORY}/${BRANCH}/${SKILLS_PATH}/${folderName}/SKILL.md`;
};

const discoverFoldersFromRemoteIndex = async (indexUrl: string) => {
  const response = await fetch(indexUrl, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'vibecoder-website-sync',
    },
  });

  if (!response.ok) {
    return [...PREDEFINED_SKILL_FOLDERS];
  }

  const payload = (await response.json()) as SkillsIndexEntry[] | { tree?: SkillsIndexEntry[] };

  if (Array.isArray(payload)) {
    return payload.filter((entry) => entry.type === 'dir').map((entry) => entry.name);
  }

  if (Array.isArray(payload.tree)) {
    return payload.tree.filter((entry) => entry.type === 'dir').map((entry) => entry.name);
  }

  return [...PREDEFINED_SKILL_FOLDERS];
};

const readSkillFromLocalRepo = async (localRepoPath: string, folderName: string): Promise<SkillDocument> => {
  const skillPath = path.join(localRepoPath, SKILLS_PATH, folderName, 'SKILL.md');
  const markdown = await readFile(skillPath, 'utf8');

  return {
    folderName,
    markdown,
    source: 'selise-blocks',
    sourceUrl: skillPath,
  };
};

const fetchSkillFromRemote = async (folderName: string): Promise<SkillDocument> => {
  const sourceUrl = toRawSkillUrl(folderName);
  const response = await fetch(sourceUrl);

  if (!response.ok) {
    throw new Error(`Failed to fetch ${sourceUrl}: ${response.status} ${response.statusText}`);
  }

  return {
    folderName,
    markdown: await response.text(),
    source: 'selise-blocks',
    sourceUrl,
  };
};

const formatSkillObject = (skill: SkillDefinition) => {
  const lines = [
    '  {',
    `    id: ${JSON.stringify(skill.id)},`,
    `    name: ${JSON.stringify(skill.name)},`,
    `    description: ${JSON.stringify(skill.description)},`,
    `    content: ${JSON.stringify(skill.content)},`,
  ];

  if (skill.category) {
    lines.push(`    category: ${JSON.stringify(skill.category)},`);
  }

  if (skill.tags && skill.tags.length > 0) {
    lines.push(`    tags: ${JSON.stringify(skill.tags)},`);
  }

  lines.push(`    source: ${JSON.stringify(skill.source)},`);
  lines.push('  }');

  return lines.join('\n');
};

const buildGeneratedFile = (skills: SkillDefinition[]) => {
  const header = [
    "import type { SkillDefinition } from './skills.types';",
    '',
    '// AUTO-GENERATED FILE. DO NOT EDIT MANUALLY.',
    '// Run: npm run sync:skills',
    'export const skills: SkillDefinition[] = [',
  ];

  const body = skills.map(formatSkillObject).join(',\n');

  return [...header, body, '];', ''].join('\n');
};

const formatValidationIssues = (issues: Array<{ path: (string | number)[]; message: string }>) => {
  return issues
    .map((issue) => {
      const pathLabel = issue.path.length > 0 ? issue.path.join('.') : '(root)';
      return `- ${pathLabel}: ${issue.message}`;
    })
    .join('\n');
};

const main = async () => {
  if (process.env.SKIP_SKILLS_SYNC === 'true') {
    // eslint-disable-next-line no-console
    console.log('Skipping SELISE skills sync because SKIP_SKILLS_SYNC=true');
    return;
  }

  const localRepoPath = process.env.SELISE_SKILLS_REPO_PATH?.trim();
  const indexUrl = process.env.SELISE_SKILLS_INDEX_URL?.trim();
  const folderNames = indexUrl ? await discoverFoldersFromRemoteIndex(indexUrl) : [...PREDEFINED_SKILL_FOLDERS];

  const validSkills: SkillDefinition[] = [];

  for (const folderName of folderNames) {
    try {
      const document = localRepoPath
        ? await readSkillFromLocalRepo(localRepoPath, folderName)
        : await fetchSkillFromRemote(folderName);
      const parsedSkill = parseSkillMarkdown(document);
      const validationResult = skillDefinitionSchema.safeParse(parsedSkill);

      if (!validationResult.success) {
        // eslint-disable-next-line no-console
        console.warn(
          [
            `Skill folder "${folderName}" failed validation and will be skipped.`,
            formatValidationIssues(validationResult.error.issues),
          ].join('\n'),
        );
        continue;
      }

      validSkills.push(validationResult.data);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      // eslint-disable-next-line no-console
      console.warn(`Skill folder "${folderName}" failed to load and will be skipped.\n- ${message}`);
      continue;
    }
  }

  const generatedFile = buildGeneratedFile(validSkills);

  await mkdir(path.dirname(generatedFilePath), { recursive: true });
  await writeFile(generatedFilePath, generatedFile, 'utf8');

  // eslint-disable-next-line no-console
  console.log(`Generated ${validSkills.length} skills at ${generatedFilePath}`);
};

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exitCode = 1;
});
