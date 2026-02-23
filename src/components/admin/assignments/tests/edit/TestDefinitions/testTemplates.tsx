// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/****************************** Test Templates *********************************/

export const PYTHON_UNIT_TEMPLATE = `# To call a student's method, uncomment the following line and call <fileName>.<method>

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
export const JAVA_UNIT_TEMPLATE = `// Put your imports here

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

export const BASH_GENERAL_TEMPLATE = `# Write a bash script below
# It must call the function TestOutput <passed: true/false> <logs: string>
# For help getting started, click "Choose from template"

TestOutput true "Put your custom log statement here"`;

export const BASH_PYTHON_TEMPLATE = BASH_GENERAL_TEMPLATE;

export const BASH_JAVA_TEMPLATE = BASH_GENERAL_TEMPLATE;

export const BASH_CPP_TEMPLATE = BASH_GENERAL_TEMPLATE;

export const SOURCEFILE_TEMPLATE = `#######################################################################################
# This file will be run from main.sh. Create test results by calling the following function:
# TestOutput <categoryName [string]> <testName [string]> <result[boolean]> <log[string]>
###################################################################################### `;
