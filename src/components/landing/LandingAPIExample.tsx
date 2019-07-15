import { Collapse, Divider, Icon } from 'antd';
const Panel = Collapse.Panel;

import * as React from 'react';
import withWindowWatcher, { IWithWindowWatcherProps } from '../core/withWindowWatcher';

import landingVars from '../../styles/pages/_landingVars';

// import * as CodeMirror from 'react-codemirror';

import { Controlled as CodeMirror } from 'react-codemirror2';

import 'codemirror/mode/python/python';
import CPButton from '../core/CPButton';

const apiCodeExamples = [
  {
    title: 'Export grades',
    code:
    'import csv\n\
    import codepost\n\
    \n\
    codepost.configure_api_key("<your API key>")\n\
    \n\
    # Get all submissions for a given assignment\n\
    submissions = codepost.assignment.list_submissions(id=1)\n\
    \n\
    # Identify graded submissions\n\
    grades = [\n\
        (student, submission.grade)\n\
        for submission in submissions\n\
        for student in submission.students\n\
        if not submission.grade is None\n\
    ]\n\
    \n\
    # Export list of students and grades to a CSV\n\
    # (or use your LMS API to post grades directly)\n\
    with open("grades.csv", "w") as writeFile:\n\
        writer = csv.writer(writeFile)\n\
        writer.writerows(grades)\n\
    ',
  },
  {
    title: 'Assign submissions for review',
    code:
      'import codepost\n\
      \n\
      codepost.configure_api_key("<your API key>")\n\
      \n\
      # Map for who grades what:\n\
      grader_map = {\n\
          "student1@university.edu": "grader1@codepost.io",\n\
          "student2@university.edu": "grader1@codepost.io",\n\
          "student3@university.edu": "grader2@codepost.io",\n\
          "student4@university.edu": "grader1@codepost.io",\n\
          # ...\n\
      }\n\
      \n\
      # Get all submissions for an assignment\n\
      submissions = codepost.assignment.list_submissions(id=assignment_id)\n\
      \n\
      # Assign the submissions to graders\n\
      for submission in submissions:\n\
      \n\
          # Determine who should grade this submission\n\
          grader_email = grader_map.get(submission.students[0],\n\
              "defaultGrader@codepost.io")\n\
      \n\
          # Assign grader to submission\n\
          codepost.submission.update(\n\
              id=submission.id,\n\
              grader=grader_email,\n\
          )\n\
      \n\
      ',
  },
  {
    title: 'Identify common student errors',
    code:
      'import codepost\n\
      \n\
      codepost.configure_api_key("<your API key>")\n\
      \n\
      # Get an assignments rubric\n\
      assignment = codepost.assignment.retrieve(id=assignment_id)\n\
      rubric_categories = map(\n\
          lambda id: codepost.rubric_categories.retrieve(id=id),\n\
          assignment.rubricCategories\n\
      )\n\
      \n\
      # Print report for each category\n\
      for category in rubric_categories:\n\
          rubric_comments = map(\n\
              lambda id: codepost.rubric_comments.retrieve(id=id),\n\
              category.rubricComments\n\
          )\n\
      \n\
          _freq_list = [\n\
              (comment.text, comment.length)\n\
              for comment in rubric_comments\n\
          ]\n\
          _freq_list.sort(key=lambda tup: tup[1])\n\
      \n\
          print(category.name)\n\
          print("Rubric comments sorted by highest frequency")\n\
          print(_freq_list)\n\
      \n\
      ',
  },
];

interface IState {
  exampleIndex: number;
}

const dummyFunction = () => {
  return;
};

let instance: CodeMirror.Editor | null = null;
const setEditor = (editor: CodeMirror.Editor) => {
  console.log('instance set');
  instance = editor;
};

class APIExample extends React.PureComponent<IWithWindowWatcherProps, IState> {
  public constructor(props: IWithWindowWatcherProps) {
    super(props);
    this.state = {
      exampleIndex: 0,
    };
  }

  public changeAPITabIndex = (newIndex: number) => {
    this.setState({ exampleIndex: newIndex });
    setTimeout(() => {
      if (instance) {
        instance.refresh();
      }
    }, 1);
  };

