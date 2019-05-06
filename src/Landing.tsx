import 'codemirror/mode/clike/clike';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/python/python';

import * as React from 'react';
import * as CodeMirror from 'react-codemirror';

import { Button } from 'react-md';
import { animateScroll as scroll } from 'react-scroll';
import LandingTopBar from './components/LandingTopBar';

import { ModalCarousel } from './components/Utils/ModalCarousel';
import Footer from './Footer';

interface IState {
  viewPanelIndex: number;
  apiTabIndex: number;
  whyBoxTabIndex: number;
}

const apiCodeExamples = [
  {
    title: 'Export grades',
    code:
      'import requests as r\nimport csv\n\n\
# Get all submissions for a given assignment\n\
submissions = r.get("https://api.codepost.io/assignments/%s/submissions/" % str(assignmentID), \
headers={"Authorization": "api_key"}).json()\n\n\
# Identify graded submissions \n\
grades = [(sub["students"][0], sub["grade"]) for sub in submissions if sub["grade"]]\n\n\
# Export list of students and grades to a csv (alternatively, use your LMS\'s API to post \
grades directly) \n\
with open("grades.csv", "w") as writeFile:\n\
    writer = csv.writer(writeFile) \n\
    writer.writerows(grades)',
  },
  {
    title: 'Assign submissions for review',
    code:
      'import requests as r\n\
\n\
# Let graderMap map student emails to the grader who should review their work\n\n\
# Get all submissions for an assignment\n\
submissions = r.get("https://api.codepost.io/assignments/%s/submissions/" % str(assignmentID), \
headers={"Authorization": "api_key"})\n\n\
for sub in submissions.json():\n\
  # Who should grade should grade this assignment?\n\
  graderEmail = graderMap[sub.students[0]]\n\
  \n\
  # Assign the submisison to the grader\n\
  payload = {grader: graderEmail}\n\
  r.post("http://api.codepost.io/submissions/" % str(sub.id), headers={"Authorization": "api_key"}, payload=payload)\n',
  },
  {
    title: 'Identify common student errors',
    code:
      'import requests as r\n\n\
# Get an assignment\'s rubric\n\
rubric = r.get("https://api.codepost.io/assignments/%s/rubric/" % str(assignmentID), headers=headers)\n\
rubricComments = rubric.json()["rubricComments"]\n\n\
# Create a list of (text, usage frequency) for every rubric comment\n\
_list = [(i["text"], i["comments"].length) for i in rubricComments]\n\n\
# Sort list by frequency\n\
_list.sort((key=lambda tup: tup[1]))\n\
\n\
print("Rubric comments sorted by  highest frequency: %s" % str(_list))',
  },
];

const adminCarouselContent = [
  {
    imgLink: require('./img/landing/landing-admin_assignments.png'),
    text: 'Keep track of your assignments to make sure every submission gets reviewed.',
  },
  {
    imgLink: require('./img/landing/landing-admin_rubric.png'),
    text: 'Create standard assignment rubrics. ',
  },
  {
    imgLink: require('./img/landing/landing-admin_roster.png'),
    text: 'Manage your course roster from within codePost.',
  },
];

const studentPanelText =
  'Students use a simple UI to view their reviewed code and grades, \
  accessible and referencible during and after a course.';

const gradersPanelText = 'Manage and audit a team of graders.';

const graderPanelText =
  'Effortlessly annotate student code, with both custom feedback and standard assignment rubrics.';

class Landing extends React.Component<{}, IState> {
  public state: Readonly<IState> = {
    viewPanelIndex: 0,
    apiTabIndex: 0,
    whyBoxTabIndex: 0,
  };

  public scrollToBottom = () => {
    scroll.scrollToBottom();
  };

  public componentDidMount() {
    // Calendly widget setup
    const head = document.querySelector('head');
    const script = document.createElement('script');
    script.setAttribute('src', 'https://assets.calendly.com/assets/external/widget.js');
    const link = document.createElement('link');
    link.setAttribute('href', 'https://assets.calendly.com/assets/external/widget.css');
    link.setAttribute('rel', 'stylesheet');
    head!.appendChild(script);
    head!.appendChild(link);

    const calendlyDiv = document.getElementById('calendly-button');
    calendlyDiv!.setAttribute('onclick', "Calendly.showPopupWidget('https://calendly.com/codepost/');return false;");
  }

