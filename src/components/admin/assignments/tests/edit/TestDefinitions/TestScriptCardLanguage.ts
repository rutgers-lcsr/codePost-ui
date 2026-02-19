export type CardScriptLanguage = 'python' | 'java' | 'js' | 'r' | 'cpp' | 'ruby' | 'php' | 'other';

export interface ICardTestItem {
  id: string;
  type: 'test' | 'code';
  name?: string;
  points?: number;
  timeout?: number;
  description?: string;
  logic?: string;
}

const toIdentifier = (value: string, fallback = 'test_case') => {
  const normalized = value.replace(/[^a-zA-Z0-9_]+/g, '_').replace(/^_+|_+$/g, '');
  if (!normalized) return fallback;
  if (/^[0-9]/.test(normalized)) return `_${normalized}`;
  return normalized;
};

const toFunctionName = (value: string, fallback = 'test_case') => toIdentifier(value, fallback).toLowerCase();

const stripQuotes = (value: string) => value.trim().replace(/^['"]|['"]$/g, '');

const escapeDoubleQuoted = (value: string) => value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

const trimBoundaryWhitespace = (text: string) => text.replace(/^\s*\n/, '').replace(/\n\s*$/, '');

const dedent = (text: string) => {
  const rawLines = trimBoundaryWhitespace(text).split('\n');
  if (!rawLines.length) return '';

  const nonEmpty = rawLines.filter((line) => line.trim().length > 0);
  if (!nonEmpty.length) return rawLines.join('\n');

  const minIndent = Math.min(
    ...nonEmpty.map((line) => {
      const match = line.match(/^\s*/);
      return match ? match[0].length : 0;
    }),
  );

  return rawLines.map((line) => line.slice(minIndent)).join('\n');
};

const indent = (text: string, spaces = 4) => {
  const pad = ' '.repeat(spaces);
  return text
    .split('\n')
    .map((line) => (line.trim().length ? `${pad}${line}` : line))
    .join('\n');
};

const parseNumeric = (value?: string, fallback = 0) => {
  if (!value) return fallback;
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const pushRawCode = (items: ICardTestItem[], script: string, start: number, end: number, idPrefix = 'code') => {
  if (end <= start) return;
  const raw = script.slice(start, end).trim();
  if (!raw) return;
  items.push({ id: `${idPrefix}-${items.length}`, type: 'code', logic: raw });
};

const findMatchingDelimiter = (text: string, openIndex: number, openChar: string, closeChar: string) => {
  if (openIndex < 0 || openIndex >= text.length || text[openIndex] !== openChar) return -1;

  let depth = 0;
  let inQuote: '"' | "'" | null = null;
  let escaped = false;

  for (let i = openIndex; i < text.length; i++) {
    const ch = text[i];

    if (inQuote) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === '\\') {
        escaped = true;
        continue;
      }
      if (ch === inQuote) {
        inQuote = null;
      }
      continue;
    }

    if (ch === '"' || ch === "'") {
      inQuote = ch;
      continue;
    }

    if (ch === openChar) depth += 1;
    if (ch === closeChar) {
      depth -= 1;
      if (depth === 0) return i;
    }
  }

  return -1;
};

const splitTopLevelArgs = (value: string) => {
  const parts: string[] = [];
  let current = '';
  let inQuote: '"' | "'" | null = null;
  let escaped = false;
  let parenDepth = 0;
  let braceDepth = 0;
  let bracketDepth = 0;

  for (let i = 0; i < value.length; i++) {
    const ch = value[i];

    if (inQuote) {
      current += ch;
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === inQuote) {
        inQuote = null;
      }
      continue;
    }

    if (ch === '"' || ch === "'") {
      inQuote = ch;
      current += ch;
      continue;
    }

    if (ch === '(') parenDepth += 1;
    if (ch === ')') parenDepth -= 1;
    if (ch === '{') braceDepth += 1;
    if (ch === '}') braceDepth -= 1;
    if (ch === '[') bracketDepth += 1;
    if (ch === ']') bracketDepth -= 1;

    if (ch === ',' && parenDepth === 0 && braceDepth === 0 && bracketDepth === 0) {
      parts.push(current.trim());
      current = '';
      continue;
    }

    current += ch;
  }

  if (current.trim()) parts.push(current.trim());
  return parts;
};

