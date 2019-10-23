import 'codemirror/mode/python/python';
import 'codemirror/mode/clike/clike';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/mllike/mllike';
import 'codemirror/mode/shell/shell';

// Map each extension to the syntax highlighter for it
export const languageMap: { [language: string]: string } = {
  java: 'text/x-java',
  py: 'python',
  js: 'javascript',
  jsx: 'javascript',
  tsx: 'javascript',
  ml: 'text/x-ocaml',
  mli: 'text/x-ocaml',
  sh: 'text/x-sh',
};
