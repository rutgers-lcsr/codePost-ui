// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { ApiOutlined, ArrowRightOutlined, BarChartOutlined, ExportOutlined, TeamOutlined } from '@ant-design/icons';
import { Collapse, Divider } from 'antd';

import * as React from 'react';
import withWindowWatcher, { IWithWindowWatcherProps } from '../core/withWindowWatcher';

import landingVars from '../../styles/pages/_landingVars';
import CPButton from '../core/CPButton';
import Editor from '@monaco-editor/react';

const apiCodeExamples = [
  {
    title: 'Export grades',
    code: `import csv
import codepost_api_client as codepost

config = codepost.Configuration(
    host="https://codepost-api.cs.rutgers.edu",
    api_key={"tokenAuth": "Token <API_KEY>"}
)

with codepost.ApiClient(config) as client:
    assignments_api = codepost.AssignmentsApi(client)

    # Get submissions for assignment 1
    subs = assignments_api.assignments_submissions_list(id=1)

    # Identify graded submissions
    grades = [
        (s.students[0], s.grade)
        for s in subs
        if s.grade is not None
    ]

# Export to CSV
with open("grades.csv", "w") as f:
    writer = csv.writer(f)
    writer.writerows(grades)`,
  },
  {
    title: 'Assign submissions for review',
    code: `import codepost_api_client as codepost

# ... setup config ...

grader_map = {
    "student1@u.edu": "ta1@u.edu",
    # ...
}

with codepost.ApiClient(config) as client:
    assign_api = codepost.AssignmentsApi(client)
    sub_api = codepost.SubmissionsApi(client)

    # Get submissions
    subs = assign_api.assignments_submissions_list(id=1)

    for s in subs:
        grader = grader_map.get(s.students[0], "default@u.edu")
        
        # Assign grader (PATCH update)
        sub_api.submissions_partial_update(
            id=s.id,
            patched_submission=codepost.PatchedSubmission(grader=grader)
        )
`,
  },
  {
    title: 'Identify common student errors',
    code: `import codepost_api_client as codepost

# ... setup config ...

with codepost.ApiClient(config) as client:
    assign_api = codepost.AssignmentsApi(client)
    cat_api = codepost.RubricCategoriesApi(client)
    com_api = codepost.RubricCommentsApi(client)

    # Get assignment
    assignment = assign_api.assignments_retrieve(id=1)

    # Iterate categories
    for cat_id in assignment.rubric_categories:
        cat = cat_api.rubric_categories_retrieve(cat_id)
        
        stats = []
        for com_id in cat.rubric_comments:
            com = com_api.rubric_comments_retrieve(com_id)
            stats.append((com.text, com.point_delta))
            
        # Print stats
        stats.sort(key=lambda x: x[1])
        print(f"Category: {cat.name}")
        for text, points in stats:
            print(f"  {points}pts: {text}")
`,
  },
];

interface IState {
  exampleIndex: number;
}

class APIExample extends React.PureComponent<IWithWindowWatcherProps, IState> {
  public constructor(props: IWithWindowWatcherProps) {
    super(props);
    this.state = {
      exampleIndex: 0,
    };
  }

  public changeAPITabIndex = (newIndex: number) => {
    this.setState({ exampleIndex: newIndex });
  };

  public render() {
    const { exampleIndex } = this.state;

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
        <Divider orientation="horizontal" style={{ margin: '16px 0px' }} />
        <CPButton
          key="APIDocs"
          href="https://codepost-api.cs.rutgers.edu/api/schema/elements/"
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