const parsePython = (script: string): ICardTestItem[] => {
  const items: ICardTestItem[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  const regex =
    /@test\(\s*"([^"]*)"\s*(?:,\s*points\s*=\s*([0-9.]+))?(?:,\s*description\s*=\s*"([^"]*)")?(?:,\s*timeout\s*=\s*([0-9.]+))?\s*\)\s*\ndef\s+([a-zA-Z0-9_]+)\s*\(\):\s*\n/g;

  while ((match = regex.exec(script)) !== null) {
    pushRawCode(items, script, lastIndex, match.index);

    const startIndex = match.index + match[0].length;
    const remaining = script.substring(startIndex);
    const lines = remaining.split('\n');
    const bodyLines: string[] = [];

    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      if (line.trim() === '') {
        bodyLines.push(line);
        i += 1;
        continue;
      }
      if (line.startsWith('    ') || line.startsWith('\t')) {
        bodyLines.push(line.replace(/^( {4}|\t)/, ''));
        i += 1;
      } else {
        break;
      }
    }

    const logic = bodyLines.join('\n');
    items.push({
      id: `test-${items.length}`,
      type: 'test',
      name: match[1] || match[5],
      points: parseNumeric(match[2], 1),
      description: match[3] || '',
      timeout: match[4] ? parseNumeric(match[4], 30) : undefined,
      logic,
    });

    let consumed = 0;
    for (let j = 0; j < i; j++) consumed += lines[j].length + 1;
    lastIndex = startIndex + consumed;
    regex.lastIndex = lastIndex;
  }

  pushRawCode(items, script, lastIndex, script.length);
  return items;
};

const parseJava = (script: string): ICardTestItem[] => {
  const items: ICardTestItem[] = [];
  const regex = /@Test\s*\((.*?)\)\s*public\s+[\w<>\[\]]+\s+(\w+)\s*\([^)]*\)\s*\{/gs;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(script)) !== null) {
    const full = match[0];
    const openBrace = match.index + full.lastIndexOf('{');
    const closeBrace = findMatchingDelimiter(script, openBrace, '{', '}');
    if (closeBrace < 0) continue;

    pushRawCode(items, script, lastIndex, match.index);

    const params = splitTopLevelArgs(match[1]).reduce<Record<string, string>>((acc, part) => {
      const eqIndex = part.indexOf('=');
      if (eqIndex > 0) {
        const key = part.slice(0, eqIndex).trim();
        const value = part.slice(eqIndex + 1).trim();
        acc[key] = value;
      }
      return acc;
    }, {});

    const functionName = match[2];
    items.push({
      id: `test-${items.length}`,
      type: 'test',
      name: stripQuotes(params.name || functionName),
      description: stripQuotes(params.description || ''),
      points: parseNumeric(params.points, 1),
      timeout: params.timeout ? parseNumeric(params.timeout, 30) : undefined,
      logic: dedent(script.slice(openBrace + 1, closeBrace)),
    });

    lastIndex = closeBrace + 1;
    regex.lastIndex = lastIndex;
  }

  pushRawCode(items, script, lastIndex, script.length);
  return items;
};

