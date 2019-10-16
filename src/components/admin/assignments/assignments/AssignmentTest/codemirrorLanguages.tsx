import 'codemirror/mode/python/python';
import 'codemirror/mode/clike/clike';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/mllike/mllike';

export const languageMap: { [language: string]: string } = {
  java: 'x-text/java',
  py: 'python',
  js: 'javascript',
  jsx: 'javascript',
  tsx: 'javascript',
  ml: 'text/x-ocaml',
  mli: 'text/x-ocaml',
};
