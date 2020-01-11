/* react imports */
import React, { useState } from 'react';

/* library imports */
import { Button, Modal, Select, Icon, Tooltip, Table } from 'antd';

import { TestCategoryType } from '../../../../../../infrastructure/testCategory';

interface IProps {
  populateDefinition: (template: string) => void;
  language: string;
}

const dataSource = [
  {
    key: '1',
    test: 'Check if code compiles',
    code: `javac *.java && TestOutput true "Compiled!" || TestOutput false "Didn't compile."`,
  },
  {
    key: '2',
    test: 'Check for keyword in output',
    code: `result=$(java files.HelloWorld)
if echo $result | grep "Hello World"
    then
        TestOutput true "good job!"
    else
        TestOutput false "Wrong result: Expected Hello World. $result provided"
fi`,
  },
];

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

export const TemplateSelector = (props: IProps) => {
  /******************************* State Variables ****************************/
  const [visible, setVisible] = useState(false);

  /******************************* State Change Functions ****************************/
  const toggleVisible = () => {
    setVisible(!visible);
  };

  const selectAndClose = (code: string) => {
    props.populateDefinition(code);
    setVisible(false);
  };

  const data = dataSource.map((el) => {
    return { ...el, select: <Button onClick={() => selectAndClose(el.code)}>Select</Button> };
  });

  /******************************* Return *****************************************/
  return (
    <React.Fragment>
      <Button onClick={toggleVisible} style={{ height: 28, fontSize: 12, padding: '0px 9px' }}>
        Choose from template
      </Button>
      <Modal
        visible={visible}
        title={'Select from a template below'}
        onCancel={toggleVisible}
        width={700}
        footer={[
          <Button key="cancel" onClick={toggleVisible}>
            Cancel
          </Button>,
        ]}
      >
        <Table dataSource={data} columns={columns} pagination={false} />
      </Modal>
    </React.Fragment>
  );
};
