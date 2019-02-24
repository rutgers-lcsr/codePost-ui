import 'codemirror/mode/python/python';
import * as React from 'react';
import * as CodeMirror from 'react-codemirror';
import { Button } from 'react-md';
import { animateScroll as scroll } from 'react-scroll';
import LandingTopBar from './components/LandingTopBar';

import { ModalCarousel } from './components/Utils/ModalCarousel';

interface IState {
  viewPanelIndex: number;
  apiTabIndex: number;
}

const apiCodeExamples = [
  {
    title: 'Export grades',
    code:
      'import requests as r\nimport csv\n\n\
# Get all submissions for a given assignment\n\
submissions = r.get("https://api.codepost.io/assignments/%s/submissions/"% str(assignmentID), \
headers={"Authorization": "api_key"}).json()\n\n\
# Create a data structure for all graded assignments, i.e. sub["grade"] != null\n\
# Because this assignment has no partners, \
sub["students"] has only one element\n\
grades = [(sub["students"][0], sub["grade"]) for sub in submissions if sub["grade"]]\n\n\
# Export list of students and grades to a csv; Alternatively, can use an LMS API to post \
the grades directly to an LMS\n\
with open("grades.csv", "w") as writeFile:\n\
    writer = csv.writer(writeFile) \n\
    writer.writerows(grades)',
  },
  {
    title: 'Assign submission to graders',
    code:
      'import requests as r\n\
# We have already defined a mapping "studentToGrader" of {studentEmail: graderEmail}\n\n\
# Get all submissions for a given assignment\n\
submissions = r.get("https://api.codepost.io/assignments/%s/submissions/"% str(assignmentID), \
headers={"Authorization": "api_key"})\n\n\
for sub in submissions.json():\n\
  # What grader should grade this assignment?\n\
  graderEmail = studentToGrader[sub.students[0]]\n\
  # Assign the submisison to the grader\n\
  payload = {grader: graderEmail}\n\
  r.post("http://api.codepost.io/submissions/"% str(sub.id), headers={"Authorization": "api_key"}, payload=paylod )\n',
  },
  {
    title: 'Calculate the most common rubric items',
    code:
      'import requests as r\n\n\
# Get list of rubricComments for an assignment\n\
rubric = r.get("https://api.codepost.io/assignments/%s/rubric/" % str(assignmentID), headers=headers)\n\
rubricComments = rubric.json()["rubricComments"]\n\n\
# Create a list of (text, usage frequency) for every rubric comment\n\
_list = [(i["text"], i["comments"].length) for i in rubricComments]\n\n\
# Sort list by frequency\n\
_list.sort((key=lambda tup: tup[1]))\n\
# Print out result\n\
print("Rubric comments sorted by  highest frequency: %s" str(_list))',
  },
];

const adminCarouselContent = [
  {
    imgLink: require('./img/landing/landing-admin_assignments.png'),
    text: 'Keep track of all assignments, including real-time data on statistics..',
  },
  {
    imgLink: require('./img/landing/landing-admin_rubric.png'),
    text: 'Maintain standard rubrics, to be used as a scoring guideline by graders.',
  },
  {
    imgLink: require('./img/landing/landing-admin_roster.png'),
    text: 'Manage the course roster of students, graders, administrators, and sections.',
  },
];

const studentPanelText =
  'Access clear and comprehensive feedback to continue improving. \
Easily reference throughout the course and before interviews.';

const graderPanelText = 'Grade better, more consistently, and more quickly.';

class Landing extends React.Component<{}, IState> {
  public state: Readonly<IState> = {
    viewPanelIndex: 0,
    apiTabIndex: 0,
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
          <img className="PanelViews__content__image" src={require('./img/landing/landing-student.png')} />
        );
        viewPanelTitle = studentPanelText;
        break;
    }

    const codeMirror = (
      <CodeMirror
        key={`codeMirror${apiTabIndex}`}
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
          <div className="Hero__Description col-md-5">
            <div className="Hero__logo">
              code<b>Post</b>
            </div>
            <div className="Hero__Description__head">The easy, free Code Review platform for University CS Courses</div>
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
              Meet us at SIGSCE 2019!
            </div>
          </div>
        </div>
        <div className="Gradient">
          <div className="PanelViews">
            <div className="PanelViews__title">How it works</div>
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
                    What a student sees
                  </div>
                </div>
                <div
                  className={`PanelViews__tabBox__button${viewPanelIndex === 2 ? '--active' : ''}`}
                  onClick={this.changePanelIndex.bind(this, 2)}
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
            <div className="API__textBox__title">codePost API</div>
            <div className="API__textBox__itemList">
              <div className="API__textBox__item">
                We know that each CS course has its own unique needs, tools, and processes. In that spirit, we've built
                the codePost API. It's very powerful and flexible, allowing you to manage your course programmatically,
                integrate with any existing LMS or homegrown solutions, and develop custom analytics. It's easy to use -
                you can start building powerful scripts in minutes!
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
            <div className="stats col-md-4 text-center">
              30,000+
              <div className="stats subtext text-center">submissions graded</div>
            </div>
            <div className="stats col-md-4 text-center">
              3,000+
              <div className="stats subtext text-center">students</div>
            </div>
            <div className="stats col-md-4 text-center">
              20+
              <div className="stats subtext text-center">courses managed</div>
            </div>
          </div>
        </div>
        <div className="SignUp" id="SignUp">
          <div className="SignUpContainer">
            <div className="SignUpContainer__text">Get started with codePost by signing up</div>
            <div className="SignUpContainer__buttons">
              <Button
                href="/signup/staff"
                key="CourseStaffSignUp"
                className="LandingBtn-SignUp"
                primary={true}
                flat={true}
              >
                Course Staff
              </Button>
              <Button
                href="/signup/student"
                key="StudentSignUp"
                className="LandingBtn-SignUp"
                primary={true}
                flat={true}
              >
                Students
              </Button>
            </div>
          </div>
        </div>
        <div className="About" />
      </div>
    );
  }
}

export default Landing;
