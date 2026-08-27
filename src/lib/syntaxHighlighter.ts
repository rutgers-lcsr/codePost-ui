// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**
 * Shared hljs-flavored syntax highlighter (Light build).
 *
 * The default `react-syntax-highlighter` export bundles every highlight.js grammar
 * (~460 KB); the Light build only ships what we register here. An unregistered
 * language renders as plain text — add its grammar below if a course needs it.
 */
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';

import bash from 'react-syntax-highlighter/dist/esm/languages/hljs/bash';
import c from 'react-syntax-highlighter/dist/esm/languages/hljs/c';
import cpp from 'react-syntax-highlighter/dist/esm/languages/hljs/cpp';
import csharp from 'react-syntax-highlighter/dist/esm/languages/hljs/csharp';
import css from 'react-syntax-highlighter/dist/esm/languages/hljs/css';
import diff from 'react-syntax-highlighter/dist/esm/languages/hljs/diff';
import go from 'react-syntax-highlighter/dist/esm/languages/hljs/go';
import haskell from 'react-syntax-highlighter/dist/esm/languages/hljs/haskell';
import ini from 'react-syntax-highlighter/dist/esm/languages/hljs/ini';
import java from 'react-syntax-highlighter/dist/esm/languages/hljs/java';
import javascript from 'react-syntax-highlighter/dist/esm/languages/hljs/javascript';
import json from 'react-syntax-highlighter/dist/esm/languages/hljs/json';
import kotlin from 'react-syntax-highlighter/dist/esm/languages/hljs/kotlin';
import latex from 'react-syntax-highlighter/dist/esm/languages/hljs/latex';
import less from 'react-syntax-highlighter/dist/esm/languages/hljs/less';
import lua from 'react-syntax-highlighter/dist/esm/languages/hljs/lua';
import makefile from 'react-syntax-highlighter/dist/esm/languages/hljs/makefile';
import markdown from 'react-syntax-highlighter/dist/esm/languages/hljs/markdown';
import matlab from 'react-syntax-highlighter/dist/esm/languages/hljs/matlab';
import objectivec from 'react-syntax-highlighter/dist/esm/languages/hljs/objectivec';
import ocaml from 'react-syntax-highlighter/dist/esm/languages/hljs/ocaml';
import perl from 'react-syntax-highlighter/dist/esm/languages/hljs/perl';
import php from 'react-syntax-highlighter/dist/esm/languages/hljs/php';
import plaintext from 'react-syntax-highlighter/dist/esm/languages/hljs/plaintext';
import python from 'react-syntax-highlighter/dist/esm/languages/hljs/python';
import r from 'react-syntax-highlighter/dist/esm/languages/hljs/r';
import ruby from 'react-syntax-highlighter/dist/esm/languages/hljs/ruby';
import rust from 'react-syntax-highlighter/dist/esm/languages/hljs/rust';
import scala from 'react-syntax-highlighter/dist/esm/languages/hljs/scala';
import scheme from 'react-syntax-highlighter/dist/esm/languages/hljs/scheme';
import scss from 'react-syntax-highlighter/dist/esm/languages/hljs/scss';
import shell from 'react-syntax-highlighter/dist/esm/languages/hljs/shell';
import sql from 'react-syntax-highlighter/dist/esm/languages/hljs/sql';
import swift from 'react-syntax-highlighter/dist/esm/languages/hljs/swift';
import typescript from 'react-syntax-highlighter/dist/esm/languages/hljs/typescript';
import xml from 'react-syntax-highlighter/dist/esm/languages/hljs/xml';
import yaml from 'react-syntax-highlighter/dist/esm/languages/hljs/yaml';

const languages: Record<string, unknown> = {
  bash,
  c,
  cpp,
  csharp,
  css,
  diff,
  go,
  haskell,
  ini,
  java,
  javascript,
  json,
  kotlin,
  latex,
  less,
  lua,
  makefile,
  markdown,
  matlab,
  objectivec,
  ocaml,
  perl,
  php,
  plaintext,
  python,
  r,
  ruby,
  rust,
  scala,
  scheme,
  scss,
  shell,
  sql,
  swift,
  typescript,
  xml,
  yaml,
};

Object.entries(languages).forEach(([name, grammar]) => SyntaxHighlighter.registerLanguage(name, grammar));

// Aliases lang-map / file extensions commonly resolve to.
SyntaxHighlighter.registerLanguage('js', javascript);
SyntaxHighlighter.registerLanguage('ts', typescript);
SyntaxHighlighter.registerLanguage('py', python);
SyntaxHighlighter.registerLanguage('sh', bash);
SyntaxHighlighter.registerLanguage('html', xml);
SyntaxHighlighter.registerLanguage('text', plaintext);

export default SyntaxHighlighter;
