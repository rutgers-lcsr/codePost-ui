/***********************************************************************************
/* Description: This is an upload component for a folder of zips, where each zip is
/*              a student's code.
/***********************************************************************************/

import React, { useState } from 'react';

import { Button, Collapse, Icon, List, message, Upload, Slider, Select, Statistic, Table, Typography } from 'antd';

import ReactMarkdown from 'react-markdown';

import { codePostFile, IProtoFileUpload } from './../FileReader';

import { CourseType } from '../../../../../../infrastructure/types';

import { Course } from '../../../../../../infrastructure/course';

import LMSRosterMapUpload from './LMSRosterMapUpload';

import { BulkUploadFooter } from './BulkUploadComponents';

import { FolderToStudentMap, getIdentifierFromFolder, beforeLMSImport } from './LMSImportHelpers';

interface IUploadFormProps {
  processSubmissionsFromFiles: (
    files: codePostFile[],
    getStudentsFromFile: (file: IProtoFileUpload) => string[],
  ) => void;
  students: string[];
  mode?: string;
  course: CourseType;
  onCancel: () => void;
  setImportOptions: (value: boolean) => void;
}

// *************************************************************************************
// ***************************** Main Component  **********************************
// *************************************************************************************

export const LMSImport = (props: IUploadFormProps) => {
  const [step, setStep] = useState(0);
  const [fileList, setFileList] = useState<codePostFile[]>([]);
  const [map, setMap] = useState<FolderToStudentMap>({});
  const [userIndex, setUserIndex] = useState(0);

  const nextStep = () => {
    if (step < 2) {
      setStep(step + 1);
    }
  };

  const reset = () => {
    setMap({});
    setStep(0);
    setFileList([]);
    setUserIndex(0);
  };

  const setRawFiles = (files: codePostFile[]) => {
    const map: FolderToStudentMap = {};
    files.forEach((el) => {
      const folderName = el.pathOverride!.split('/')[1];
      map[folderName] = null;
    });
    setMap(map);
    setFileList(files);
    nextStep();
  };

  const onUpload = () => {
    const getStudentByFile = (el: IProtoFileUpload) => {
      const folderName = el.path.split('/')[1];
      if (map[folderName] !== null) return [map[folderName]!];
      return ['hello'];
    };
    props.processSubmissionsFromFiles(fileList, getStudentByFile);
  };

  let content;
  let title = '';
  let subtitle = '';
  switch (step) {
    case 0:
      content = (
        <StepZeroUploadZips
          nextStep={nextStep}
          rawFiles={fileList}
          setRawFiles={setRawFiles}
          goBack={props.setImportOptions.bind({}, true)}
        />
      );
      title = '';
      break;
    case 1:
      content = (
        <StepOneSelectUserName nextStep={nextStep} setUserIndex={setUserIndex} folderMap={map} goBack={reset} />
      );
      title = "Select the student's unique identifier";
      subtitle = 'This is to identify the LMS ID from the file name.';
      break;
    case 2:
      content = (
        <StepTwoMapStudent
          nextStep={nextStep}
          goBack={() => setStep(1)}
          folderMap={map}
          idIndex={userIndex}
          setStudent={(name, email) => {
            setMap((prevState) => {
              return { ...prevState, [name]: email };
            });
          }}
          setFolderMap={setMap}
          students={props.students}
          onUpload={onUpload}
          course={props.course}
        />
      );
      title = 'Map the LMS unique identifier to codePost emails';
      break;
    default:
      content = <div />;
      break;
  }

  return (
    <div>
      <div style={{ marginBottom: 15 }}>
        <Typography.Title level={4}>{title}</Typography.Title>
        <div style={{ color: 'grey' }}>{subtitle}</div>
      </div>
      {content}
    </div>
  );
};

// *************************************************************************************
// *************************** Step Zero: Upload Zip files  ****************************
// *************************************************************************************

interface IStepZeroProps {
  goBack: () => void;
  nextStep: () => void;
  rawFiles: codePostFile[];
  setRawFiles: (files: codePostFile[]) => void;
}

