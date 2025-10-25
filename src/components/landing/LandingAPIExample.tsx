import { ApiOutlined, ArrowRightOutlined, BarChartOutlined, ExportOutlined, TeamOutlined } from '@ant-design/icons';
import { Collapse, Divider } from 'antd';

import * as React from 'react';
import withWindowWatcher, { IWithWindowWatcherProps } from '../core/withWindowWatcher';

import landingVars from '../../styles/pages/_landingVars';

// import * as CodeMirror from 'react-codemirror';

// import { Controlled as CodeMirror } from 'react-codemirror2';

// import 'codemirror/mode/python/python';
import CPButton from '../core/CPButton';
import Editor from '@monaco-editor/react';

/* eslint-disable no-multi-str */
const apiCodeExamples = [
  {
    title: 'Export grades',
    code: 'import csv\n\
import codepost\n\
\n\
codepost.configure_api_key("<your API key>")\n\
\n\
# Get all submissions for an assignment with id of 1\n\
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
  writer.writerows(grades)',
  },
  {
    title: 'Assign submissions for review',
    code: 'import codepost\n\
\n\
codepost.configure_api_key("<your API key>")\n\
\n\
# Map for who grades what:\n\
grader_map = {\n\
  "student1@university.edu": "grader1@university.edu",\n\
  "student2@university.edu": "grader1@university.edu",\n\
  "student3@university.edu": "grader2@university.edu",\n\
  "student4@university.edu": "grader1@university.edu",\n\
  # ...\n\
}\n\
\n\
# Get all submissions for an assignment with id of 1\n\
submissions = codepost.assignment.list_submissions(id=1)\n\
\n\
# Assign the submissions to graders\n\
for submission in submissions:\n\
\n\
# Determine who should grade this submission\n\
grader_email = grader_map.get(submission.students[0],\n\
  "defaultGrader@university.edu")\n\
\n\
# Assign grader to submission\n\
codepost.submission.update(\n\
  id=submission.id,\n\
  grader=grader_email,\n\
)',
  },
  {
    title: 'Identify common student errors',
    code: 'import codepost\n\
\n\
codepost.configure_api_key("<your API key>")\n\
\n\
# Get rubric of assignment with id of 1\n\
assignment = codepost.assignment.retrieve(id=1)\n\
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
  print(_freq_list)',
  },
];
/* eslint-enable no-multi-str */

interface IState {
  exampleIndex: number;
}

// @ts-expect-error CodeMirror types may not be fully compatible
let instance: CodeMirror.Editor | null = null;
// @ts-expect-error CodeMirror types may not be fully compatible
const setEditor = (editor: CodeMirror.Editor) => {
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
    // const codeMirror = (
    // <CodeMirror
    //   key={`codeMirror${this.state.exampleIndex}`}
    //   className="api-codemirror"
    //   onBeforeChange={dummyFunction}
    //   editorDidMount={setEditor}
    //   value={apiCodeExamples[this.state.exampleIndex].code}
    //   options={{
    //     lineNumbers: true,
    //     readOnly: true,
    //     lineWrapping: true,
    //     mode: 'python',
    //     theme: 'material',
    //   }}
    // />
    // );

    const customPanelStyle = {
      background: 'rgb(38, 50, 56, 0.95)',
      borderRadius: 8,
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
        <Editor
          height="80vh"
          defaultValue={apiCodeExamples[this.state.exampleIndex].code}
          theme="vs-dark"
          options={{ readOnly: true, minimap: { enabled: false } }}
        />
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
          width: '100%',
        }}
        className="display-flex flex-direction-column align-items-flex-start"
      >
        <span
          style={{
            position: 'absolute',
            width: '100%',
            height: 38,
            top: 5,
            background: 'white',
            zIndex: 0,
            borderRadius: 5,
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
          icon={<ExportOutlined />}
        >
          {apiCodeExamples[0].title}
        </CPButton>
        <CPButton
          onClick={this.changeAPITabIndex.bind(this, 1)}
          style={exampleIndex === 1 ? selectedStyle : unSelectedStyle}
          className={exampleIndex === 1 ? '' : 'apiexample__link'}
          cpType="link"
          icon={<TeamOutlined />}
        >
          {apiCodeExamples[1].title}
        </CPButton>
        <CPButton
          onClick={this.changeAPITabIndex.bind(this, 2)}
          style={exampleIndex === 2 ? selectedStyle : unSelectedStyle}
          className={exampleIndex === 2 ? '' : 'apiexample__link'}
          cpType="link"
          icon={<BarChartOutlined />}
        >
          {apiCodeExamples[2].title}
        </CPButton>
        <Divider type="horizontal" style={{ margin: '16px 0px' }} />
        <CPButton
          key="APIDocs"
          href="http://docs.codepost.io/reference"
          target="_blank"
          cpType="link"
          style={{ fontWeight: 600, fontSize: 18 }}
          className="apiexample__docs"
        >
          Full API reference
          <ArrowRightOutlined className="apiexample__docs__arrow" />
        </CPButton>
      </div>
    );

    return (
      <div id="APIExample" style={{ width: '100%' }}>
        <Collapse
          bordered={false}
          items={[
            {
              key: '1',
              label: (
                <div className="apiexample__header display-flex justify-content-space-between">
                  <div>Think we were joking about short scripts? Click here</div>
                  <ApiOutlined className="apiexample__header__icon" />
                </div>
              ),
              children: (
                <div
                  style={{
                    fontSize: 12,
                  }}
                  className={`display-flex flex-direction-${
                    this.props.windowwidth < landingVars.breakpoints.verticalPanels ? 'column' : 'row'
                  } align-items-${this.props.windowwidth < landingVars.breakpoints.verticalPanels ? 'center' : 'start'}`}
                >
                  {this.props.windowwidth < landingVars.breakpoints.verticalPanels ? buttons : codebox}
                  {this.props.windowwidth < landingVars.breakpoints.verticalPanels ? codebox : buttons}
                </div>
              ),
              style: customPanelStyle,
            },
          ]}
        />
      </div>
    );
  }
}

export default withWindowWatcher(APIExample);
