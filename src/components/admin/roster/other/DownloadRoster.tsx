/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';
import { useCallback, useState } from 'react';

/* style imports */
import { DownloadOutlined } from '@ant-design/icons';
import { Button, Checkbox, Collapse, Modal, Typography } from 'antd';

/* other library imports */
import ReactMarkdown from 'react-markdown';

/* codePost imports */

// type definitions
import { CourseType } from '../../../../infrastructure/course';
import { SectionType } from '../../../../infrastructure/section';
import { USER_TYPE } from '../../../../types/common';

import CPButton from '../../../../components/core/CPButton';

/**********************************************************************************************************************/



interface IProps {
  /* data */
  students: string[];
  graders: string[];
  admins: string[];
  course: CourseType;
  sectionsByStudent: { [studentEmail: string]: SectionType };

  /* selected roster subsets to include in download */
  downloadType: USER_TYPE;

  /* UI control */
  isDisabled: boolean;
  startingPage: USER_TYPE;
}

export const rosterToCsv = (
  sectionsByStudent: { [studentEmail: string]: SectionType },
  includeSections: boolean,
  downloadType: USER_TYPE,
  admins: string[],
  graders: string[],
  students: string[],
) => {
  // Build JSON object to output
  let dataToDownload: string[] = [];

  switch (downloadType) {
    case USER_TYPE.STUDENT:
      if (includeSections) {
        dataToDownload = students.map((student) => {
          const thisSection = sectionsByStudent[student] ? sectionsByStudent[student].name : null;
          if (thisSection === null) {
            return `${student},null`;
          } else {
            return `${student},${thisSection}`;
          }
        });
      } else {
        dataToDownload = students;
      }

      break;
    case USER_TYPE.GRADER:
      dataToDownload = graders;
      break;
    case USER_TYPE.ADMIN:
      dataToDownload = admins;
      break;
  }
  return dataToDownload;
};

const DownloadRoster: React.FC<IProps> = (props) => {
  const [dialogVisible, setDialogVisible] = useState(false);
  const [includeSections, setIncludeSections] = useState(false);

  const toggleDialog = useCallback(() => {
    setDialogVisible((prev) => !prev);
  }, []);

  const downloadRoster = useCallback(() => {
    const dataToDownload = rosterToCsv(
      props.sectionsByStudent,
      includeSections,
      props.downloadType,
      props.admins,
      props.graders,
      props.students,
    );

    /* execute download */
    const a = document.createElement('a');

    // Default to txt as it is the only choice
    const extension = 'txt';
    a.href = `data:text/txt;charset=utf-8,${encodeURIComponent(dataToDownload.join('\n'))}`;

    a.download = `${props.course.name}-${props.course.period}-${props.downloadType}-roster.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [
    props.sectionsByStudent,
    includeSections,
    props.downloadType,
    props.admins,
    props.graders,
    props.students,
    props.course.name,
    props.course.period,
  ]);

  /* Generate a preview of the download format, based on the selected (a) filetype and (b) user subsets
   * to include.
   */
  const getPreviewText = useCallback(
    (
      students: string[],
      sectionsByStudent: { [studentEmail: string]: SectionType },
      graders: string[],
      admins: string[],
    ) => {
      let student0 = 'student0@myschool.edu';
      let student1 = 'student1@myschool.edu';
      let grader0 = 'grader0@myschool.edu';
      let grader1 = 'grader1@myschool.edu';
      let admin0 = 'admin0@myschool.edu';
      let admin1 = 'admi10@myschool.edu';
      let section0 = 'S1';
      let section1 = 'null';

      if (students.length >= 2) {
        student0 = students[0];
        student1 = students[1];
        section0 = sectionsByStudent[student0] ? sectionsByStudent[student0].name : 'null';
        section1 = sectionsByStudent[student1] ? sectionsByStudent[student1].name : 'null';
      }

      if (graders.length >= 2) {
        grader0 = graders[0];
        grader1 = graders[1];
      }

      if (admins.length >= 2) {
        admin0 = admins[0];
        admin1 = admins[1];
      }

      const previewItems: string[] = [];
      switch (props.downloadType) {
        case USER_TYPE.STUDENT:
          if (includeSections) {
            previewItems.push(`    ${student0},${section0}\n    ${student1},${section1}\n     ...\n`);
          } else {
            previewItems.push(`    ${student0}\n    ${student1}\n    ...\n`);
          }

          break;
        case USER_TYPE.GRADER:
          previewItems.push(`    ${grader0}\n    ${grader1}\n    ...\n`);
          break;
        case USER_TYPE.ADMIN:
          previewItems.push(`    ${admin0}\n    ${admin1}\n    ...`);
          break;
      }

      return previewItems.join('');
    },
    [props.downloadType, includeSections],
  );

  const toggleShowSections = useCallback(() => {
    setIncludeSections((prev) => !prev);
  }, []);

  const previewText = getPreviewText(
    props.students,
    props.sectionsByStudent,
    props.graders,
    props.admins,
  );

  return (
    <div>
      <CPButton icon={<DownloadOutlined />} cpType="secondary" onClick={toggleDialog}>
        Download roster
      </CPButton>
      <Modal
        open={dialogVisible}
        onCancel={toggleDialog}
        title={`Download roster: ${props.downloadType}s`}
        okText="Download"
        width={600}
        footer={[
          <Button key="back" onClick={toggleDialog}>
            Cancel
          </Button>,
          <Button key="submit" type="primary" disabled={false} onClick={downloadRoster}>
            Download
          </Button>,
        ]}
      >
        Click <b>Download</b> to save a copy of your <b>{props.downloadType.toLowerCase()}</b> roster to a{' '}
        <Typography.Text code>.txt</Typography.Text>
        file.
        <br />
        <br />
        <div>
          {props.downloadType === USER_TYPE.STUDENT ? (
            <div>
              <Checkbox checked={includeSections} onChange={toggleShowSections}>
                Include sections
              </Checkbox>
              <br />
              <br />
            </div>
          ) : null}
          <Collapse bordered={true} accordion={true} defaultActiveKey={['1']}>
            <Collapse.Panel header="Preview" key="1">
              <ReactMarkdown>{previewText}</ReactMarkdown>
            </Collapse.Panel>
          </Collapse>
        </div>
      </Modal>
    </div>
  );
};
export default DownloadRoster;
