// FIXME: Python2 import works differently
//  sys.path.append('/files')
// import math1

/****************************** Test Templates *********************************/

export const PYTHON_UNIT_TEMPLATE = `
# To call a student's method, uncomment the following line and call <fileName>.<method>

# import <insert student's fileName here>

def TestCase():
  # TestCase must return a TestOutput Object
  # TestObject is initialized
  a = 1
  if (a > 0):
    return TestOutput(passed=True, logs="Test passed.")
  else:
    return TestOutput(passed=False, logs="Test failed.")
`;
export const JAVA_UNIT_TEMPLATE = `
// Put your imports here

class Test {
  static TestOutput Test() {
    // Your code goes here. It must return a TestOutput object
    // To call a student's method, call the Class and Method: <Class>.<Method>
    // Example: Calculator.add(1,2)

    int a = 1;
    if (a > 0) {
      TestOutput passed = new TestOutput(true, "good job");
      return passed;
    }
    else {
      TestOutput failed = new TestOutput(false, "base job");
      return failed;
    }
  }
};
`;

export const BASH_PYTHON_TEMPLATE = `
# You can write a bash script below
# It must call the function TestOutput <boolean> <string logs>
# For example, to check if a student's helloWorld file outputs "Hello World"
#
# result=$(python3 HelloWorld.py)
# if echo $result | grep "Hello World"
# then
#   TestOutput true "good job!"
# else
#   TestOutput false "Wrong result: Expected Hello World. $result provided"
# fi

TestOutput true "Put your custom log statement here"
`;

export const BASH_JAVA_TEMPLATE = `
# You can write a bash script below
# It must call the function TestOutput <boolean> <string logs>
# For example, to check if a student's files compile:
# javac *.java && TestOutput true "Compiled!" || TestOutput false "Didn't compile."
#
# Or to check if a student's HelloWorld.java outputs "Hello World":
# javac HelloWorld.java
# result=$(java files.HelloWorld)
# if echo $result | grep "Hello World"
# then
#   TestOutput true "good job!"
# else
#   TestOutput false "Wrong result: Expected Hello World. $result provided"
# fi

TestOutput true "Put your custom log statement here"
`;

export const BASHMODE_TEMPLATE = `
# You can write a bash script below to output mutltiple tests
# Each test must call TestOutput. Sytntax:
#    TestOuput <testName (string)> <passed (boolean)> <logs (string)>
# The testNames must be unique
#
# For example, to run two passed tests tests:
#
# TestOutput "test1" true "good job!"
# TestOutput "test2" true "good job again!"
#
TestOutput "test1" true "Put your custom log statement here"
`;

export const BASH_CPP_TEMPLATE = `
# You can write a bash script below
# It must call the function TestOutput <boolean> <string logs>
# For example, to compile and check a student file's output with a given input txt
#
# g++ -o hello hello.cpp
# result = $(hello < datainput.txt)
# if [ $result == "Hello World" ];
# then
#   TestOutput true "Passed!"
# else
#   TestOutput false "Failed!"
# fi
TestOutput true "Put your custom log statement here"
`;
