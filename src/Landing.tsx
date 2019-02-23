import 'codemirror/mode/python/python';
import * as React from 'react';
import * as CodeMirror from 'react-codemirror';
import { Button } from 'react-md';
import LandingTopBar from './components/LandingTopBar';

interface IState {
  viewPanelIndex: number;
  apiTabIndex: number;
}

class Landing extends React.Component<{}, IState> {
  public state: Readonly<IState> = {
    viewPanelIndex: 0,
    apiTabIndex: 0,
  };

  public changePanelIndex = (newIndex: number) => {
    this.setState({ viewPanelIndex: newIndex });
  };

  public changeAPITabIndex = (newIndex: number) => {
    this.setState({ apiTabIndex: newIndex });
  };

  public render() {
    const { viewPanelIndex, apiTabIndex } = this.state;
    let viewPanelContent;
    let viewPanelTitle;
    switch (viewPanelIndex) {
      case 0:
        viewPanelContent = <img className="PanelViews__content__image" src={require('./img/student-landing.png')} />;
        viewPanelTitle = 'student__title';
        break;
      case 1:
        viewPanelContent = <img className="PanelViews__content__image" src={require('./img/grade-landing.png')} />;
        viewPanelTitle = 'grader__title';
        break;
      case 2:
        viewPanelContent = 'admin__placeholder';
        viewPanelTitle = 'admin__title';
        break;
    }
    const getAssignmentGrade =
      'import requests\nimport functools\n\n\
# Get all submissions for a given assignment\n\
submissions = requests.get("http://api.codepost.io/assignments/%s/submissions/"\
% str(assignmentID), headers={"Authorization": "api_key"})\n\
# Filter out ungraded submissions (grade == null)\n\
graded_submissions = [sub for sub in submissions if sub["grade"]]\n\n\
# Calculate and print average\n\
avg_grade = functools.reduce(lambda x,y: x + y["grade"], graded_submissions, 0) / len(graded_submissions)\n\
print("Average grade on this assignment is %s" % avg_grade)';
    const print = 'print 3';
    const hello = 'hello';

    let apiCodeExample;
    switch (apiTabIndex) {
      case 0:
        apiCodeExample = getAssignmentGrade;
        break;
      case 1:
        apiCodeExample = hello;
        break;
      case 2:
        apiCodeExample = print;
        break;
    }
    const codeMirror = (
      <CodeMirror
        key={`codeMirror${apiTabIndex}`}
        value={apiCodeExample}
        options={{ lineNumbers: true, readOnly: true, lineWrapping: true, mode: 'python' }}
      />
    );

    return (
      <div className="Landing">
        <LandingTopBar />
        <div className="topbar--Landing__spacing" />
        <div className="Hero-background" />
        <div className="Hero">
          <div className="Description col-md-5">
            <div className="logo">
              code<b>Post</b>
            </div>
            <div className="Description-head">The easy, free Code Review platform for University CS Courses</div>
            <div className="Description-text">
              Save time and give better feedback on coding assignments, while providing insights into how your students
              are doing.
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
                <div
                  className={`PanelViews__tabBox__title${viewPanelIndex === 0 ? '--active' : ''}`}
                  onClick={this.changePanelIndex.bind(this, 0)}
                >
                  Student
                </div>
                <div
                  className={`PanelViews__tabBox__button${viewPanelIndex === 0 ? '--active' : ''}`}
                  onClick={this.changePanelIndex.bind(this, 0)}
                />
              </div>
              <div className="PanelViews__tabBox">
                <div
                  className={`PanelViews__tabBox__title${viewPanelIndex === 1 ? '--active' : ''}`}
                  onClick={this.changePanelIndex.bind(this, 1)}
                >
                  Grader
                </div>
                <div
                  className={`PanelViews__tabBox__button${viewPanelIndex === 1 ? '--active' : ''}`}
                  onClick={this.changePanelIndex.bind(this, 1)}
                />
              </div>
              <div className="PanelViews__tabBox">
                <div
                  className={`PanelViews__tabBox__title${viewPanelIndex === 2 ? '--active' : ''}`}
                  onClick={this.changePanelIndex.bind(this, 2)}
                >
                  Admin
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
                Calculate assignment mean
              </Button>
              <Button
                onClick={this.changeAPITabIndex.bind(this, 1)}
                className={`LandingAPIBtn${apiTabIndex === 1 ? '--active' : ''}`}
                flat={true}
              >
                Print
              </Button>
              <Button
                onClick={this.changeAPITabIndex.bind(this, 2)}
                className={`LandingAPIBtn${apiTabIndex === 2 ? '--active' : ''}`}
                flat={true}
              >
                Hello
              </Button>
              <div className="API__exampleBox__code-separator" />
              <Button
                key="SignUp"
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
              <div className="stats subtext text-center">assignments graded</div>
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
              <Button href="/signup/staff" key="SignUp" className="LandingBtn-SignUp" primary={true} flat={true}>
                Course Staff
              </Button>
              <Button href="/signup/student" key="SignUp" className="LandingBtn-SignUp" primary={true} flat={true}>
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
