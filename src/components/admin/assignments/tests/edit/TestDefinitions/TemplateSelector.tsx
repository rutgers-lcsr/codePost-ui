/* react imports */
import React, { useState } from 'react';

/* library imports */
import { Button, Modal, Table } from 'antd';
import Editor from '@monaco-editor/react';

interface IProps {
  populateDefinition: (template: string) => void;
  language: string;
}

/************************************************************************************/
/* Test definitions go here
/************************************************************************************/

const dataSource = [
  {
    key: '1',
    test: 'Check if code compiles',
  },
  {
    key: '2',
    test: 'Check for keyword in output',
  },
  {
    key: '3',
    test: 'Compare to solution code',
  },
];

/* eslint-disable no-useless-computed-key */
const codeMap: { [id: string]: any } = {
  '1': {
    java: `javac *.java && TestOutput true "Compiled!" || TestOutput false "Didn't compile"`,
    ['c/c++']: `g++ -o hello hello.cpp && TestOutput true "Compiled!" || TestOutput false "Didn't compile"`,
  },
  '2': {
    java: `result=$(java HelloWorld)
if echo $result | grep "world"
    then
        TestOutput true "good job!"
    else
        TestOutput false "Couldn't find 'world' in output"
fi`,
    ['c/c++']: `result=$(./HelloWorld)
if echo $result | grep "world"
    then
        TestOutput true "good job!"
    else
        TestOutput false "Couldn't find 'world' in output"
fi`,
    ['python-3.7']: `result=$(python HelloWorld.py)
if echo $result | grep "world"
    then
        TestOutput true "good job!"
    else
        TestOutput false "Couldn't find 'world' in output"
fi`,
    ['python-2.7']: `result=$(python HelloWorld.py)
if echo $result | grep "world"
    then
        TestOutput true "good job!"
    else
        TestOutput false "Couldn't find 'world' in output"
fi`,
  },
  '3': {
    java: `studentValue=$(java HelloWorld)

# you must upload solution code as helper files to run alongside student code
solutionValue=$(java solution/HelloWorld)

if [ "$studentValue" == "$solutionValue" ]
    then
        TestOutput true "good job!"
    else
        TestOutput false "Didn't match solution"
fi`,
    ['c/c++']: `studentValue=$(./HelloWorld)

# you must upload solution code as helper files to run alongside student code
solutionValue=$(./solution/HelloWorld)

if [ "$studentValue" == "$solutionValue" ]
    then
        TestOutput true "good job!"
    else
        TestOutput false "Didn't match solution"
fi`,
    ['python-3.7']: `studentValue=$(python HelloWorld.py)

# you must upload solution code as helper files to run alongside student code
solutionValue=$(python solution/HelloWorld.py)

if [ "$studentValue" == "$solutionValue" ]
    then
        TestOutput true "good job!"
    else
        TestOutput false "Didn't match solution"
fi`,
    ['python-2.7']: `studentValue=$(python HelloWorld.py)

# you must upload solution code as helper files to run alongside student code
solutionValue=$(python solution/HelloWorld.py)

if [ "$studentValue" == "$solutionValue" ]
    then
        TestOutput true "good job!"
    else
        TestOutput false "Didn't match solution"
fi`,
  },
};
/* eslint-enable no-useless-computed-key */

/************************************************************************************/

const columns = [
  {
    title: 'Test',
    dataIndex: 'test',
    key: 'test',
  },
  {
    title: 'Select',
    dataIndex: 'select',
    key: 'select',
  },
];

/************************************************************************************/

export const TemplateSelector = (props: IProps) => {
  const [visible, setVisible] = useState(false);

  const toggleVisible = () => {
    setVisible(!visible);
  };

  const selectAndClose = (code: string) => {
    props.populateDefinition(code);
    setVisible(false);
  };

  // If the container's language isn't specified, default to java templates
  const data = dataSource
    .map((el) => {
      const code = codeMap[el.key][props.language === 'other' ? 'java' : props.language];
      return {
        ...el,
        select: <Button onClick={() => selectAndClose(code)}>Select</Button>,
        code,
      };
    })
    .filter((el) => el.code);

  const expandedRowRender = (record: any, _index: number, _indent: any, _expanded: boolean) => {
    const columns = [{ title: `Code`, dataIndex: 'code', key: 'code' }];
    const data = [
      {
        code: (
          <Editor
            height="200px"
            language={props.language === 'other' ? 'java' : props.language}
            value={record.code}
            theme="vs-dark"
            options={{
              readOnly: true,
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
            }}
          />
        ),
      },
    ];
    return <Table columns={columns} dataSource={data} pagination={false} />;
  };

  /******************************* Return *****************************************/
  return (
    <React.Fragment>
      <Button type="primary" onClick={toggleVisible} style={{ height: 28, fontSize: 12, padding: '0px 9px' }}>
        Choose from template
      </Button>
      <Modal
        open={visible}
        title={'Select from a template below'}
        onCancel={toggleVisible}
        width={700}
        footer={[
          <Button key="cancel" onClick={toggleVisible}>
            Cancel
          </Button>,
        ]}
      >
        <Table dataSource={data} columns={columns} pagination={false} expandedRowRender={expandedRowRender} />
      </Modal>
    </React.Fragment>
  );
};
