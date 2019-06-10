/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* style imports */
import { Button, Checkbox, Modal, Radio, Tooltip } from 'antd';

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
  csv,
  json,
}

interface IProps {
  /* data */
  students: string[];
  graders: string[];
  admins: string[];
  course: CourseType;
  sectionsByStudent: { [studentEmail: string]: SectionType };

  /* UI control */
  isDisabled: boolean;
  startingPage: USER_TYPE;
}

interface IState {
  /* if false, only button will be shown */
  dialogVisible: boolean;

  /* selected upload type */
  fileType: FILE_UPLOAD_TYPE;

  /* selected roster subsets to include in download */
  downloadTypes: Map<USER_TYPE, boolean>;
}

class DownloadRoster extends React.Component<IProps, IState> {
  public constructor(props: IProps) {
    super(props);
    this.state = {
      dialogVisible: false,
      fileType: FILE_UPLOAD_TYPE.json, // set json as default dowbnload type
      downloadTypes: this.initializeDownloadMap(this.props.startingPage),
    };
  }

  /* initialize downloadMap based on the page from which this button was clicked */
  /* Example: if this button is clicked from rosters/student, pre-select the student subset */
  public initializeDownloadMap = (startingPage: USER_TYPE) => {
    const downloadMap = new Map();
    downloadMap.set(USER_TYPE.STUDENT, false);
    downloadMap.set(USER_TYPE.GRADER, false);
    downloadMap.set(USER_TYPE.ADMIN, false);
    downloadMap.set(startingPage, true);
    return downloadMap;
  };

  public toggleDialog = () => {
    this.setState({
      dialogVisible: !this.state.dialogVisible,
    });
  };

  public downloadRoster = () => {
    const { sectionsByStudent } = this.props;

    // Build JSON object to output
    const dataToDownload = {};

    if (this.state.downloadTypes.get(USER_TYPE.STUDENT)) {
      dataToDownload['students'] = this.props.students.map((student) => {
        const thisSection = sectionsByStudent[student] ? sectionsByStudent[student].name : null;
        return { email: student, section: thisSection };
      });
    }
    if (this.state.downloadTypes.get(USER_TYPE.GRADER)) {
      dataToDownload['graders'] = this.props.graders.map((grader) => {
        return { email: grader };
      });
    }
    if (this.state.downloadTypes.get(USER_TYPE.ADMIN)) {
      dataToDownload['admins'] = this.props.admins.map((admin) => {
        return { email: admin };
      });
    }

    /* execute download */
    const a = document.createElement('a');
    let extension;
    switch (this.state.fileType) {
      case FILE_UPLOAD_TYPE.json:
        // pretty-print JSON so download is more human-readable
        a.href = `data:text/json;charset=utf-8, ${encodeURIComponent(JSON.stringify(dataToDownload, null, 2))}`;
        extension = 'json';
        break;
      case FILE_UPLOAD_TYPE.csv:
        a.href = `data:text/csv;charset=utf-8, ${encodeURIComponent(this.convertToCSVFromJSON(dataToDownload))}`;
        extension = 'csv';
        break;
    }

    a.download = `${this.props.course.name}-${this.props.course.period}-roster.${extension}`;
    document.body.appendChild(a);
    a.click();
  };

  public changeFileType = (newType: any) => {
    this.setState({ fileType: newType });
  };

  public convertToCSVFromJSON = (json: any) => {
    let items: any[] = [];

    const keys = ['students', 'graders', 'admins'];
    for (const key of keys) {
      if (key in json) {
        items = items.concat(
          json[key].map((el: any) => {
            return {
              role: key.slice(0, -1),
              email: el.email,
              section: el.section ? el.section : key === 'students' ? 'null' : '',
            };
          }),
        );
      }
    }

    const replacer = (key: any, value: any) => (value === null ? 'null' : value);
    const header = Object.keys(items[0]);
    const csv = items.map((row: any) => {
      return header
        .map((fieldName) => {
          return JSON.stringify(row[fieldName], replacer);
        })
        .join(',');
    });
    csv.unshift(header.join(','));
    return csv.join('\n');
  };

  public toggleDownloadTypes = (userType: USER_TYPE) => {
    const newMap = new Map(this.state.downloadTypes);
    newMap.set(userType, !newMap.get(userType));
    this.setState({ downloadTypes: newMap });
  };

