import * as React from 'react';

import { Button, Card, Icon, Input, Upload } from 'antd';

const { TextArea } = Input;

interface IRosterInputProps {
  onRosterUpload: any;
  roleType: any;
  sections: any;
  rosterInput: string;
}

const RosterInput = (props: IRosterInputProps) => {
  const withoutSections = `${props.roleType}1@myschool.edu
${props.roleType}2@myschool.edu
${props.roleType}3@myschool.edu
...`;

  const withSections = `${props.roleType}1@myschool.edu,P01
${props.roleType}2@myschool.edu,null
${props.roleType}3@myschool.edu,P02
...`;

  const formatSamples = {
    without: withoutSections,
    with: withSections,
  };

  const [currentTab, setCurrentTab] = React.useState('without');
  const [formatSample, setFormatSample] = React.useState(formatSamples.without);

  const [rosterString, setRosterString] = React.useState(props.rosterInput);

  const onTabChange = (key: string) => {
    setCurrentTab(key);
    setFormatSample(formatSamples[key]);
  };

  const onChange = (e: any) => {
    setRosterString(e.target.value);
  };

  const tabList = [
    {
      key: 'without',
      tab: 'Without Sections',
    },
    {
      key: 'with',
      tab: 'With Sections',
    },
  ];

  const beforeUpload = (file: any, fileList: any) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setRosterString(reader.result);
      }
    };
    reader.readAsText(file);

    // prevent Ant upload component from trying to post file
    return false;
  };
  const onRosterUpload = () => {
    props.onRosterUpload(rosterString);
  };
  const uploadButton = (
    <Upload beforeUpload={beforeUpload} showUploadList={false}>
      <Button>
        <Icon type="upload" /> Upload a CSV or text file
      </Button>
    </Upload>
  );

  const tabProps = props.roleType === 'student' ? { tabList, activeTabKey: currentTab, onTabChange } : {};

  const reviewButton = (
    <Button type="primary" onClick={onRosterUpload}>
      Review Roster Changes
    </Button>
  );

  return (
    <div className="roster-input">
      Follow the instructions below to update the course roster. You'll have the chance to review any changes before
      they are made after uploading your file.
      <br />
      <br />
      <Card {...tabProps} size="small" actions={[uploadButton, reviewButton]}>
        {currentTab === 'with' ? (
          <div style={{ marginBottom: '10px' }}>
            <Icon type="info-circle" theme="filled" style={{ color: '#ffd129' }} />
            <span>
              {'  '} To remove a student from any section, set the student's section to "null". To leave a student's
              section unchanged, include only the student's email.
            </span>
          </div>
        ) : null}
        <div style={{ paddingBottom: '6px' }}>
          Enter the <b>{props.roleType}</b> emails, <b>one per line</b>
        </div>
        <TextArea rows={6} placeholder={formatSample} value={rosterString} onChange={onChange} />
      </Card>
    </div>
  );
};

export default RosterInput;
