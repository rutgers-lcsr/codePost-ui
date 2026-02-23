// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';

import { InfoCircleFilled, InfoCircleTwoTone, UploadOutlined } from '@ant-design/icons';

import { colors } from '../../../../theme/colors';
import { Button, Card, Input, Tooltip, Upload } from 'antd';
import type { RcFile } from 'antd/es/upload';

const { TextArea } = Input;

interface IRosterInputProps {
  onRosterUpload: any;
  roleType: any;
  sections: any;
  rosterInput: string;
  emailNewUsers: boolean;
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

  const rosterStringWithoutSections = (input: string) => {
    return input
      .split('\n')
      .map((row: string) => {
        return row.split(',')[0];
      })
      .join('\n');
  };

  const [rosterString, setRosterString] = React.useState(
    currentTab === 'without' ? rosterStringWithoutSections(props.rosterInput) : props.rosterInput,
  );

  const onTabChange = (key: string) => {
    setCurrentTab(key);
    setFormatSample(formatSamples[key as keyof typeof formatSamples]);
    setRosterString(key === 'without' ? rosterStringWithoutSections(rosterString) : props.rosterInput);
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
  const beforeUpload = (file: RcFile) => {
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
    <div>
      <Upload beforeUpload={beforeUpload} showUploadList={false}>
        <Button>
          <UploadOutlined /> Upload a .txt file
        </Button>
      </Upload>
      <Tooltip
        title={
          <div>
            <div style={{ marginBottom: 10 }}>
              <b style={{ fontWeight: 600 }}>Upload format:</b>
              <div>One line per email{props.roleType === 'student' && ' with a comma preceding the section'}.</div>
            </div>
            <div style={{ marginBottom: 10 }}>
              <b style={{ fontWeight: 600 }}>Example:</b>
              <div style={{ fontStyle: 'italic' }}>{formatSamples.without}</div>
            </div>
            {props.roleType === 'student' && (
              <div>
                <b style={{ fontWeight: 600 }}>Example with sections:</b>
                <div style={{ fontStyle: 'italic' }}>{formatSamples.with}</div>
              </div>
            )}
          </div>
        }
      >
        <InfoCircleTwoTone twoToneColor={colors.brandPrimary} style={{ marginLeft: 10 }} />
      </Tooltip>
    </div>
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
      Based on your course settings, any new users {props.emailNewUsers ? <b>will</b> : <b>won't</b>} be emailed when
      they are added to your course.
      <br />
      <br />
      <Card {...tabProps} size="small" actions={[uploadButton, reviewButton]}>
        {currentTab === 'with' ? (
          <div style={{ marginBottom: '10px' }}>
            <InfoCircleFilled style={{ color: colors.actionYellowFade }} />
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
