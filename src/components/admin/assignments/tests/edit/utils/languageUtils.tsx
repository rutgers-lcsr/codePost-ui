import 'codemirror/mode/python/python';
import 'codemirror/mode/clike/clike';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/mllike/mllike';
import 'codemirror/mode/shell/shell';

import {
  PYTHON_UNIT_TEMPLATE,
  BASH_PYTHON_TEMPLATE,
  BASHMODE_TEMPLATE,
  JAVA_UNIT_TEMPLATE,
  BASH_JAVA_TEMPLATE,
  BASH_CPP_TEMPLATE,
} from '../TestDefinitions/testTemplates';

/****************************** CodeMirror Utils *********************************/
// Map each extension to the syntax highlighter for it
export const codeMirorLanguageMap: { [language: string]: string } = {
  java: 'text/x-java',
  py: 'python',
  js: 'javascript',
  jsx: 'javascript',
  tsx: 'javascript',
  ml: 'text/x-ocaml',
  mli: 'text/x-ocaml',
  sh: 'text/x-sh',
};

export const extensionsByLanguage: { [language: string]: string } = {
  'python-3.7': 'py',
  'python-2.7': 'py',
  java: 'java',
  'c/c++': 'c',
};

/****************************** Languages and Language support *********************************/

// Languages supported
export const languages = ['python-3.7', 'python-2.7', 'java', 'c/c++'];

export const hasNativeTestSupport = (language: string) => {
  return languageWithNativeTestSupport.includes(language);
};

export const hasDependenciesSupport = (language: string) => {
  return languagesWithDependencySupport.includes(language);
};

// The languages for which I/o tests and native unit tests are supported
const languageWithNativeTestSupport = ['python-3.7', 'java', 'python-2.7'];

// The languages for which custom dependencies are supported
const languagesWithDependencySupport = ['python-3.7', 'python-2.7'];

/****************************** Test Templates *********************************/
// Initial templates strings for different test and language types
export const testTemplates: { [language: string]: { [type: string]: string } } = {
  'python-3.7': {
    io: '',
    'native-unit': PYTHON_UNIT_TEMPLATE,
    'bash-unit': BASH_PYTHON_TEMPLATE,
    bashMode: BASHMODE_TEMPLATE,
  },
  'python-2.7': {
    io: '',
    'native-unit': PYTHON_UNIT_TEMPLATE,
    'bash-unit': BASH_PYTHON_TEMPLATE,
    bashMode: BASHMODE_TEMPLATE,
  },
  java: {
    io: '',
    'native-unit': JAVA_UNIT_TEMPLATE,
    'bash-unit': BASH_JAVA_TEMPLATE,
    bashMode: BASHMODE_TEMPLATE,
  },
  'c/c++': {
    io: '',
    'native-unit': '',
    'bash-unit': BASH_CPP_TEMPLATE,
    bashMode: '',
  },
};
