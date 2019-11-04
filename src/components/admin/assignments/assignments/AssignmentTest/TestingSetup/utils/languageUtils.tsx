import 'codemirror/mode/python/python';
import 'codemirror/mode/clike/clike';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/mllike/mllike';
import 'codemirror/mode/shell/shell';

import {
  PYTHON_UNIT_TEMPLATE,
  BASH_PYTHON_TEMPLATE,
  BASHMODE_PYTHON_TEMPLATE,
  JAVA_UNIT_TEMPLATE,
  BASH_JAVA_TEMPLATE,
} from './templates/testTemplates';

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

/****************************** Language parse utils *********************************/
export const getLanguage = (languageChoice: string) => {
  return languageMap[languageChoice];
};

const languageMap: { [language: string]: string } = {
  'python-3.7': 'python',
  'python-2.7': 'python',
  java: 'java',
};

/****************************** Test Templates *********************************/
// Initial templates strings for different test and language types

export const testTemplates: { [language: string]: { [type: string]: { [attr: string]: string } } } = {
  'python-3.7': {
    io: { placeholder: '', initialValue: '' },
    'native-unit': { placeholder: '', initialValue: PYTHON_UNIT_TEMPLATE },
    'bash-unit': { placeholder: '', initialValue: BASH_PYTHON_TEMPLATE },
    bashMode: { placeholder: '', initialValue: BASHMODE_PYTHON_TEMPLATE },
  },
  'python-2.7': {
    io: { placeholder: '', initialValue: '' },
    'native-unit': { placeholder: '', initialValue: PYTHON_UNIT_TEMPLATE },
    'bash-unit': { placeholder: '', initialValue: BASH_PYTHON_TEMPLATE },
    bashMode: { placeholder: '', initialValue: BASHMODE_PYTHON_TEMPLATE },
  },
  java: {
    io: { placeholder: '', initialValue: '' },
    'native-unit': { placeholder: '', initialValue: JAVA_UNIT_TEMPLATE },
    'bash-unit': { placeholder: '', initialValue: BASH_JAVA_TEMPLATE },
    bashMode: { placeholder: '', initialValue: BASHMODE_PYTHON_TEMPLATE },
  },
};
