export const demoSubmissionTests = [
  {
    students: ['student2@codepost.io'],
    tests: [
      { passed: true, isError: false, logs: '', testCase: 'Test on [1,2,3]' },
      { passed: true, isError: false, logs: '', testCase: 'Test on [1]' },
      { passed: true, isError: false, logs: '', testCase: 'Test on [-1,-2,-3]' },
      { passed: true, isError: false, logs: 'passed', testCase: 'Test on random arrays' },
      {
        passed: false,
        isError: false,
        logs:
          'No Result received.\n_test410.java:7: error: duplicate class: Test\nclass Test {\n^\n_test410.java:20: error: duplicate class: TestOutput\nclass TestOutput {\n^\n_test418.java:8: error: duplicate class: Test\nclass Test {\n^\n_test418.java:41: error: duplicate class: TestOutput\nclass TestOutput {\n^\n4 errors\nOperation Timed Out. Timeout set at 20 seconds. Please check student code for an infinite loop or if it is waiting for user input.\n',
        testCase: 'Test on [] with 0',
      },
      {
        passed: false,
        isError: false,
        logs:
          'No Result received.\n_test410.java:7: error: duplicate class: Test\nclass Test {\n^\n_test410.java:20: error: duplicate class: TestOutput\nclass TestOutput {\n^\n_test418.java:8: error: duplicate class: Test\nclass Test {\n^\n_test418.java:41: error: duplicate class: TestOutput\nclass TestOutput {\n^\n4 errors\nOperation Timed Out. Timeout set at 20 seconds. Please check student code for an infinite loop or if it is waiting for user input.\n',
        testCase: 'Test on [1,2,3] with 3',
      },
      {
        passed: false,
        isError: false,
        logs:
          'No Result received.\n_test410.java:7: error: duplicate class: Test\nclass Test {\n^\n_test410.java:20: error: duplicate class: TestOutput\nclass TestOutput {\n^\n_test418.java:8: error: duplicate class: Test\nclass Test {\n^\n_test418.java:41: error: duplicate class: TestOutput\nclass TestOutput {\n^\n4 errors\nOperation Timed Out. Timeout set at 20 seconds. Please check student code for an infinite loop or if it is waiting for user input.\n',
        testCase: 'Test on [1,2,3] with 0',
      },
      {
        passed: false,
        isError: false,
        logs:
          'No Result received.\n_test410.java:7: error: duplicate class: Test\nclass Test {\n^\n_test410.java:20: error: duplicate class: TestOutput\nclass TestOutput {\n^\n_test418.java:8: error: duplicate class: Test\nclass Test {\n^\n_test418.java:41: error: duplicate class: TestOutput\nclass TestOutput {\n^\n4 errors\nOperation Timed Out. Timeout set at 20 seconds. Please check student code for an infinite loop or if it is waiting for user input.\n',
        testCase: 'Test on [3,2,1]',
      },
      {
        passed: false,
        isError: false,
        logs:
          'No Result received.\n_test410.java:7: error: duplicate class: Test\nclass Test {\n^\n_test410.java:20: error: duplicate class: TestOutput\nclass TestOutput {\n^\n_test418.java:8: error: duplicate class: Test\nclass Test {\n^\n_test418.java:41: error: duplicate class: TestOutput\nclass TestOutput {\n^\n4 errors\nOperation Timed Out. Timeout set at 20 seconds. Please check student code for an infinite loop or if it is waiting for user input.\n',
        testCase: 'Test on [1]',
      },
    ],
  },
  {
    students: ['student1@codepost.io', 'student6@codepost.io'],
    tests: [
      { passed: true, isError: false, logs: '', testCase: 'Test on [1,2,3] with 3' },
      { passed: true, isError: false, logs: '', testCase: 'Test on [1,2,3]' },
      { passed: true, isError: false, logs: '', testCase: 'Test on [] with 0' },
      { passed: true, isError: false, logs: 'passed', testCase: 'Test on [3,2,1]' },
      { passed: true, isError: false, logs: 'passed', testCase: 'Test on [1]' },
      { passed: true, isError: false, logs: '', testCase: 'Test on [1]' },
      { passed: true, isError: false, logs: '', testCase: 'Test on [1,2,3] with 0' },
      {
        passed: false,
        isError: false,
        logs:
          '\n=============================\nEXPECTED OUTPUT:\n-1\n------------------------------------------------------------\nACTUAL OUTPUT:\n0\n=============================\n',
        testCase: 'Test on [-1,-2,-3]',
      },
      { passed: false, isError: false, logs: 'failed on []', testCase: 'Test on random arrays' },
    ],
  },
  {
    students: ['student0@codepost.io', 'student5@codepost.io'],
    tests: [
      { passed: true, isError: false, logs: '', testCase: 'Test on [1,2,3] with 3' },
      { passed: true, isError: false, logs: '', testCase: 'Test on [1,2,3]' },
      { passed: true, isError: false, logs: '', testCase: 'Test on [] with 0' },
      { passed: true, isError: false, logs: 'passed', testCase: 'Test on [3,2,1]' },
      { passed: true, isError: false, logs: 'passed', testCase: 'Test on [1]' },
      { passed: true, isError: false, logs: '', testCase: 'Test on [1]' },
      { passed: true, isError: false, logs: '', testCase: 'Test on [1,2,3] with 0' },
      { passed: true, isError: false, logs: '', testCase: 'Test on [-1,-2,-3]' },
      { passed: true, isError: false, logs: 'passed', testCase: 'Test on random arrays' },
    ],
  },
  {
    students: ['student4@codepost.io', 'student9@codepost.io'],
    tests: [
      { passed: true, isError: false, logs: '', testCase: 'Test on [1,2,3] with 3' },
      { passed: true, isError: false, logs: '', testCase: 'Test on [1,2,3]' },
      { passed: true, isError: false, logs: '', testCase: 'Test on [] with 0' },
      { passed: true, isError: false, logs: 'passed', testCase: 'Test on [3,2,1]' },
      { passed: true, isError: false, logs: 'passed', testCase: 'Test on [1]' },
      { passed: true, isError: false, logs: '', testCase: 'Test on [1]' },
      { passed: true, isError: false, logs: '', testCase: 'Test on [1,2,3] with 0' },
      { passed: true, isError: false, logs: '', testCase: 'Test on [-1,-2,-3]' },
      { passed: true, isError: false, logs: 'passed', testCase: 'Test on random arrays' },
    ],
  },
  {
    students: ['student3@codepost.io', 'student8@codepost.io'],
    tests: [
      { passed: true, isError: false, logs: '', testCase: 'Test on [1,2,3] with 3' },
      {
        passed: false,
        isError: false,
        logs:
          'java.lang.ArrayIndexOutOfBoundsException: 3\n\tat LoopUtils.max(LoopUtils.java:21)\n\tat _test415.main(_test415.java:13)\n',
        testCase: 'Test on [1,2,3]',
      },
      { passed: true, isError: false, logs: '', testCase: 'Test on [] with 0' },
      { passed: true, isError: false, logs: 'passed', testCase: 'Test on [3,2,1]' },
      { passed: true, isError: false, logs: 'passed', testCase: 'Test on [1]' },
      {
        passed: false,
        isError: false,
        logs:
          'java.lang.ArrayIndexOutOfBoundsException: 3\n\tat LoopUtils.max(LoopUtils.java:21)\n\tat _test417.main(_test417.java:13)\n',
        testCase: 'Test on [1]',
      },
      { passed: true, isError: false, logs: '', testCase: 'Test on [1,2,3] with 0' },
      {
        passed: false,
        isError: false,
        logs:
          'java.lang.ArrayIndexOutOfBoundsException: 3\n\tat LoopUtils.max(LoopUtils.java:21)\n\tat _test416.main(_test416.java:13)\n',
        testCase: 'Test on [-1,-2,-3]',
      },
      {
        passed: false,
        isError: false,
        logs:
          'No Result received.\n_test410.java:7: error: duplicate class: Test\nclass Test {\n^\n_test410.java:20: error: duplicate class: TestOutput\nclass TestOutput {\n^\n_test418.java:8: error: duplicate class: Test\nclass Test {\n^\n_test418.java:41: error: duplicate class: TestOutput\nclass TestOutput {\n^\n4 errors\nException in thread "main" java.lang.ArrayIndexOutOfBoundsException: 0\n\tat LoopUtils.max(LoopUtils.java:21)\n\tat Test.Test(_test418.java:31)\n\tat _test418.main(_test418.java:53)\n',
        testCase: 'Test on random arrays',
      },
    ],
  },
  {
    students: ['student0@codepost.io'],
    tests: [
      {
        passed: true,
        isError: false,
        logs: 'Expected Hello, World. Received Hello, World.',
        testCase: 'Outputs "Hello, World"',
      },
      { passed: true, isError: false, logs: 'passed', testCase: 'Outputs something' },
    ],
  },
  {
    students: ['student2@codepost.io'],
    tests: [
      {
        passed: false,
        isError: false,
        logs: 'Expected Hello, World. Received Hello, wurld.',
        testCase: 'Outputs "Hello, World"',
      },
      { passed: true, isError: false, logs: 'passed', testCase: 'Outputs something' },
    ],
  },
  {
    students: ['student1@codepost.io'],
    tests: [
      {
        passed: true,
        isError: false,
        logs: 'Expected Hello, World. Received Hello, World.',
        testCase: 'Outputs "Hello, World"',
      },
      { passed: true, isError: false, logs: 'passed', testCase: 'Outputs something' },
    ],
  },
  {
    students: ['student5@codepost.io'],
    tests: [
      {
        passed: true,
        isError: false,
        logs: 'Expected Hello, World. Received Hello, World.',
        testCase: 'Outputs "Hello, World"',
      },
      { passed: true, isError: false, logs: 'passed', testCase: 'Outputs something' },
    ],
  },
  {
    students: ['student3@codepost.io'],
    tests: [
      {
        passed: true,
        isError: false,
        logs: 'Expected Hello, World. Received Hello, World.',
        testCase: 'Outputs "Hello, World"',
      },
      { passed: true, isError: false, logs: 'passed', testCase: 'Outputs something' },
    ],
  },
  {
    students: ['student4@codepost.io'],
    tests: [
      {
        passed: true,
        isError: false,
        logs: 'Expected Hello, World. Received Hello, World.',
        testCase: 'Outputs "Hello, World"',
      },
      { passed: true, isError: false, logs: 'passed', testCase: 'Outputs something' },
    ],
  },
  {
    students: ['student6@codepost.io'],
    tests: [
      {
        passed: true,
        isError: false,
        logs: 'Expected Hello, World. Received Hello, World.',
        testCase: 'Outputs "Hello, World"',
      },
      { passed: true, isError: false, logs: 'passed', testCase: 'Outputs something' },
    ],
  },
  {
    students: ['student7@codepost.io'],
    tests: [
      {
        passed: true,
        isError: false,
        logs: 'Expected Hello, World. Received Hello, World.',
        testCase: 'Outputs "Hello, World"',
      },
      { passed: true, isError: false, logs: 'passed', testCase: 'Outputs something' },
    ],
  },
  {
    students: ['student8@codepost.io'],
    tests: [
      {
        passed: true,
        isError: false,
        logs: 'Expected Hello, World. Received Hello, World.',
        testCase: 'Outputs "Hello, World"',
      },
      { passed: true, isError: false, logs: 'passed', testCase: 'Outputs something' },
    ],
  },
  {
    students: ['student9@codepost.io'],
    tests: [
      {
        passed: true,
        isError: false,
        logs: 'Expected Hello, World. Received Hello, World.',
        testCase: 'Outputs "Hello, World"',
      },
      { passed: true, isError: false, logs: 'passed', testCase: 'Outputs something' },
    ],
  },
  {
    students: ['student0@codepost.io', 'student5@codepost.io'],
    tests: [
      {
        passed: false,
        isError: false,
        logs:
          '\n=============================\nEXPECTED OUTPUT:\ntrue\n------------------------------------------------------------\nACTUAL OUTPUT:\nfalse\n=============================\n',
        testCase: 'Test on [1,2,3] with 3',
      },
      { passed: true, isError: false, logs: '', testCase: 'Test on []' },
      { passed: true, isError: false, logs: '', testCase: 'Test on [1]' },
      { passed: true, isError: false, logs: '', testCase: 'Test on [1,2,3]' },
      { passed: true, isError: false, logs: '', testCase: 'Test on [1,2,3] with 0' },
      { passed: true, isError: false, logs: '', testCase: 'Test on [] with 3' },
    ],
  },
  {
    students: ['student1@codepost.io', 'student6@codepost.io'],
    tests: [
      {
        passed: false,
        isError: false,
        logs:
          '\n=============================\nEXPECTED OUTPUT:\ntrue\n------------------------------------------------------------\nACTUAL OUTPUT:\nfalse\n=============================\n',
        testCase: 'Test on [1,2,3] with 3',
      },
      {
        passed: false,
        isError: false,
        logs:
          'java.lang.IllegalArgumentException: 1 > 0\n\tat java.util.Arrays.copyOfRange(Arrays.java:3591)\n\tat RecursionUtils.sum(RecursionUtils.java:22)\n\tat _test408.main(_test408.java:13)\n',
        testCase: 'Test on []',
      },
      { passed: true, isError: false, logs: '', testCase: 'Test on [1]' },
      { passed: true, isError: false, logs: '', testCase: 'Test on [1,2,3]' },
      { passed: true, isError: false, logs: '', testCase: 'Test on [1,2,3] with 0' },
      { passed: true, isError: false, logs: '', testCase: 'Test on [] with 3' },
    ],
  },
  {
    students: ['student2@codepost.io', 'student7@codepost.io'],
    tests: [
      { passed: true, isError: false, logs: '', testCase: 'Test on [1,2,3] with 3' },
      { passed: true, isError: false, logs: '', testCase: 'Test on []' },
      { passed: true, isError: false, logs: '', testCase: 'Test on [1]' },
      { passed: true, isError: false, logs: '', testCase: 'Test on [1,2,3]' },
      { passed: true, isError: false, logs: '', testCase: 'Test on [1,2,3] with 0' },
      {
        passed: false,
        isError: false,
        logs:
          'java.lang.ArrayIndexOutOfBoundsException: 0\n\tat RecursionUtils.containsHelper(RecursionUtils.java:51)\n\tat RecursionUtils.contains(RecursionUtils.java:40)\n\tat _test414.main(_test414.java:13)\n',
        testCase: 'Test on [] with 3',
      },
    ],
  },
  {
    students: ['student4@codepost.io', 'student9@codepost.io'],
    tests: [
      { passed: true, isError: false, logs: '', testCase: 'Test on []' },
      { passed: true, isError: false, logs: '', testCase: 'Test on [1]' },
      { passed: true, isError: false, logs: '', testCase: 'Test on [1,2,3]' },
      {
        passed: false,
        isError: false,
        logs:
          'java.lang.ArrayIndexOutOfBoundsException: 0\n\tat RecursionUtils.containsHelper(RecursionUtils.java:49)\n\tat RecursionUtils.contains(RecursionUtils.java:38)\n\tat _test414.main(_test414.java:13)\n',
        testCase: 'Test on [] with 3',
      },
      {
        passed: false,
        isError: false,
        logs:
          'No Result received.\nException in thread "main" java.lang.StackOverflowError\n\tat RecursionUtils.containsHelper(RecursionUtils.java:50)\n\tat RecursionUtils.containsHelper(RecursionUtils.java:50)\n\tat RecursionUtils.containsHelper(RecursionUtils.java:50)\n\tat RecursionUtils.containsHelper(RecursionUtils.java:50)\n\tat RecursionUtils.containsHelper(RecursionUtils.java:50)\n\tat RecursionUtils.containsHelper(RecursionUtils.java:50)\n\tat RecursionUtils.containsHelper(RecursionUtils.java:50)\n\tat RecursionUtils',
        testCase: 'Test on [1,2,3] with 3',
      },
      {
        passed: false,
        isError: false,
        logs:
          'No Result received.\nException in thread "main" java.lang.StackOverflowError\n\tat RecursionUtils.containsHelper(RecursionUtils.java:50)\n\tat RecursionUtils.containsHelper(RecursionUtils.java:50)\n\tat RecursionUtils.containsHelper(RecursionUtils.java:50)\n\tat RecursionUtils.containsHelper(RecursionUtils.java:50)\n\tat RecursionUtils.containsHelper(RecursionUtils.java:50)\n\tat RecursionUtils.containsHelper(RecursionUtils.java:50)\n\tat RecursionUtils.containsHelper(RecursionUtils.java:50)\n\tat RecursionUtils',
        testCase: 'Test on [1,2,3] with 0',
      },
    ],
  },
  {
    students: ['student3@codepost.io', 'student8@codepost.io'],
    tests: [
      { passed: true, isError: false, logs: '', testCase: 'Test on [1,2,3] with 3' },
      { passed: true, isError: false, logs: '', testCase: 'Test on []' },
      { passed: true, isError: false, logs: '', testCase: 'Test on [1]' },
      { passed: true, isError: false, logs: '', testCase: 'Test on [1,2,3] with 0' },
      {
        passed: false,
        isError: false,
        logs:
          'java.lang.ArrayIndexOutOfBoundsException: 0\n\tat RecursionUtils.containsHelper(RecursionUtils.java:51)\n\tat RecursionUtils.contains(RecursionUtils.java:40)\n\tat _test414.main(_test414.java:13)\n',
        testCase: 'Test on [] with 3',
      },
      {
        passed: false,
        isError: false,
        logs:
          'No Result received.\nException in thread "main" java.lang.StackOverflowError\n\tat RecursionUtils.sumHelper(RecursionUtils.java:32)\n\tat RecursionUtils.sumHelper(RecursionUtils.java:32)\n\tat RecursionUtils.sumHelper(RecursionUtils.java:32)\n\tat RecursionUtils.sumHelper(RecursionUtils.java:32)\n\tat RecursionUtils.sumHelper(RecursionUtils.java:32)\n\tat RecursionUtils.sumHelper(RecursionUtils.java:32)\n\tat RecursionUtils.sumHelper(RecursionUtils.java:32)\n\tat RecursionUtils.sumHelper(RecursionUtils.java:32)\n',
        testCase: 'Test on [1,2,3]',
      },
    ],
  },
];
