import type { ReactNode } from 'react';

const inlinePattern = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;

const renderInline = (text: string): ReactNode[] => {
  const tokens = text.split(inlinePattern).filter(Boolean);

  return tokens.map((token, index) => {
    if (token.startsWith('`') && token.endsWith('`')) {
      return (
        <code
          key={`${index}-${token}`}
          className="rounded bg-slate-950/90 px-1.5 py-0.5 font-mono text-[0.92em] text-cyan-100"
        >
          {token.slice(1, -1)}
        </code>
      );
    }

    if (token.startsWith('**') && token.endsWith('**')) {
      return <strong key={`${index}-${token}`}>{token.slice(2, -2)}</strong>;
    }

    if (token.startsWith('*') && token.endsWith('*')) {
      return <em key={`${index}-${token}`}>{token.slice(1, -1)}</em>;
    }

    if (token.startsWith('[') && token.includes('](') && token.endsWith(')')) {
      const splitIndex = token.indexOf('](');
      const label = token.slice(1, splitIndex);
      const href = token.slice(splitIndex + 2, -1);

      return (
        <a
          key={`${index}-${token}`}
          href={href}
          target="_blank"
          rel="noreferrer"
          className="text-cyan-200 underline decoration-cyan-300/40 underline-offset-4 transition hover:text-cyan-100"
        >
          {label}
        </a>
      );
    }

    return <span key={`${index}-${token}`}>{token}</span>;
  });
};

const isTableSeparator = (line: string) => /^\s*\|?[:\-\s|]+\|?\s*$/.test(line);
const isTableRow = (line: string) => /^\s*\|.*\|\s*$/.test(line);

const parseCells = (line: string) =>
  line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());

export const MarkdownRenderer = ({ content }: { content: string }) => {
  const lines = content.split(/\r?\n/);
  const blocks: ReactNode[] = [];
  let index = 0;

  const pushParagraph = (paragraphLines: string[]) => {
    const text = paragraphLines.join(' ').replace(/\s+/g, ' ').trim();
    if (!text) {
      return;
    }

    blocks.push(
      <p key={`p-${blocks.length}`} className="whitespace-pre-wrap text-sm leading-7 text-slate-300">
        {renderInline(text)}
      </p>,
    );
  };

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    if (trimmed.startsWith('```')) {
      const codeLines: string[] = [];
      index += 1;

      while (index < lines.length && !lines[index].trim().startsWith('```')) {
        codeLines.push(lines[index]);
        index += 1;
      }

      if (index < lines.length && lines[index].trim().startsWith('```')) {
        index += 1;
      }

      blocks.push(
        <pre
          key={`code-${blocks.length}`}
          className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950 p-4 text-sm leading-7 text-slate-200"
        >
          <code>{codeLines.join('\n')}</code>
        </pre>,
      );

      continue;
    }

    if (/^#{1,6}\s+/.test(trimmed)) {
      const level = trimmed.match(/^#{1,6}/)?.[0].length ?? 1;
      const text = trimmed.replace(/^#{1,6}\s+/, '').trim();
      const HeadingTag = `h${Math.min(level, 3)}` as 'h1' | 'h2' | 'h3';
      const headingClasses =
        level === 1
          ? 'text-2xl font-semibold text-white'
          : level === 2
            ? 'text-xl font-semibold text-white'
            : 'text-lg font-medium text-white';

      blocks.push(
        <HeadingTag key={`h-${blocks.length}`} className={headingClasses}>
          {renderInline(text)}
        </HeadingTag>,
      );

      index += 1;
      continue;
    }

    if (trimmed.startsWith('>')) {
      const quoteLines: string[] = [trimmed.replace(/^>\s?/, '')];
      index += 1;

      while (index < lines.length && lines[index].trim().startsWith('>')) {
        quoteLines.push(lines[index].trim().replace(/^>\s?/, ''));
        index += 1;
      }

      blocks.push(
        <blockquote
          key={`quote-${blocks.length}`}
          className="rounded-2xl border-l-4 border-cyan-300/50 bg-cyan-300/10 px-4 py-3 text-sm leading-7 text-slate-200"
        >
          {quoteLines.join(' ')}
        </blockquote>,
      );
      continue;
    }

    if (isTableRow(trimmed) && index + 1 < lines.length && isTableSeparator(lines[index + 1])) {
      const tableLines: string[] = [trimmed];
      index += 2;
      while (index < lines.length && isTableRow(lines[index].trim())) {
        tableLines.push(lines[index].trim());
        index += 1;
      }

      const rows = tableLines.map(parseCells);
      const [headerRow, ...bodyRows] = rows;

      blocks.push(
        <div key={`table-${blocks.length}`} className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="min-w-full border-collapse text-left text-sm text-slate-200">
            <thead className="bg-white/5">
              <tr>
                {headerRow.map((cell, cellIndex) => (
                  <th key={cellIndex} className="border-b border-white/10 px-4 py-3 font-semibold text-white">
                    {renderInline(cell)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bodyRows.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-t border-white/10">
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="px-4 py-3 align-top text-slate-300">
                      {renderInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    if (/^(-|\*)\s+/.test(trimmed)) {
      const listItems: string[] = [];
      while (index < lines.length && /^(-|\*)\s+/.test(lines[index].trim())) {
        listItems.push(lines[index].trim().replace(/^(-|\*)\s+/, ''));
        index += 1;
      }

      blocks.push(
        <ul key={`ul-${blocks.length}`} className="list-disc space-y-2 pl-5 text-sm leading-7 text-slate-300">
          {listItems.map((item, itemIndex) => (
            <li key={itemIndex}>{renderInline(item)}</li>
          ))}
        </ul>,
      );
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      const listItems: string[] = [];
      while (index < lines.length && /^\d+\.\s+/.test(lines[index].trim())) {
        listItems.push(lines[index].trim().replace(/^\d+\.\s+/, ''));
        index += 1;
      }

      blocks.push(
        <ol key={`ol-${blocks.length}`} className="list-decimal space-y-2 pl-5 text-sm leading-7 text-slate-300">
          {listItems.map((item, itemIndex) => (
            <li key={itemIndex}>{renderInline(item)}</li>
          ))}
        </ol>,
      );
      continue;
    }

    const paragraphLines: string[] = [trimmed];
    index += 1;

    while (
      index < lines.length &&
      lines[index].trim() &&
      !/^#{1,6}\s+/.test(lines[index].trim()) &&
      !lines[index].trim().startsWith('>') &&
      !lines[index].trim().startsWith('```') &&
      !/^(-|\*)\s+/.test(lines[index].trim()) &&
      !/^\d+\.\s+/.test(lines[index].trim()) &&
      !(isTableRow(lines[index].trim()) && index + 1 < lines.length && isTableSeparator(lines[index + 1]))
    ) {
      paragraphLines.push(lines[index].trim());
      index += 1;
    }

    pushParagraph(paragraphLines);
  }

  return <div className="space-y-4">{blocks}</div>;
};
