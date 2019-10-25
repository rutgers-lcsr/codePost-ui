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
# To call a student's method, uncomment the following line and call <fileName>.<method>

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
# To call a student's method, call the Class and Method: <Class>.<Method>
# Example: Calculator.add(1,2)

public static TestOutput TestCase() {
  int a = 1;
  if (a > 0) {
    TestOutput passed = new TestOutput(true, "good job");
      return passed;
  }
  else {
    TestOutput failed = new TestOutput(false, "base job");
    return failed;
  }
};
`;

const BASH_PYTHON_TEMPLATE = `
# You can write a bash script below
# It must call the function TestOutput <boolean> <string logs>
# For example, to check if a student's helloWorld file outputs "Hello World"
#
# result=$(python3 files.HelloWorld)
# if echo $result | grep "Hello World"
# then
#   TestOutput true "good job!"
# else
#   TestOutput false "Wrong result: Expected Hello World. $result provided"
# fi

TestOutput true "Put your custom log statement here"
`;

const BASH_JAVA_TEMPLATE = `
# You can write a bash script below
# It must call the function TestOutput <boolean> <string logs>
# For example, to check if a student's files compile:
# javac ../files/*.java && TestOutput true "Compiled!" || TestOutput false "Didn't compile."
#
# Or to check if a student's HelloWorld.java outputs "Hello World":
# javac ../files/HelloWorld.java -d .
# result=$(java files.HelloWorld)
# if echo $result | grep "Hello World"
# then
#   TestOutput true "good job!"
# else
#   TestOutput false "Wrong result: Expected Hello World. $result provided"
# fi

TestOutput true "Put your custom log statement here"
`;

export const testTemplates: { [language: string]: { [type: string]: { [attr: string]: string } } } = {
  python: {
    functional: { placeholder: FUNCTION_TEMPLATE, initialValue: '' },
    unit: { placeholder: '', initialValue: PYTHON_UNIT_TEMPLATE },
    bash: { placeholder: '', initialValue: BASH_PYTHON_TEMPLATE },
  },
  java: {
    functional: { placeholder: FUNCTION_TEMPLATE, initialValue: '' },
    unit: { placeholder: '', initialValue: JAVA_UNIT_TEMPLATE },
    bash: { placeholder: '', initialValue: BASH_JAVA_TEMPLATE },
  },
};
