// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import {
  PYTHON_UNIT_TEMPLATE,
  BASH_PYTHON_TEMPLATE,
  JAVA_UNIT_TEMPLATE,
  BASH_JAVA_TEMPLATE,
  BASH_CPP_TEMPLATE,
} from '../TestDefinitions/testTemplates';

/****************************** CodeMirror Utils *********************************/
// Map each extension to the syntax highlighter for it
export const codeMirorLanguageMap: { [language: string]: string } = {
  java: 'java',
  c: 'csrc',
  cpp: 'c++src',
  py: 'python',
  js: 'javascript',
  jsx: 'javascript',
  tsx: 'typescript',
  ts: 'typescript',
  rb: 'ruby',
  php: 'php',
  hs: 'haskell',
  yaml: 'yaml',
  yml: 'yaml',
  cson: 'coffeescript',
  coffee: 'coffeescript',
  dockerfile: 'dockerfile',
  ml: 'ocaml',
  mli: 'ocaml',
  sh: 'shell',
  ipynb: 'json',
  md: 'markdown',
  r: 'r',
};

export const extensionsByLanguage: { [language: string]: string } = {
  'python-3.12': 'py',
  'python-3.11': 'py',
  'python-3.10': 'py',
  'python-3.7': 'py',
  'python-2.7': 'py',
  java: 'java',
  'java-17': 'java',
  'java-11': 'java',
  'c/c++': 'c',
  'node-20': 'js',
  'node-18': 'js',
  'r-4': 'r',
  python: 'py',
  r: 'r',
  javascript: 'js',
  typescript: 'ts',
  node: 'js',
};

/****************************** Languages and Language support *********************************/

// Languages supported
export const languages = [
  'python-3.12',
  'python-3.11',
  'python-3.10',
  'python-3.7',
  'java-17',
  'java-11',
  'java',
  'c/c++',
  'node-20',
  'node-18',
  'ruby',
  'php',
  'r-4',
  'r',
];

export const hasNativeTestSupport = (language: string) => {
  return languageWithNativeTestSupport.includes(language);
};

// The languages for which I/o tests and native unit tests are supported
const languageWithNativeTestSupport = ['python-3.7', 'java', 'python-2.7'];

/****************************** Test Templates *********************************/
// Initial templates strings for different test and language types
export const testTemplates: { [language: string]: { [type: string]: string } } = {
  'python-3.7': {
    io: '',
    unit: PYTHON_UNIT_TEMPLATE,
    shell: BASH_PYTHON_TEMPLATE,
  },
  'python-2.7': {
    io: '',
    unit: PYTHON_UNIT_TEMPLATE,
    shell: BASH_PYTHON_TEMPLATE,
  },
  java: {
    io: '',
    unit: JAVA_UNIT_TEMPLATE,
    shell: BASH_JAVA_TEMPLATE,
  },
  'c/c++': {
    io: '',
    unit: '',
    shell: BASH_CPP_TEMPLATE,
  },
  other: {
    io: '',
    unit: '',
    shell: BASH_CPP_TEMPLATE,
  },
};

export const commandLineExamples: { [language: string]: string } = {
  'python-3.7': 'python3 HelloWorld.py',
  'python-2.7': 'python HelloWorld.py',
  java: 'java HelloWorld',
  'c/c++': './HelloWorld',
  ruby: 'ruby hello_world.rb',
  ocaml: 'ocaml hello_world.ml',
  javascript: 'node hello_world.js',
  php: 'php hello_world.php',
  haskell: './HelloWorld',
  other: 'echo Hello, World!',
};
