/* Hello World submissions */
import hello_student0 from './demo_subs/hello/student0';
import hello_student1 from './demo_subs/hello/student1';
import hello_student2 from './demo_subs/hello/student2';
import hello_student3 from './demo_subs/hello/student3';
import hello_student4 from './demo_subs/hello/student4';
import hello_student5 from './demo_subs/hello/student5';
import hello_student6 from './demo_subs/hello/student6';
import hello_student7 from './demo_subs/hello/student7';
import hello_student8 from './demo_subs/hello/student8';
import hello_student9 from './demo_subs/hello/student9';

/* Loops submissions */
import loops_student0 from './demo_subs/loops/student0';
import loops_student1 from './demo_subs/loops/student1';
import loops_student2 from './demo_subs/loops/student2';
import loops_student3 from './demo_subs/loops/student3';
import loops_student4 from './demo_subs/loops/student4';

// /* Recursion submissions */
import recursion_student0 from './demo_subs/recursion/student0';
import recursion_student1 from './demo_subs/recursion/student1';
import recursion_student2 from './demo_subs/recursion/student2';
import recursion_student3 from './demo_subs/recursion/student3';
import recursion_student4 from './demo_subs/recursion/student4';

const helloSubs = (domain: string) => {
  return [
    hello_student0(domain),
    hello_student1(domain),
    hello_student2(domain),
    hello_student3(domain),
    hello_student4(domain),
    hello_student5(domain),
    hello_student6(domain),
    hello_student7(domain),
    hello_student8(domain),
    hello_student9(domain),
  ];
};

const loopSubs = (domain: string) => {
  return [
    loops_student0(domain),
    loops_student1(domain),
    loops_student2(domain),
    loops_student3(domain),
    loops_student4(domain),
  ];
};

const recursionSubs = (domain: string) => {
  return [
    recursion_student0(domain),
    recursion_student1(domain),
    recursion_student2(domain),
    recursion_student3(domain),
    recursion_student4(domain),
  ];
};

const demoSubmissions = (assignmentName: string, domain: string) => {
  if (assignmentName === 'Hello World') {
    return helloSubs(domain);
  } else if (assignmentName === 'Loops') {
    return loopSubs(domain);
  } else if (assignmentName === 'Recursion') {
    return recursionSubs(domain);
  }

  return [];
};

const demoCourse = (testName: string) => {
  return {
    name: testName,
    period: 'demo',
    id: -1, // codePost convention
    assignments: [], // ignored by API
    sections: [], // ignored by API
    sendReleasedSubmissionsToBack: false,
    showStudentsStatistics: false,
    timezone: 'US/Eastern',
    emailNewUsers: false,
    anonymousGradingDefault: false,
    allowGradersToEditRubric: false,
  };
};

const demoRoster = (orgEmail: string, courseID: number) => {
  const studentList = [
    `student0@${orgEmail}`,
    `student1@${orgEmail}`,
    `student2@${orgEmail}`,
    `student3@${orgEmail}`,
    `student4@${orgEmail}`,
    `student5@${orgEmail}`,
    `student6@${orgEmail}`,
    `student7@${orgEmail}`,
    `student8@${orgEmail}`,
    `student9@${orgEmail}`,
  ];

  const graderList = [
    `grader0@${orgEmail}`,
    `grader1@${orgEmail}`,
    `grader2@${orgEmail}`,
    `grader3@${orgEmail}`,
    `grader4@${orgEmail}`,
  ];

  return {
    id: courseID,
    students: studentList,
    graders: graderList,
  };
};

const demoSections = (orgEmail: string, courseID: number) => {
  return [
    {
      id: -1, // codePost convention
      name: 'Section 1',
      leaders: [`grader0@${orgEmail}`],
      students: [`student0@${orgEmail}`, `student1@${orgEmail}`, `student2@${orgEmail}`, `student3@${orgEmail}`],
      course: courseID,
    },
    {
      id: -1, // codePost convention
      name: 'Section 2',
      leaders: [`grader0@${orgEmail}`],
      students: [`student4@${orgEmail}`, `student5@${orgEmail}`, `student6@${orgEmail}`],
      course: courseID,
    },
    {
      id: -1, // codePost convention
      name: 'Section 3',
      leaders: [`grader1@${orgEmail}`],
      students: [`student7@${orgEmail}`, `student8@${orgEmail}`, `student9@${orgEmail}`],
      course: courseID,
    },
  ];
};

const demoAssignments = (courseID: number) => {
  return [
    {
      name: 'Hello World',
      sortKey: 0,
      points: 20,
      course: courseID,
      rubric: [
        {
          category: 'Correctness',
          cap: 5,
          comments: [
            {
              text: 'You printed out the wrong string!',
              points: 1,
            },
            {
              text: 'You forgot to print a newline at the end of your string!',
              points: 1,
            },
            {
              text: "You didn't print anything out!",
              points: 2,
            },
          ],
        },
      ],
    },
    {
      name: 'Loops',
      sortKey: 1,
      points: 20,
      course: courseID,
      rubric: [
        {
          category: 'Max',
          cap: 5,
          comments: [
            {
              text: 'Incorrectly initializes maximum element.',
              points: 1,
            },
            {
              text: "Doesn't correctly store max value.",
              points: 2,
            },
            {
              text: "Doesn't correctly loop through array.",
              points: 3,
            },
          ],
        },
        {
          category: 'Reverse',
          cap: 5,
          comments: [
            {
              text: 'Correct in-place merge: nice job!',
              points: -1,
            },
            {
              text: 'Incorrectly swaps elements on some inputs.',
              points: 2,
            },
            {
              text: "Doesn't correctly loop through array.",
              points: 3,
            },
          ],
        },
        {
          category: 'Contains',
          cap: 5,
          comments: [
            {
              text: 'Incorrectly splits array while searching.',
              points: -1,
            },
          ],
        },
      ],
    },
    {
      name: 'Recursion',
      sortKey: 3,
      points: 20,
      course: courseID,
      rubric: [
        {
          category: 'sum',
          cap: 5,
          comments: [
            {
              text: 'No base case',
              points: 1,
            },
            {
              text: 'Uses extra arrays',
              points: 1,
            },
            {
              text: "Doesn't gracefully handle length-0 arrays.",
              points: 1,
            },
          ],
        },
        {
          category: 'contains',
          cap: 5,
          comments: [
            {
              text: 'No base case',
              points: 1,
            },
            {
              text: 'Uses extra arrays',
              points: 1,
            },
          ],
        },
      ],
    },
  ];
};

export { demoCourse, demoRoster, demoSections, demoAssignments, demoSubmissions };
