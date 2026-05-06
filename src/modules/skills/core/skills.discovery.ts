import { readFile } from 'node:fs/promises';
import path from 'node:path';

import {
  SELISE_BLOCKS_BRANCH,
  SELISE_BLOCKS_REPOSITORY,
  SELISE_BLOCKS_SKILLS_PATH,
} from '../skills.registry';
import type { SkillDocument } from '../skills.types';

export interface SkillsDiscoveryOptions {
  repository?: string;
  branch?: string;
  skillsPath?: string;
  predefinedFolders?: readonly string[];
  indexUrl?: string;
  localRepoPath?: string;
}

export interface SkillsIndexEntry {
  name: string;
  type?: string;
}

const SKILL_FOLDERS = [
  'blocks-uilm',
  'blocks-uds',
  'blocks-idp',
  'blocks-deployment',
  'blocks-deployment-readiness',
] as const;

const defaultOptions: Required<Omit<SkillsDiscoveryOptions, 'indexUrl' | 'localRepoPath'>> = {
  repository: SELISE_BLOCKS_REPOSITORY,
  branch: SELISE_BLOCKS_BRANCH,
  skillsPath: SELISE_BLOCKS_SKILLS_PATH,
  predefinedFolders: SKILL_FOLDERS,
};

const toRawSkillUrl = (repository: string, branch: string, skillsPath: string, folderName: string) => {
  return `https://raw.githubusercontent.com/${repository}/${branch}/${skillsPath}/${folderName}/SKILL.md`;
};

const readSkillFromLocalRepo = async (
  localRepoPath: string,
  skillsPath: string,
  folderName: string,
): Promise<SkillDocument> => {
  const skillPath = path.join(localRepoPath, skillsPath, folderName, 'SKILL.md');
  const markdown = await readFile(skillPath, 'utf8');

  return {
    folderName,
    markdown,
    source: 'selise-blocks',
    sourceUrl: skillPath,
  };
};

const fetchSkillFromRemote = async (
  repository: string,
  branch: string,
  skillsPath: string,
  folderName: string,
): Promise<SkillDocument> => {
  const sourceUrl = toRawSkillUrl(repository, branch, skillsPath, folderName);
  const response = await fetch(sourceUrl);

  if (!response.ok) {
    throw new Error(`Failed to fetch ${sourceUrl}: ${response.status} ${response.statusText}`);
  }

  const markdown = await response.text();

  return {
    folderName,
    markdown,
    source: 'selise-blocks',
    sourceUrl,
  };
};

const discoverFoldersFromRemoteIndex = async (
  indexUrl: string,
  fallbackFolders: readonly string[],
): Promise<string[]> => {
  try {
    const response = await fetch(indexUrl, {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'vibecoder-website-sync',
      },
    });

    if (!response.ok) {
      return [...fallbackFolders];
    }

    const payload = (await response.json()) as SkillsIndexEntry[] | { tree?: SkillsIndexEntry[] };

    if (Array.isArray(payload)) {
      return payload.filter((entry) => entry.type === 'dir').map((entry) => entry.name);
    }

    if (Array.isArray(payload.tree)) {
      return payload.tree.filter((entry) => entry.type === 'dir').map((entry) => entry.name);
    }
  } catch {
    return [...fallbackFolders];
  }

  return [...fallbackFolders];
};

export const discoverSkills = async (
  options: SkillsDiscoveryOptions = {},
): Promise<SkillDocument[]> => {
  const mergedOptions = {
    ...defaultOptions,
    ...options,
  };
  const fallbackFolders = [...mergedOptions.predefinedFolders];
  const folderNames = options.indexUrl
    ? await discoverFoldersFromRemoteIndex(options.indexUrl, fallbackFolders)
    : fallbackFolders;

  const documents: SkillDocument[] = [];

  for (const folderName of folderNames) {
    if (mergedOptions.localRepoPath) {
      documents.push(
        await readSkillFromLocalRepo(mergedOptions.localRepoPath, mergedOptions.skillsPath, folderName),
      );
      continue;
    }

    documents.push(
      await fetchSkillFromRemote(
        mergedOptions.repository,
        mergedOptions.branch,
        mergedOptions.skillsPath,
        folderName,
      ),
    );
  }

  return documents;
};

export const getDefaultSkillsIndexUrl = () => {
  return `https://api.github.com/repos/${SELISE_BLOCKS_REPOSITORY}/contents/${SELISE_BLOCKS_SKILLS_PATH}?ref=${SELISE_BLOCKS_BRANCH}`;
};
