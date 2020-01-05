/* react imports */
import React, { useState } from 'react';

/* library imports */
import { Button, Input, Modal, Icon, Select, Row, Tooltip } from 'antd';

/* codePost object imports */
import { FILE_TYPE } from '../TestingSetup';

/* codePost util imports */
import useHotkeys, { M_KEY } from '../../../../../code-review/useHotkeys';
import { SOURCEFILE_TEMPLATE } from './testTemplates';

const { Option } = Select;
interface IUploadProps {
  addFile: (type: FILE_TYPE, name: string, code: string) => Promise<void>;
}

export const AddFileModal = (props: IUploadProps) => {
  /******************************* State Variables ****************************/
  const [visible, setVisible] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<FILE_TYPE>(FILE_TYPE.SOURCEFILE);
  const [errors, setErrors] = useState<string[]>([]);

  /******************************* API / State Change Functions ****************************/
  const onSave = async () => {
    if (type === FILE_TYPE.SOURCEFILE && !name.endsWith('.sh')) {
      setErrors(['Test file must be a shell script (end with .sh)']);
      return;
    }
    setErrors([]);
    const code = type === FILE_TYPE.SOURCEFILE ? SOURCEFILE_TEMPLATE : '';
    await props.addFile(type, name, code);
    setName('');
    setType(FILE_TYPE.HELPER);
    setVisible(!visible);
  };

  /******************************* State Change Functions ****************************/
  const toggleVisible = () => {
    setVisible(!visible);
  };

  const onChange = (e: any) => {
    setName(e.target.value);
  };

  const onSelect = (type: string) => {
    // @ts-ignore
    setType(FILE_TYPE[type]);
  };

  /******************************* Return *****************************************/
  const typeSelect = (
    <Select onChange={onSelect} style={{ width: 200, marginLeft: 15 }} value={FILE_TYPE[type]}>
      <Option key={FILE_TYPE.HELPER} value={FILE_TYPE[FILE_TYPE.SOURCEFILE]}>
        Test file
      </Option>
      <Option key={FILE_TYPE.HELPER} value={FILE_TYPE[FILE_TYPE.HELPER]}>
        Helper file
      </Option>
      <Option key={FILE_TYPE.HELPER} value={FILE_TYPE[FILE_TYPE.SOLUTION]}>
        Solution file
      </Option>
    </Select>
  );

  useHotkeys(M_KEY, setVisible.bind({}, true));

  return (
    <React.Fragment>
      <Button onClick={toggleVisible} style={{ fontSize: 12, padding: '0px 8px', width: '100%' }} type="primary">
        Add File
      </Button>
      <Modal
        visible={visible}
        title="Add new file"
        onCancel={toggleVisible}
        onOk={onSave}
        width={400}
        style={{ padding: 25 }}
      >
        <Row style={{ display: 'flex' }}>
          <Input onChange={onChange} value={name} placeholder="File Name" />
          {typeSelect}
        </Row>
        {errors.map((e) => {
          return (
            <Row style={{ textAlign: 'center', color: 'red', marginTop: 10 }}>
              <Icon type="exclamation-circle" />
              &nbsp; {e}
            </Row>
          );
        })}
      </Modal>
    </React.Fragment>
  );
};
