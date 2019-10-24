import 'codemirror/mode/python/python';
import 'codemirror/mode/clike/clike';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/mllike/mllike';
import 'codemirror/mode/shell/shell';

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

const FUNCTION_TEMPLATE = 'FunctionName(Arg1, Arg2, ...)';
const PYTHON_UNIT_TEMPLATE = `
# Uncomment the following line if you want to import methods
# from files import <insert student's fileName here>

def TestCase():
  # TestCase must return a TestOutput Object
  # TestObject is initialized
  a = 1
  if (a > 0):
    return TestOutput(passed=True, logs="Test passed.")
  else:
    return TestOutput(passed=False, logs="Test failed.")
`;
const JAVA_UNIT_TEMPLATE = `
public static TestOutput TestCase() {
  int a = 1;
  if (a > 0){
    TestOutput passed = new TestOutput(true, "good job");
      return passed;
  }
  else {
    TestOutput failed = new TestOutput(false, "base job");
    return failed;
  }
};
`;

export const testTemplates: { [language: string]: { [type: string]: { [attr: string]: string } } } = {
  python: {
    functional: { placeholder: FUNCTION_TEMPLATE, initialValue: '' },
    unit: { placeholder: '', initialValue: PYTHON_UNIT_TEMPLATE },
    bash: { placeholder: '', initialValue: '' },
  },
  java: {
    functional: { placeholder: FUNCTION_TEMPLATE, initialValue: '' },
    unit: { placeholder: '', initialValue: JAVA_UNIT_TEMPLATE },
    bash: { placeholder: '', initialValue: '' },
  },
};