const StepZeroUploadZips = (props: IStepZeroProps) => {
  const beforeUpload = beforeLMSImport(props.rawFiles, props.setRawFiles);

  const exampleText = `\`\`\`
  folder/
    someText_someText_someText_someText.zip
    someText_someText_someText_someText.zip
    someText_someText_someText.zip
    someText_someText_someText_someText_someText.zip
  \`\`\``;

  return (
    <div>
      <Collapse style={{ marginBottom: 20 }}>
        <Collapse.Panel header="Instructions" key="1">
          Upload a folder of zip files, where each zip file is a student's submission. The file name must be underscore
          delimited.
          <br />
          <br />
          <ReactMarkdown source={exampleText} />
        </Collapse.Panel>
      </Collapse>
      <Upload.Dragger showUploadList={false} directory={true} multiple={false} beforeUpload={beforeUpload}>
        <p className="ant-upload-drag-icon">
          <Icon type="inbox" />
        </p>
        <p className="ant-upload-text">Click to upload a folder</p>
        <p className="ant-upload-hint">Make sure you use the format specified in the Instructions above.</p>
      </Upload.Dragger>
      <BulkUploadFooter
        backText="Back"
        onBack={props.goBack}
        forwardText="Upload"
        onForward={() => {}}
        disableForward={true}
      />
    </div>
  );
};

// *************************************************************************************
// *************************** Step One: Select the LMS identifier  ********************
// *************************************************************************************

interface IStepOneProps {
  goBack: () => void;
  nextStep: () => void;
  folderMap: FolderToStudentMap;
  setUserIndex: (index: number) => void;
}
const StepOneSelectUserName = (props: IStepOneProps) => {
  const [sliderIndex, setSliderIndex] = useState(0);
  const [toShow, setToShow] = useState(5);

  //************* Change parent state *********
  const onContinue = () => {
    props.setUserIndex(sliderIndex);
    props.nextStep();
  };

  //************* Change component state *********
  const handleChange = (e: any) => {
    setSliderIndex(e);
  };

  const showMore = () => {
    setToShow(toShow + 5);
  };

  //************* Render utils *********

  const folders = Object.keys(props.folderMap);
  const maxIndex = folders.reduce((acc, folder) => {
    const numVals = folder.split('_').length;
    return numVals > acc ? numVals : acc;
  }, 1);

  const shortFolders: string[] = [];
  folders.forEach((folder) => {
    const numVals = folder.split('_').length;
    if (numVals < sliderIndex + 1) {
      shortFolders.push(folder);
    }
  });

  //************* Render  *********
  let errorMsg;
  if (shortFolders.length > 0) {
    errorMsg = (
      <div>
        The following folders have less underscore values than the index specified. The last value will be used for
        these folders:
        <div>
          {shortFolders.map((f) => (
            <div>{f}</div>
          ))}
        </div>
      </div>
    );
  }

  const foldersToShow = folders.length > toShow ? folders.slice(0, toShow) : folders;

  const highlightedStyle = { fontWeight: 600, color: '#24be85', fontSize: 16 };
  const normalStyle = { fontWeight: 400, color: 'grey', fontSize: 14 };
  const renderFolder = (f: string) => {
    const elems = f.split('_');
    return (
      <List.Item style={{ paddingLeft: 25 }}>
        <div>
          {elems.map((el, i) => {
            return (
              <span>
                <span style={i === sliderIndex ? highlightedStyle : normalStyle}>{el}</span>
                <span>{i < elems.length - 1 ? '_' : ''}</span>
              </span>
            );
          })}
        </div>
      </List.Item>
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ width: 'calc(100%)', padding: '0px 25px' }}>
          <Slider
            tooltipVisible={false}
            min={0}
            max={maxIndex - 1}
            dots={true}
            onChange={handleChange}
            value={sliderIndex}
          />
        </div>
      </div>
      <List
        itemLayout="horizontal"
        loadMore={
          folders.length > toShow ? (
            <div
              style={{
                textAlign: 'center',
                marginTop: 12,
                height: 32,
                lineHeight: '32px',
              }}
            >
              <Button onClick={showMore}>show more</Button>
            </div>
          ) : null
        }
        dataSource={foldersToShow}
        renderItem={renderFolder}
      />
      {errorMsg}
      <BulkUploadFooter
        backText="Back"
        onBack={props.goBack}
        forwardText="Select"
        onForward={onContinue}
        disableForward={false}
      />
    </div>
  );
};

interface IStepTwoProps {
  nextStep: () => void;
  goBack: () => void;
  folderMap: FolderToStudentMap;
  idIndex: number;
  students: string[];
  setStudent: (folderName: string, email: string) => void;
  setFolderMap: (map: FolderToStudentMap) => void;
  onUpload: () => void;
  course: CourseType;
}

// *************************************************************************************
// *************************** Step Two: Map the LMS id to the student *****************
// *************************************************************************************