  public changePanelIndex = (newIndex: number) => {
    this.setState({ viewPanelIndex: newIndex });
  };

  public changeAPITabIndex = (newIndex: number) => {
    this.setState({ apiTabIndex: newIndex });
  };

  public changeWhyBoxTabIndex = (newIndex: number) => {
    this.setState({ whyBoxTabIndex: newIndex });
  };

  public render() {
    const { viewPanelIndex, apiTabIndex } = this.state;

    const dummy = () => {
      return;
    };
    const adminCarousel = (
      <ModalCarousel
        closeModal={dummy}
        isVisible={true}
        content={adminCarouselContent}
        defaultIndex={0}
        isModal={false}
        className="landing-carousel"
        onlyImage={true}
        demoCreated={false}
      />
    );

    let viewPanelContent;
    let viewPanelTitle;
    switch (viewPanelIndex) {
      case 0:
        viewPanelContent = (
          <img className="PanelViews__content__image" src={require('./img/landing/landing-grade.png')} />
        );
        viewPanelTitle = graderPanelText;
        break;
      case 1:
        viewPanelTitle = '     ';
        viewPanelContent = adminCarousel;
        break;
      case 2:
        viewPanelContent = (
          <img className="PanelViews__content__image" src={require('./img/landing/landing-graders.png')} />
        );
        viewPanelTitle = gradersPanelText;
        break;
      case 3:
        viewPanelContent = (
          <img className="PanelViews__content__image" src={require('./img/landing/landing-student.png')} />
        );
        viewPanelTitle = studentPanelText;
        break;
    }

    const badCodeMirror = (
      <CodeMirror
        key={'bad code'}
        className="bad-codemirror"
        value={
          '// Test whether array contains an element \n\
public boolean contains(int[] x, int y) {\n\n\
  boolean foundItem = false;\n\
  for (int i = 0; i < x.length; i++) {\n\
   if (x[i] == y) {\n\
     foundItem = !foundItem;\n\
   }\n\
  }\n\n\
  // Return finding \n\
  if (foundItem) {\n\
    return true;\n\
  } else {\n\
    return false;\n\
  }\n\
}\n\n\
/***************************************/\n\
// Passed 1/2 Tests.\n\
// Test 1: array = [1, 2, 3], target = 2\n\
// PASSED\n\
// Test 2: array = [1, 2, 2], target = 2\n\
// FAILED\n'
        }
        options={{ lineNumbers: true, readOnly: true, lineWrapping: true, mode: 'javascript' }}
      />
    );

    const codeMirror = (
      <CodeMirror
        key={`codeMirror${apiTabIndex}`}
        className="api-codemirror"
        value={apiCodeExamples[apiTabIndex].code}
        options={{ lineNumbers: true, readOnly: true, lineWrapping: true, mode: 'python' }}
      />
    );

    return (
      <div className="Landing">
        <LandingTopBar />

        <div className="topbar--Landing__spacing" />
        <div className="Hero-background" />
        <div className="Hero">
          <div className="Hero__Description">
            <div className="Hero__logo">
              code<b>Post</b>
            </div>
            <div className="Hero__Description__head">
              The easy, free <small className="Hero__Description__code">code review</small> platform for undergrad CS
              courses
            </div>
            <div className="Hero__Description__text">
              Save time and give better feedback on coding assignments, while providing insights into how your students
              are doing.
            </div>
          </div>
          <div className="Hero__callToAction-container">
            <Button
              key="SignUp"
              className="Hero__callToAction-container__signUp"
              onClick={this.scrollToBottom}
              flat={true}
            >
              Sign Up
            </Button>
            <div className="Hero__callToAction-container__calendly" id="calendly-button">
              Schedule a demo
            </div>
          </div>
        </div>
        <div className="Gradient">
          <div className="WhyBox">
            <div className="WhyBox__textBox">
              <div className="WhyBox__textBox__title">Code review = better feedback</div>
              <div className="WhyBox__textBox__itemList">
                <div className="WhyBox__textBox__item">
                  Autograding can tell your students whether their code is correct, but
                  <ul>
                    <li> Autograder output without context is confusing</li>
                    <li> Bad code can still pass correctness tests</li>
                  </ul>
                  Reading and annotating student code can be tedious, especially if you teach a huge course. codePost
                  integrates with your existing tools (autograder, LMS) to make it easy, so you can give students better
                  feedback without the hassle.
                </div>
              </div>
            </div>
            <div className="WhyBox__buttons">
              <Button
                className={`"WhyBox__button${this.state.whyBoxTabIndex === 1 ? '--active' : ''}`}
                primary={true}
                flat={this.state.whyBoxTabIndex ? true : false}
                raised={this.state.whyBoxTabIndex ? false : true}
                onClick={this.changeWhyBoxTabIndex.bind(this, 0)}
              >
                With code review
              </Button>
              <Button
                className={`"WhyBox__button${this.state.whyBoxTabIndex === 1 ? '--active' : ''}`}
                primary={true}
                flat={this.state.whyBoxTabIndex ? false : true}
                raised={this.state.whyBoxTabIndex ? true : false}
                onClick={this.changeWhyBoxTabIndex.bind(this, 1)}
              >
                No code review
              </Button>
            </div>
            <div className="WhyBox__exampleBox">
              <div className={`WhyBox__exampleBox__highlights${this.state.whyBoxTabIndex ? '--hidden' : ''}`}>
                <div className="WhyBox__exampleBox__highlight1">&nbsp;</div>
                <div className="WhyBox__exampleBox__highlight2">&nbsp;</div>
                <div className="WhyBox__exampleBox__highlight3">&nbsp;</div>
              </div>
              <div className={`WhyBox__exampleBox__code${this.state.whyBoxTabIndex ? '--expand' : ''}`}>
                {badCodeMirror}
              </div>
              <div className={`WhyBox__exampleBox__comments${this.state.whyBoxTabIndex ? '--hidden' : ''}`}>
                <div className="WhyBox__exampleBox__comment1">What about arr and el instead of x and y?</div>
                <div className="WhyBox__exampleBox__comment2">
                  This is why you're failing test 2. You can stop looking through the array once you've found the
                  target!
                </div>
                <div className="WhyBox__exampleBox__comment3">
                  You can just return foundItem (in fact, you can return it from within the for loop).
                </div>
              </div>
            </div>
          </div>
          <div className="PanelViews">
            <div className="PanelViews__title">How codePost works</div>
            <div className="PanelViews__separatorBox">
              <div className="PanelViews__separator" />
            </div>
            <div className="PanelViews__tabContainer">
              <div className="PanelViews__tabBox">
                <div className="PanelViews__tabBox__titleBox">
                  <div
                    className={`PanelViews__tabBox__title${viewPanelIndex === 0 ? '--active' : ''}`}
                    onClick={this.changePanelIndex.bind(this, 0)}
                  >
                    Review code
                  </div>
                </div>
                <div
                  className={`PanelViews__tabBox__button${viewPanelIndex === 0 ? '--active' : ''}`}
                  onClick={this.changePanelIndex.bind(this, 0)}
                />
              </div>
              <div className="PanelViews__tabBox">
                <div className="PanelViews__tabBox__titleBox">
                  <div
                    className={`PanelViews__tabBox__title${viewPanelIndex === 1 ? '--active' : ''}`}
                    onClick={this.changePanelIndex.bind(this, 1)}
                  >
                    Manage course
                  </div>
                </div>
                <div
                  className={`PanelViews__tabBox__button${viewPanelIndex === 1 ? '--active' : ''}`}
                  onClick={this.changePanelIndex.bind(this, 1)}
                />
              </div>
              <div className="PanelViews__tabBox">
                <div className="PanelViews__tabBox__titleBox">
                  <div
                    className={`PanelViews__tabBox__title${viewPanelIndex === 2 ? '--active' : ''}`}
                    onClick={this.changePanelIndex.bind(this, 2)}
                  >
                    Manage graders
                  </div>
                </div>
                <div
                  className={`PanelViews__tabBox__button${viewPanelIndex === 2 ? '--active' : ''}`}
                  onClick={this.changePanelIndex.bind(this, 2)}
                />
              </div>
              <div className="PanelViews__tabBox">
                <div className="PanelViews__tabBox__titleBox">
                  <div
                    className={`PanelViews__tabBox__title${viewPanelIndex === 3 ? '--active' : ''}`}
                    onClick={this.changePanelIndex.bind(this, 3)}
                  >
                    What a student sees
                  </div>
                </div>
                <div
                  className={`PanelViews__tabBox__button${viewPanelIndex === 3 ? '--active' : ''}`}
                  onClick={this.changePanelIndex.bind(this, 3)}
                />
              </div>
            </div>
          </div>
          <div className="PanelViews__content">
            <div className="PanelViews__content__title">{viewPanelTitle}</div>
            {viewPanelContent}
          </div>
        </div>
        <div className="API-backgroundWrapper">
          <div className="API-background" />
        </div>
        <div className="API">
          <div className="API__textBox">
            <div className="API__textBox__title">
              Run your course with code<p>Post API</p>
            </div>
            <div className="API__textBox__itemList">
              <div className="API__textBox__item">
                We know that each CS course has its own unique requirements, tools, and processes. We also think the
                best run courses are managed with code. In that spirit, we've built the <b>codePost API</b>. It's
                expressive and composable, and allows you to manage your course programmatically, integrate with other
                software (like an LMS or homegrown solutions), and perform analytics on your course data. It's also easy
                to use - you can start building powerful scripts in less than 10 minutes!
              </div>
            </div>
          </div>
          <div className="API__exampleBox">
            <div className="API__exampleBox__code">{codeMirror}</div>
            <div className="API__exampleBox__buttons">
              <div className="API__exampleBox__buttons-title">API examples:</div>
              <Button
                onClick={this.changeAPITabIndex.bind(this, 0)}
                className={`LandingAPIBtn${apiTabIndex === 0 ? '--active' : ''}`}
                flat={true}
              >
                {apiCodeExamples[0].title}
              </Button>
              <Button
                onClick={this.changeAPITabIndex.bind(this, 1)}
                className={`LandingAPIBtn${apiTabIndex === 1 ? '--active' : ''}`}
                flat={true}
              >
                {apiCodeExamples[1].title}
              </Button>
              <Button
                onClick={this.changeAPITabIndex.bind(this, 2)}
                className={`LandingAPIBtn${apiTabIndex === 2 ? '--active' : ''}`}
                flat={true}
              >
                {apiCodeExamples[2].title}
              </Button>
              <div className="API__exampleBox__code-separator" />
              <Button
                key="APIDocs"
                href="http://docs.codepost.io"
                target="_blank"
                className="LandingAPIBtn--docs"
                flat={true}
              >
                Full API docs
              </Button>
            </div>
          </div>
        </div>
        <div className="Numbers">
          <div className="stats">
            <div className="stats__text">
              30,000+
              <div className="stats__subtext">submissions graded</div>
            </div>
            <div className="stats__text">
              3,000+
              <div className="stats__subtext">students</div>
            </div>
            <div className="stats__text">
              20+
              <div className="stats__subtext">courses managed</div>
            </div>
          </div>
        </div>
        <div className="SignUp" id="SignUp">
          <div className="SignUpContainer">
            <div className="SignUpContainer__title">
              Get started with code<b>Post</b>
            </div>
            <div className="SignUpContainer__text">Sign up as...</div>
            <div className="SignUpContainer__buttons">
              <Button
                href="/signup/staff"
                key="CourseStaffSignUp"
                className="LandingBtn-SignUp--left"
                primary={true}
                flat={true}
              >
                Course Staff
              </Button>
              <Button
                href="/signup/student"
                key="StudentSignUp"
                className="LandingBtn-SignUp--right"
                primary={true}
                flat={true}
              >
                Students
              </Button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }
}

export default Landing;