const parseJs = (script: string): ICardTestItem[] => {
  const items: ICardTestItem[] = [];
  const regex =
    /test\s*\(\s*(["'])(.*?)\1\s*,\s*([0-9]+(?:\.[0-9]+)?)\s*(?:,\s*(["'])(.*?)\4)?\s*,\s*(?:function\s*\(\s*\)|\(\s*\)\s*=>)\s*\{/gs;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(script)) !== null) {
    const openBrace = match.index + match[0].lastIndexOf('{');
    const closeBrace = findMatchingDelimiter(script, openBrace, '{', '}');
    if (closeBrace < 0) continue;

    pushRawCode(items, script, lastIndex, match.index);

    const callEnd = script.indexOf(');', closeBrace);
    const tail = callEnd >= 0 ? script.slice(closeBrace + 1, callEnd) : script.slice(closeBrace + 1);
    const timeoutMatch = tail.match(/,\s*([0-9]+(?:\.[0-9]+)?)\s*$/);

    items.push({
      id: `test-${items.length}`,
      type: 'test',
      name: match[2],
      description: match[5] || '',
      points: parseNumeric(match[3], 1),
      timeout: timeoutMatch ? parseNumeric(timeoutMatch[1], 30) : undefined,
      logic: dedent(script.slice(openBrace + 1, closeBrace)),
    });

    lastIndex = callEnd >= 0 ? callEnd + 2 : closeBrace + 1;
    regex.lastIndex = lastIndex;
  }

  pushRawCode(items, script, lastIndex, script.length);
  return items;
};

const parseR = (script: string): ICardTestItem[] => {
  const items: ICardTestItem[] = [];
  const regex = /run_test\s*\(/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(script)) !== null) {
    const callStart = match.index;
    const openParen = script.indexOf('(', callStart);
    const closeParen = findMatchingDelimiter(script, openParen, '(', ')');
    if (openParen < 0 || closeParen < 0) continue;

    pushRawCode(items, script, lastIndex, callStart);

    const args = splitTopLevelArgs(script.slice(openParen + 1, closeParen));
    const name = stripQuotes(args[0] || 'Test');
    const points = parseNumeric(args[1], 1);

    let description = '';
    let timeout: number | undefined;
    let logic = '';

    const fnTokenIndex = args.findIndex((arg) => /^function\s*\(/.test(arg));
    if (fnTokenIndex >= 0) {
      if (fnTokenIndex > 2) {
        description = stripQuotes(args[2] || '');
      } else if (fnTokenIndex === 2 && /^['"]/.test(args[2])) {
        description = stripQuotes(args[2]);
      }

      const fnToken = args[fnTokenIndex];
      const fnOpen = fnToken.indexOf('{');
      const fnClose = fnToken.lastIndexOf('}');
      if (fnOpen >= 0 && fnClose > fnOpen) {
        logic = dedent(fnToken.slice(fnOpen + 1, fnClose));
      }

      const maybeTimeout = args[fnTokenIndex + 1];
      if (maybeTimeout && /^\d+(?:\.\d+)?$/.test(maybeTimeout.trim())) {
        timeout = parseNumeric(maybeTimeout, 30);
      }
    }

    items.push({
      id: `test-${items.length}`,
      type: 'test',
      name,
      description,
      points,
      timeout,
      logic,
    });

    const nextChar = script[closeParen + 1];
    lastIndex = nextChar === ';' ? closeParen + 2 : closeParen + 1;
    regex.lastIndex = lastIndex;
  }

  pushRawCode(items, script, lastIndex, script.length);
  return items;
};

const parseCpp = (script: string): ICardTestItem[] => {
  const items: ICardTestItem[] = [];
  const regex =
    /(TEST_DESC_TIMEOUT|TEST_TIMEOUT|TEST_DESC|TEST)\s*\(\s*([A-Za-z_][A-Za-z0-9_]*|"[^"]+")\s*,\s*([0-9]+(?:\.[0-9]+)?)\s*(?:,\s*"([^"]*)")?\s*(?:,\s*([0-9]+(?:\.[0-9]+)?))?\s*\)\s*\{/gs;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(script)) !== null) {
    const openBrace = match.index + match[0].lastIndexOf('{');
    const closeBrace = findMatchingDelimiter(script, openBrace, '{', '}');
    if (closeBrace < 0) continue;

    pushRawCode(items, script, lastIndex, match.index);

    const macro = match[1];
    const rawName = stripQuotes(match[2]);
    const description = macro.includes('DESC') ? match[4] || '' : '';
    const timeout = macro.includes('TIMEOUT') && match[5] ? parseNumeric(match[5], 30) : undefined;

    items.push({
      id: `test-${items.length}`,
      type: 'test',
      name: rawName,
      description,
      points: parseNumeric(match[3], 1),
      timeout,
      logic: dedent(script.slice(openBrace + 1, closeBrace)),
    });

    lastIndex = closeBrace + 1;
    regex.lastIndex = lastIndex;
  }

  pushRawCode(items, script, lastIndex, script.length);
  return items;
};

const parseRuby = (script: string): ICardTestItem[] => {
  const items: ICardTestItem[] = [];
  const regex = /run_test\s*\((.*?)\)\s*do([\s\S]*?)\n\s*end/gs;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(script)) !== null) {
    pushRawCode(items, script, lastIndex, match.index);

    const args = splitTopLevelArgs(match[1]);
    items.push({
      id: `test-${items.length}`,
      type: 'test',
      name: stripQuotes(args[0] || 'Test'),
      points: parseNumeric(args[1], 1),
      description: stripQuotes(args[2] || ''),
      timeout: args[3] && /^\d+(?:\.\d+)?$/.test(args[3]) ? parseNumeric(args[3], 30) : undefined,
      logic: dedent(match[2]),
    });

    lastIndex = match.index + match[0].length;
    regex.lastIndex = lastIndex;
  }

  pushRawCode(items, script, lastIndex, script.length);
  return items;
};

const parsePhp = (script: string): ICardTestItem[] => {
  const items: ICardTestItem[] = [];
  const regex =
    /Tester::test\s*\(\s*(["'])(.*?)\1\s*,\s*([0-9]+(?:\.[0-9]+)?)\s*(?:,\s*(["'])(.*?)\4)?\s*,\s*function\s*\(\s*\)\s*\{/gs;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(script)) !== null) {
    const openBrace = match.index + match[0].lastIndexOf('{');
    const closeBrace = findMatchingDelimiter(script, openBrace, '{', '}');
    if (closeBrace < 0) continue;

    pushRawCode(items, script, lastIndex, match.index);

    const callEnd = script.indexOf(');', closeBrace);
    const tail = callEnd >= 0 ? script.slice(closeBrace + 1, callEnd) : script.slice(closeBrace + 1);
    const timeoutMatch = tail.match(/,\s*([0-9]+(?:\.[0-9]+)?)\s*$/);

    items.push({
      id: `test-${items.length}`,
      type: 'test',
      name: match[2],
      description: match[5] || '',
      points: parseNumeric(match[3], 1),
      timeout: timeoutMatch ? parseNumeric(timeoutMatch[1], 30) : undefined,
      logic: dedent(script.slice(openBrace + 1, closeBrace)),
    });

    lastIndex = callEnd >= 0 ? callEnd + 2 : closeBrace + 1;
    regex.lastIndex = lastIndex;
  }

  pushRawCode(items, script, lastIndex, script.length);
  return items;
};

export const normalizeCardScriptLanguage = (language: string): CardScriptLanguage => {
  const value = (language || '').toLowerCase();
  if (value.includes('python') || value === 'ipynb' || value.includes('jupyter')) return 'python';
  if (value === 'java' || value.startsWith('java-')) return 'java';
  if (value === 'r' || value.startsWith('r-')) return 'r';
  if (value.includes('c/c++') || value.includes('c++') || value.includes('cpp') || value === 'c') return 'cpp';
  if (value.includes('node') || value.includes('javascript') || value.includes('js') || value.includes('typescript')) {
    return 'js';
  }
  if (value.includes('ruby') || value === 'rb') return 'ruby';
  if (value.includes('php')) return 'php';
  return 'other';
};

export const defaultLogicForLanguage = (language: string) => {
  const normalized = normalizeCardScriptLanguage(language);
  switch (normalized) {
    case 'java':
      return 'assertEquals(3, add(1, 2));';
    case 'js':
      return "if (add(1, 2) !== 3) throw new Error('Expected 3');";
    case 'r':
      return 'stopifnot(add(1, 2) == 3)';
    case 'cpp':
      return 'assertTrue(add(1, 2) == 3, "Expected 3");';
    case 'ruby':
      return "raise 'Expected 3' unless add(1, 2) == 3";
    case 'php':
      return "if (add(1, 2) !== 3) { throw new Exception('Expected 3'); }";
    case 'python':
      return 'assert add(1, 2) == 3';
    default:
      return '// test logic';
  }
};

export const codeEditorExtensionByLanguage = (language: string) => {
  const normalized = normalizeCardScriptLanguage(language);
  switch (normalized) {
    case 'python':
      return 'py';
    case 'java':
      return 'java';
    case 'js':
      return 'js';
    case 'r':
      return 'r';
    case 'cpp':
      return 'c';
    case 'ruby':
      return 'rb';
    case 'php':
      return 'php';
    default:
      return 'txt';
  }
};

export const parseCardScript = (code: string, language: string): ICardTestItem[] => {
  if (!code) return [];

  const normalized = normalizeCardScriptLanguage(language);
  switch (normalized) {
    case 'python':
      return parsePython(code);
    case 'java':
      return parseJava(code);
    case 'js':
      return parseJs(code);
    case 'r':
      return parseR(code);
    case 'cpp':
      return parseCpp(code);
    case 'ruby':
      return parseRuby(code);
    case 'php':
      return parsePhp(code);
    default:
      return [{ id: 'code-0', type: 'code', logic: code }];
  }
};

export const generateCardScript = (items: ICardTestItem[], language: string): string => {
  const normalized = normalizeCardScriptLanguage(language);

  const script = items
    .map((item) => {
      if (item.type === 'code') return (item.logic || '').trim();

      const safeName = (item.name || 'New Test').trim() || 'New Test';
      const points = Number.isFinite(item.points) ? item.points : 1;
      const description = (item.description || '').trim();
      const timeout = item.timeout;
      const rawLogic = (item.logic || defaultLogicForLanguage(language)).trimRight();

      switch (normalized) {
        case 'python': {
          const descArg = description ? `, description="${escapeDoubleQuoted(description)}"` : '';
          const timeoutArg = timeout ? `, timeout=${timeout}` : '';
          const funcName = `test_${toFunctionName(safeName, 'test_case')}`;
          return `@test("${escapeDoubleQuoted(safeName)}", points=${points}${descArg}${timeoutArg})\ndef ${funcName}():\n${indent(rawLogic || 'pass')}`;
        }
        case 'java': {
          const descArg = description ? `, description="${escapeDoubleQuoted(description)}"` : '';
          const timeoutArg = timeout ? `, timeout=${timeout}` : '';
          const funcName = toIdentifier(`test_${safeName}`, 'testCase');
          const javaBody = rawLogic || '// test logic';
          const hasReturnStatement = /\breturn\b/.test(javaBody);
          const finalBody = hasReturnStatement
            ? javaBody
            : `${javaBody}${javaBody.endsWith('\n') ? '' : '\n'}return new Object[]{0.0, ""};`;
          return `@Test(name="${escapeDoubleQuoted(safeName)}", points=${points}${descArg}${timeoutArg})\npublic Object[] ${funcName}() {\n${indent(finalBody)}\n}`;
        }
        case 'js': {
          const timeoutArg = timeout ? `, ${timeout}` : '';
          return `test("${escapeDoubleQuoted(safeName)}", ${points}, "${escapeDoubleQuoted(description)}", () => {\n${indent(rawLogic || '// assertions')}\n}${timeoutArg});`;
        }
        case 'r': {
          const timeoutArg = timeout ? `, ${timeout}` : '';
          return `run_test("${escapeDoubleQuoted(safeName)}", ${points}, "${escapeDoubleQuoted(description)}", function() {\n${indent(rawLogic || '# assertions')}\n}${timeoutArg})`;
        }
        case 'cpp': {
          const testName = toIdentifier(safeName, 'TestCase');
          const hasDescription = description.length > 0;
          const hasTimeout = typeof timeout === 'number' && timeout > 0;

          if (hasDescription && hasTimeout) {
            return `TEST_DESC_TIMEOUT(${testName}, ${points}, "${escapeDoubleQuoted(description)}", ${timeout}) {\n${indent(rawLogic || '// assertions')}\n}`;
          }
          if (hasDescription) {
            return `TEST_DESC(${testName}, ${points}, "${escapeDoubleQuoted(description)}") {\n${indent(rawLogic || '// assertions')}\n}`;
          }
          if (hasTimeout) {
            return `TEST_TIMEOUT(${testName}, ${points}, ${timeout}) {\n${indent(rawLogic || '// assertions')}\n}`;
          }
          return `TEST(${testName}, ${points}) {\n${indent(rawLogic || '// assertions')}\n}`;
        }
        case 'ruby': {
          const timeoutArg = timeout ? `, ${timeout}` : '';
          return `run_test("${escapeDoubleQuoted(safeName)}", ${points}, "${escapeDoubleQuoted(description)}"${timeoutArg}) do\n${indent(rawLogic || '# assertions')}\nend`;
        }
        case 'php': {
          const timeoutArg = timeout ? `, ${timeout}` : '';
          return `Tester::test("${escapeDoubleQuoted(safeName)}", ${points}, "${escapeDoubleQuoted(description)}", function() {\n${indent(rawLogic || '// assertions')}\n}${timeoutArg});`;
        }
        default:
          return rawLogic || '';
      }
    })
    .filter((chunk) => chunk.trim().length > 0)
    .join('\n\n');

  return `${script}\n`;
};