const StepTwoMapStudent = (props: IStepTwoProps) => {
  const [editMode, setEditMode] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [newMapping, setNewMapping] = useState<{ [id: string]: string }>({});
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    const fetchMap = async () => {
      setLoading(true);
      const oldMap = await Course.readRosterMap(props.course.id);
      setNewMapping(oldMap);
    };
    fetchMap();
  }, []);

  React.useEffect(() => {
    setLoading(true);
    const folderNameByID: { [id: string]: string } = {};
    // Roster map is indexed by ID, but the folderMap required by UploadBulkSubmissionDialog is indexed by foldername
    // We first create a mapping of LMS id to folder name
    Object.keys(props.folderMap).forEach((folderName) => {
      const id = getIdentifierFromFolder(folderName, props.idIndex);
      folderNameByID[id] = folderName;
    });

    let studentsMatched = 0;
    Object.keys(newMapping).forEach((identifier) => {
      if (identifier in folderNameByID && identifier in newMapping) {
        props.setStudent(folderNameByID[identifier], newMapping[identifier]);
        studentsMatched += 1;
      }
    });

    // If all students have been matched, turn off edit mode
    if (studentsMatched === props.students.length) {
      setEditMode(false);
    }

    setLoading(false);
  }, [newMapping]);

  const columns = [
    {
      title: 'Zip Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: any, b: any) => a.name.localeCompare(b.name),
    },
    {
      title: 'Student identifier',
      dataIndex: 'identifier',
      key: 'identifier',
      sorter: (a: any, b: any) => a.identifier.localeCompare(b.identifier),
      defaultSortOrder: 'ascend' as 'ascend',
    },
    {
      title: 'codePost email',
      dataIndex: 'email',
      key: 'email',
      sorter: (a: any, b: any) => {
        if (!a.emailValue) return 1;
        if (!b.emailValue) return -1;
        return a.emailValue.localeCompare(b.emailValue);
      },
    },
  ];

  const mappedStudents = Object.keys(props.folderMap)
    .filter((folderName) => props.folderMap[folderName])
    .map((folderName) => props.folderMap[folderName]);

  const data = Object.keys(props.folderMap).map((folderName) => {
    const id = getIdentifierFromFolder(folderName, props.idIndex);
    const studentEmail = !editMode ? (
      <span>{props.folderMap[folderName] || undefined}</span>
    ) : (
      <Select
        value={props.folderMap[folderName] || undefined}
        showSearch={true}
        onChange={(e: string) => props.setStudent(folderName, e)}
        style={{ minWidth: 250 }}
      >
        {props.students.map((student) => (
          <Select.Option value={student} disabled={mappedStudents.includes(student)}>
            {student}
          </Select.Option>
        ))}
        <Select.Option value={undefined}> </Select.Option>
      </Select>
    );

    return {
      name: folderName,
      identifier: id,
      email: studentEmail,
      emailValue: props.folderMap[folderName] || undefined,
    };
  });

  const onRosterSave = async (newMap: { [id: string]: string }) => {
    await Course.updateRosterMap({ id: props.course.id, rosterMap: newMap });
    setNewMapping(newMap);
    setShowUpload(false);
    message.success('Mapping saved!');
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 15 }}>
        <div style={{ display: 'flex', textAlign: 'center' }}>
          <Statistic
            title="Total submissions"
            value={Object.keys(props.folderMap).length}
            style={{ marginRight: 20 }}
          />{' '}
          <Statistic
            title="Mapped submissions"
            value={mappedStudents.length}
            valueStyle={{ color: '#24be85' }}
            style={{ marginRight: 20 }}
          />
          <Statistic
            title="Unmapped submissions"
            value={Object.keys(props.folderMap).length - mappedStudents.length}
            valueStyle={{ color: '#fab1a0' }}
          />
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        {editMode ? (
          <Button type="primary" onClick={() => setShowUpload(true)} style={{ marginBottom: 10 }}>
            <Icon type="upload" /> Upload a mapping
          </Button>
        ) : (
          <Button type="default" onClick={() => setEditMode(true)}>
            <Icon type="edit" /> Edit
          </Button>
        )}
      </div>
      <LMSRosterMapUpload
        isVisible={showUpload}
        onCancel={() => setShowUpload(false)}
        onSave={onRosterSave}
        folderMap={props.folderMap}
        idIndex={props.idIndex}
        students={props.students}
      />
      <Table columns={columns} pagination={{ pageSize: 5 }} dataSource={data} loading={loading} />
      <BulkUploadFooter
        backText="Back"
        onBack={props.goBack}
        forwardText="Continue"
        onForward={props.onUpload}
        disableForward={mappedStudents.length === 0}
        confirmText={
          "Some students haven't been mapped. Are you sure you want to do a partial save? You can come back later and add the missing students."
        }
      />
    </div>
  );
};