  /* Generate a preview of the download format, based on the selected (a) filetype and (b) user subsets
   * to include.
   */
  public getPreviewText = (
    students: string[],
    sectionsByStudent: { [studentEmail: string]: SectionType },
    graders: string[],
    admins: string[],
    fileType: FILE_UPLOAD_TYPE,
    downloadTypes: Map<USER_TYPE, boolean>,
  ) => {
    let student0 = 'student0@myschool.edu';
    let student1 = 'student1@myschool.edu';
    let grader0 = 'grader0@myschool.edu';
    let grader1 = 'grader1@myschool.edu';
    let admin0 = 'admin0@myschool.edu';
    let admin1 = 'admi10@myschool.edu';
    let section0 = 'S1';
    let section1 = 'null';

    if (students.length >= 2 && graders.length >= 2 && admins.length >= 2) {
      student0 = students[0];
      student1 = students[1];
      grader0 = graders[0];
      grader1 = graders[1];
      admin0 = admins[0];
      admin1 = admins[1];
      section0 = sectionsByStudent[student0] ? sectionsByStudent[student0].name : 'null';
      section1 = sectionsByStudent[student1] ? sectionsByStudent[student1].name : 'null';
    }

    const previewItems: string[] = [];
    let toRet;
    switch (fileType) {
      case FILE_UPLOAD_TYPE.json:
        if (downloadTypes.get(USER_TYPE.STUDENT)) {
          previewItems.push(`    students: [\n    {"email": "${student0}", "section": "${section0}"},\n\
    {"email": "${student1}", "section": "${section1}"},\n    ...\n    ]`);
        }
        if (downloadTypes.get(USER_TYPE.GRADER)) {
          previewItems.push(`    graders: [\n    {"email": "${grader0}"},\n\
    {"email": "${grader1}"},\n    ...\n    ]`);
        }
        if (downloadTypes.get(USER_TYPE.ADMIN)) {
          previewItems.push(`    admins: [\n    {"email": "${admin0}"},\n\
    {"email": "${admin1}"},\n    ...\n    ]`);
        }
        toRet = previewItems.join(',\n');
        break;
      case FILE_UPLOAD_TYPE.csv:
        // only show columns if at least one user subset is selected
        if (
          downloadTypes.get(USER_TYPE.STUDENT) ||
          downloadTypes.get(USER_TYPE.GRADER) ||
          downloadTypes.get(USER_TYPE.ADMIN)
        ) {
          previewItems.push('    role,email,section\n');
        }
        if (downloadTypes.get(USER_TYPE.STUDENT)) {
          previewItems.push(`    student,${student0},${section0}\n    student,${student1},${section1}\n     ...\n`);
        }
        if (downloadTypes.get(USER_TYPE.GRADER)) {
          previewItems.push(`    grader,${grader0},\n    grader,${grader1},\n    ...\n`);
        }
        if (downloadTypes.get(USER_TYPE.ADMIN)) {
          previewItems.push(`    admin,${admin0},\n    admin,${admin1},\n    ...`);
        }
        toRet = previewItems.join('');
        break;
    }

    return toRet;
  };

  public render() {
    const isDownloadDisabled =
      Array.from(this.state.downloadTypes.keys()).filter((el) => {
        return this.state.downloadTypes.get(el);
      }).length === 0;

    const okButton = isDownloadDisabled ? (
      <Tooltip key="submit" title={'You must select at least one group to include.'}>
        <Button key="submit" type="primary" disabled={true}>
          Download
        </Button>
      </Tooltip>
    ) : (
      <Button key="submit" type="primary" disabled={false} onClick={this.downloadRoster}>
        Download
      </Button>
    );

    const previewText = this.getPreviewText(
      this.props.students,
      this.props.sectionsByStudent,
      this.props.graders,
      this.props.admins,
      this.state.fileType,
      this.state.downloadTypes,
    );

    return (
      <div>
        <CPButton icon="download" cpType="secondary" onClick={this.toggleDialog}>
          Download roster
        </CPButton>
        <Modal
          visible={this.state.dialogVisible}
          onCancel={this.toggleDialog}
          title="Download roster"
          okText="Download"
          width={600}
          footer={[
            <Button key="back" onClick={this.toggleDialog}>
              Cancel
            </Button>,
            okButton,
          ]}
        >
          <div>
            Format: &nbsp; &nbsp;
            <Radio.Group>
              <Radio
                checked={this.state.fileType === FILE_UPLOAD_TYPE.json}
                value={FILE_UPLOAD_TYPE.json}
                onClick={this.changeFileType.bind(this, FILE_UPLOAD_TYPE.json)}
              >
                JSON
              </Radio>
              <Radio
                value={FILE_UPLOAD_TYPE.csv}
                checked={this.state.fileType === FILE_UPLOAD_TYPE.csv}
                onClick={this.changeFileType.bind(this, FILE_UPLOAD_TYPE.csv)}
              >
                CSV
              </Radio>
            </Radio.Group>
          </div>
          <br />
          <div>
            Include: &nbsp; &nbsp;
            <br />
            <Checkbox
              checked={this.state.downloadTypes.get(USER_TYPE.STUDENT)}
              onChange={this.toggleDownloadTypes.bind(this, USER_TYPE.STUDENT)}
            >
              Students
            </Checkbox>
            <br />
            <Checkbox
              checked={this.state.downloadTypes.get(USER_TYPE.GRADER)}
              onChange={this.toggleDownloadTypes.bind(this, USER_TYPE.GRADER)}
            >
              Graders
            </Checkbox>
            <br />
            <Checkbox
              checked={this.state.downloadTypes.get(USER_TYPE.ADMIN)}
              onChange={this.toggleDownloadTypes.bind(this, USER_TYPE.ADMIN)}
            >
              Admins
            </Checkbox>
            <br />
            <br />
            Preview:
            <ReactMarkdown source={previewText} />
          </div>
        </Modal>
      </div>
    );
  }
}
export default DownloadRoster;
