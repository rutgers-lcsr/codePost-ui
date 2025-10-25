/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

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

/* file types allowed for roster upload */
enum FILE_UPLOAD_TYPE {
  txt,
}

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

interface IState {
  /* if false, only button will be shown */
  dialogVisible: boolean;

  /* selected upload type */
  fileType: FILE_UPLOAD_TYPE;

  includeSections: boolean;
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

class DownloadRoster extends React.Component<IProps, IState> {
  public constructor(props: IProps) {
    super(props);
    this.state = {
      dialogVisible: false,
      fileType: FILE_UPLOAD_TYPE.txt, // set json as default dowbnload type
      includeSections: false,
    };
  }

  public toggleDialog = () => {
    this.setState({
      dialogVisible: !this.state.dialogVisible,
    });
  };

  public downloadRoster = () => {
    const dataToDownload = rosterToCsv(
      this.props.sectionsByStudent,
      this.state.includeSections,
      this.props.downloadType,
      this.props.admins,
      this.props.graders,
      this.props.students,
    );

    /* execute download */
    const a = document.createElement('a');
    let extension;
    switch (this.state.fileType) {
      case FILE_UPLOAD_TYPE.txt:
        a.href = `data:text/txt;charset=utf-8,${encodeURIComponent(dataToDownload.join('\n'))}`;
        extension = 'txt';
        break;
    }

    a.download = `${this.props.course.name}-${this.props.course.period}-${this.props.downloadType}-roster.${extension}`;
    document.body.appendChild(a);
    a.click();
  };

  public changeFileType = (newType: FILE_UPLOAD_TYPE) => {
    this.setState({ fileType: newType });
  };

  /* Generate a preview of the download format, based on the selected (a) filetype and (b) user subsets
   * to include.
   */
  public getPreviewText = (
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
    switch (this.props.downloadType) {
      case USER_TYPE.STUDENT:
        if (this.state.includeSections) {
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
  };

  public toggleShowSections = () => {
    this.setState((oldState: IState) => {
      return {
        includeSections: !oldState.includeSections,
      };
    });
  };

  public render() {
    const previewText = this.getPreviewText(
      this.props.students,
      this.props.sectionsByStudent,
      this.props.graders,
      this.props.admins,
    );

    return (
      <div>
        <CPButton icon={<DownloadOutlined />} cpType="secondary" onClick={this.toggleDialog}>
          Download roster
        </CPButton>
        <Modal
          open={this.state.dialogVisible}
          onCancel={this.toggleDialog}
          title={`Download roster: ${this.props.downloadType}s`}
          okText="Download"
          width={600}
          footer={[
            <Button key="back" onClick={this.toggleDialog}>
              Cancel
            </Button>,
            <Button key="submit" type="primary" disabled={false} onClick={this.downloadRoster}>
              Download
            </Button>,
          ]}
        >
          Click <b>Download</b> to save a copy of your <b>{this.props.downloadType.toLowerCase()}</b> roster to a{' '}
          <Typography.Text code>.txt</Typography.Text>
          file.
          <br />
          <br />
          <div>
            {this.props.downloadType === USER_TYPE.STUDENT ? (
              <div>
                <Checkbox checked={this.state.includeSections} onChange={this.toggleShowSections}>
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
  }
}
export default DownloadRoster;
