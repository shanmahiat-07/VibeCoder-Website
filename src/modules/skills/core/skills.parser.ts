import type { SkillDefinition, SkillDocument } from '../skills.types';

interface FrontmatterData {
  name?: string;
  description?: string;
  tags?: string[];
  kind?: string;
  source?: string;
}

const normalizeSource = (value?: string): SkillDefinition['source'] => {
  return value === 'selise-blocks' ? 'selise-blocks' : 'selise-blocks';
};

const toCategory = (kind?: string, title?: string, tags?: string[]) => {
  if (kind && kind.trim().length > 0) {
    return kind
      .split(/[-_]/g)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  if (title && title.trim().length > 0) {
    const cleanedTitle = title
      .replace(/\bskill\b$/i, '')
      .replace(/^blocks\s+/i, '')
      .trim();

    if (cleanedTitle.length > 0) {
      return cleanedTitle;
    }
  }

  const firstTag = tags?.[0];
  if (firstTag) {
    return firstTag
      .split(/[-_]/g)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  return undefined;
};

const extractFirstParagraph = (body: string) => {
  const paragraph = body
    .split(/\n\s*\n/g)
    .map((part) => part.replace(/\s+/g, ' ').trim())
    .find((part) => part.length > 0 && !/^#{1,6}\s+/.test(part));

  return paragraph ?? '';
};

const extractFirstHeading = (body: string) => {
  const headingLine = body
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => /^#{1,6}\s+/.test(line));

  if (!headingLine) {
    return '';
  }

  return headingLine.replace(/^#{1,6}\s+/, '').trim();
};

const parseYamlList = (lines: string[], startIndex: number) => {
  const values: string[] = [];
  let index = startIndex;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (trimmed.length === 0) {
      index += 1;
      continue;
    }

    if (!line.startsWith('  ') && !line.startsWith('\t')) {
      break;
    }

    const item = trimmed.replace(/^-\s*/, '').replace(/^['"]|['"]$/g, '').trim();
    if (item) {
      values.push(item);
    }

    index += 1;
  }

  return { values, nextIndex: index };
};

const parseFrontmatter = (frontmatter: string): FrontmatterData => {
  const lines = frontmatter.split(/\r?\n/);
  const data: FrontmatterData = {};

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const keyValueMatch = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!keyValueMatch) {
      continue;
    }

    const [, key, rawValue] = keyValueMatch;

    if (rawValue.length === 0) {
      if (key === 'tags') {
        const parsed = parseYamlList(lines, index + 1);
        data.tags = parsed.values;
        index = parsed.nextIndex - 1;
      }

      continue;
    }

    const cleanedValue = rawValue.replace(/^['"]|['"]$/g, '').trim();

    if (key === 'tags') {
      if (cleanedValue.startsWith('[') && cleanedValue.endsWith(']')) {
        const items = cleanedValue.slice(1, -1).split(',').map((item) => item.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
        data.tags = items;
      } else {
        data.tags = [cleanedValue];
      }
      continue;
    }

    if (key === 'name') {
      data.name = cleanedValue;
      continue;
    }

    if (key === 'description') {
      data.description = cleanedValue;
      continue;
    }

    if (key === 'kind') {
      data.kind = cleanedValue;
      continue;
    }

    if (key === 'source') {
      data.source = cleanedValue;
    }
  }

  return data;
};

const splitFrontmatter = (markdown: string) => {
  const trimmed = markdown.replace(/^\uFEFF/, '');
  if (!trimmed.startsWith('---')) {
    return { frontmatter: '', body: trimmed };
  }

  const lines = trimmed.split(/\r?\n/);
  let endIndex = -1;

  for (let index = 1; index < lines.length; index += 1) {
    if (lines[index].trim() === '---') {
      endIndex = index;
      break;
    }
  }

  if (endIndex === -1) {
    return { frontmatter: '', body: trimmed };
  }

  return {
    frontmatter: lines.slice(1, endIndex).join('\n'),
    body: lines.slice(endIndex + 1).join('\n').trim(),
  };
};

export const parseSkillMarkdown = (document: SkillDocument): SkillDefinition => {
  const { frontmatter, body } = splitFrontmatter(document.markdown);
  const metadata = parseFrontmatter(frontmatter);
  const title = extractFirstHeading(body) || metadata.name || document.folderName;
  const description = metadata.description ?? extractFirstParagraph(body) ?? document.folderName;
  const tags = metadata.tags ?? [];
  const category = toCategory(metadata.kind, title, tags);
  const source = normalizeSource(metadata.source ?? document.source);

  return {
    id: document.folderName,
    name: title,
    description,
    content: body,
    category,
    tags,
    source,
  };
};