  public render() {
    const { exampleIndex } = this.state;
    const codeMirror = (
      <CodeMirror
        key={`codeMirror${this.state.exampleIndex}`}
        className="api-codemirror"
        onBeforeChange={dummyFunction}
        editorDidMount={setEditor}
        value={apiCodeExamples[this.state.exampleIndex].code}
        options={{ lineNumbers: true, readOnly: true, lineWrapping: true, mode: 'python', theme: 'material' }}
      />
    );

    const customPanelStyle = {
      background: 'rgb(38, 50, 56, 0.95)',
      borderRadius: 24,
      color: 'white',
      fontSize: 20,
      paddingTop: 10,
      paddingBottom: 10,
      paddingRight: this.props.windowwidth < landingVars.breakpoints.mobile ? 5 : 20,
      paddingLeft: this.props.windowwidth < landingVars.breakpoints.mobile ? 5 : 20,
    };

    const selectedStyle = {
      zIndex: 3,
      color: 'rgb(38, 50, 56)',
      fontSize: 15,
      transition: 'color .3s',
      border: 'none',
      height: 38,
      marginTop: 5,
      marginBottom: 5,
    };
    const unSelectedStyle = {
      zIndex: 3,
      color: 'white',
      fontSize: 15,
      transition: 'color .3s',
      border: 'none',
      height: 38,
      marginTop: 5,
      marginBottom: 5,
    };

    const codebox = (
      <div
        style={{
          maxWidth: 600,
          width: '100%',
          minHeight: this.props.windowwidth < landingVars.breakpoints.mobile ? 0 : 390,
        }}
      >
        {codeMirror}
      </div>
    );

    const buttons = (
      <div
        style={{
          maxWidth: this.props.windowwidth < landingVars.breakpoints.verticalPanels ? 600 : 300,
          marginLeft: this.props.windowwidth < landingVars.breakpoints.verticalPanels ? 0 : 30,
          marginTop: this.props.windowwidth < landingVars.breakpoints.verticalPanels ? 20 : 0,
          marginBottom: this.props.windowwidth < landingVars.breakpoints.verticalPanels ? 20 : 0,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          alignItems: 'flex-start',
        }}
      >
        <span
          style={{
            position: 'absolute',
            width: '100%',
            height: 38,
            top: 5,
            background: 'white',
            zIndex: 0,
            borderRadius: 10,
            transition: '.3s',
            transform: `translateY(${
              exampleIndex === 1 ? 'calc(100% + 10px)' : exampleIndex === 2 ? 'calc(200% + 20px)' : '0%'
            })`,
          }}
        />
        <CPButton
          onClick={this.changeAPITabIndex.bind(this, 0)}
          style={exampleIndex === 0 ? selectedStyle : unSelectedStyle}
          className={exampleIndex === 0 ? '' : 'apiexample__link'}
          cpType="link"
          icon="export"
          ghost={true}
        >
          {apiCodeExamples[0].title}
        </CPButton>
        <CPButton
          onClick={this.changeAPITabIndex.bind(this, 1)}
          style={exampleIndex === 1 ? selectedStyle : unSelectedStyle}
          className={exampleIndex === 1 ? '' : 'apiexample__link'}
          cpType="link"
          icon="team"
          ghost={true}
        >
          {apiCodeExamples[1].title}
        </CPButton>
        <CPButton
          onClick={this.changeAPITabIndex.bind(this, 2)}
          style={exampleIndex === 2 ? selectedStyle : unSelectedStyle}
          className={exampleIndex === 2 ? '' : 'apiexample__link'}
          cpType="link"
          icon="bar-chart"
          ghost={true}
        >
          {apiCodeExamples[2].title}
        </CPButton>
        <Divider type="horizontal" style={{ margin: '16px 0px' }} />
        <CPButton
          key="APIDocs"
          href="http://help.codepost.io/reference"
          target="_blank"
          cpType="link"
          ghost={true}
          style={{ fontWeight: 600, fontSize: 18 }}
          className="apiexample__docs"
        >
          Full API reference
          <Icon type="arrow-right" className="apiexample__docs__arrow" />
        </CPButton>
      </div>
    );

    return (
      <div id="APIExample" style={{ width: '100%' }}>
        <Collapse bordered={false}>
          <Panel
            header={
              <div className="apiexample__header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>See the API in action</div>
                <Icon type="api" className="apiexample__header__icon" />
              </div>
            }
            key="1"
            style={customPanelStyle}
          >
            <div
              style={{
                fontSize: 12,
                display: 'flex',
                flexDirection: this.props.windowwidth < landingVars.breakpoints.verticalPanels ? 'column' : 'row',
                alignItems: this.props.windowwidth < landingVars.breakpoints.verticalPanels ? 'center' : 'start',
              }}
            >
              {this.props.windowwidth < landingVars.breakpoints.verticalPanels ? buttons : codebox}
              {this.props.windowwidth < landingVars.breakpoints.verticalPanels ? codebox : buttons}
            </div>
          </Panel>
        </Collapse>
      </div>
    );
  }
}

export default withWindowWatcher(APIExample);
