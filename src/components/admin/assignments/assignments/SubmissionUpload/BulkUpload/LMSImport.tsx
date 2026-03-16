// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/***********************************************************************************
/* Description: This is an upload component for a folder of zips, where each zip is
/*              a student's code.
/***********************************************************************************/

import React, { useState } from 'react';

import { EditOutlined, InboxOutlined, RocketOutlined, UploadOutlined } from '@ant-design/icons';

import { colors } from '../../../../../../theme/colors';

import {
  Button,
  Card,
  Checkbox,
  Collapse,
  List,
  message,
  Radio,
  Select,
  Slider,
  Statistic,
  Table,
  Tooltip,
  Typography,
  Upload,
} from 'antd';
import type { RadioChangeEvent } from 'antd';

import ReactMarkdown from 'react-markdown';

import { codePostFile, IProtoFileUpload } from './../FileReader';

import { Course } from '../../../../../../api-client';

import { coursesApi } from '../../../../../../api-client/clients';

import LMSRosterMapUpload from './LMSRosterMapUpload';

import { BulkUploadFooter } from './BulkUploadComponents';

import {
  beforeLMSImport,
  FolderToStudentMap,
  getFileExample,
  getIdentifierFromFolder,
  getZipExample,
} from './LMSImportHelpers';

import stringDistance from './levenshteinDistance';

interface IUploadFormProps {
  processSubmissionsFromFiles: (
    files: codePostFile[],
    getStudentsFromFile: (file: IProtoFileUpload) => string[],
  ) => void;
  students: string[];
  mode?: string;
  course: Course;
  onCancel: () => void;
  setImportOptions: (value: boolean) => void;
  system: string;
}

// *************************************************************************************
// ***************************** Main Component  **********************************
// *************************************************************************************

enum IMPORT_TYPE {
  zipList,
  fileList,
}

export const LMSImport = (props: IUploadFormProps) => {
  const [step, setStep] = useState(0);
  const [fileList, setFileList] = useState<codePostFile[]>([]);
  const [map, setMap] = useState<FolderToStudentMap>({});
  const [userIndex, setUserIndex] = useState(0);
  const [uploadType, setUploadType] = useState<IMPORT_TYPE>(IMPORT_TYPE.zipList);
  const [delimiter, setDelimiter] = useState('_');

  // Increment step
  const nextStep = () => {
    if (step < 3) {
      setStep(step + 1);
    }
  };

  // Reset back to beginning
  const reset = () => {
    setMap({});
    setFileList([]);
    setUserIndex(0);
  };

  const onDelimiterChange = (e: RadioChangeEvent) => {
    setDelimiter(e.target.value);
  };

  // Set the raw files and the folder map
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

  const setUserIndexWrapper = (newIndex: number) => {
    switch (uploadType) {
      // If it's a zip list, we don't need to re write the folder map
      case IMPORT_TYPE.zipList:
        setUserIndex(newIndex);
        break;
      // If it's a file list, we need to rewrite the folder map to consolidate
      // On iniital upload, we represent studentFile1 and studentFile2 as different entries
      // in our mapping becasue we don't know the unique identifier to match.
      // Once we do, we can consolide studentFile1 and studentFile2 into a single mapping entry
      case IMPORT_TYPE.fileList: {
        const map: FolderToStudentMap = {};
        fileList.forEach((el) => {
          const elems = el.pathOverride!.split('/')[1].split(delimiter);
          if (elems.length >= newIndex) {
            const folderName = elems[newIndex];
            map[folderName] = null;
          }
        });
        setMap(map);
        setUserIndex(newIndex);
      }
    }
  };

  const onUpload = () => {
    let getStudentByFile;
    switch (uploadType) {
      case IMPORT_TYPE.zipList:
        // To upload the list of zips, we get the folder name by
        getStudentByFile = (el: IProtoFileUpload) => {
          const folderName = el.path.split('/')[1];
          if (map[folderName] !== null) return [map[folderName]!];
          return ['hello'];
        };
        break;
      default:
        getStudentByFile = (el: IProtoFileUpload) => {
          const elems = el.path.split('/')[1].split(delimiter);
          if (elems.length >= userIndex) {
            const folderName = elems[userIndex];
            if (map[folderName] !== null) return [map[folderName]!];
          }
          return ['hello'];
        };
        break;
    }
    props.processSubmissionsFromFiles(fileList, getStudentByFile);
  };

  const toggleUploadType = () => {
    if (uploadType === IMPORT_TYPE.zipList) setUploadType(IMPORT_TYPE.fileList);
    else setUploadType(IMPORT_TYPE.zipList);
  };

  let content;
  let title = '';
  let subtitle = '';
  switch (step) {
    case 0:
      content = (
        <StepZeroChooseType
          nextStep={nextStep}
          goBack={props.setImportOptions.bind({}, true)}
          uploadType={uploadType}
          toggleUploadType={toggleUploadType}
          delimiter={delimiter}
          onDelimiterChange={onDelimiterChange}
        />
      );
      title = `Download submissions from ${props.system}`;
      break;
    case 1:
      content = (
        <StepOneUploadZips
          nextStep={nextStep}
          rawFiles={fileList}
          setRawFiles={setRawFiles}
          goBack={() => setStep(0)}
          uploadType={uploadType}
          delimiter={delimiter}
        />
      );
      title = '';
      break;
    case 2:
      content = (
        <StepTwoSelectUserName
          nextStep={nextStep}
          setUserIndex={setUserIndexWrapper}
          folderMap={map}
          goBack={() => {
            reset();
            setStep(1);
          }}
          delimiter={delimiter}
        />
      );
      title = 'Identify student IDs';
      subtitle = "The delimited file names contain unique student ID, which we'll use to map files to students.";
      break;
    case 3:
      content = (
        <StepThreeMapStudent
          nextStep={nextStep}
          goBack={() => setStep(2)}
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
      title = 'Map student IDs to codePost emails';
      break;
    default:
      content = <div />;
      break;
  }

  return (
    <div>
      <div style={{ marginBottom: 15, marginLeft: 20 }}>
        <Typography.Title level={4}>{title}</Typography.Title>
        <div style={{ color: 'grey' }}>{subtitle}</div>
      </div>
      {content}
    </div>
  );
};

interface IStepZeroProps {
  goBack: () => void;
  nextStep: () => void;
  uploadType: IMPORT_TYPE;
  toggleUploadType: () => void;
  delimiter: string;
  onDelimiterChange: (e: RadioChangeEvent) => void;
}

const StepZeroChooseType = (props: IStepZeroProps) => {
  return (
    <div>
      <span style={{ paddingLeft: '20px' }}>
        After downloading your submissions, unzip the download (if necessary) and take a look at the files or folder
        inside. Choose the delimiter character you see.{' '}
      </span>
      <br />
      <br />
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 15 }}>
        <span style={{ marginRight: 10 }}>Delimiter:</span>
        <Radio.Group onChange={props.onDelimiterChange} value={props.delimiter}>
          <Radio value={'_'}>underscore</Radio>
          <Radio value={'-'}>dash</Radio>
        </Radio.Group>
      </div>
      <br />
      <br />
      <span style={{ paddingLeft: '20px' }}>Next, choose the folder structure that matches your download.</span>
      <br />
      <br />
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <Card style={{ marginRight: 20 }}>
          <div style={{ display: 'flex' }}>
            <Checkbox
              style={{ marginRight: 10 }}
              checked={props.uploadType === IMPORT_TYPE.zipList}
              onChange={props.toggleUploadType}
            />
            <Typography.Title level={4}>Folder of zip files</Typography.Title>
          </div>
          <ReactMarkdown>{getZipExample(props.delimiter)}</ReactMarkdown>
        </Card>
        <Card>
          <div style={{ display: 'flex' }}>
            <Checkbox
              style={{ marginRight: 10 }}
              checked={props.uploadType === IMPORT_TYPE.fileList}
              onChange={props.toggleUploadType}
            />
            <Typography.Title level={4}>Folder of files</Typography.Title>
          </div>
          <ReactMarkdown>{getFileExample(props.delimiter)}</ReactMarkdown>
        </Card>
      </div>
      <BulkUploadFooter
        backText="Back"
        onBack={props.goBack}
        forwardText="Next"
        onForward={props.nextStep}
        disableForward={false}
      />
    </div>
  );
};

// *************************************************************************************
// *************************** Step Zero: Upload Zip files  ****************************
// *************************************************************************************

interface IStepOneProps {
  goBack: () => void;
  nextStep: () => void;
  rawFiles: codePostFile[];
  uploadType: IMPORT_TYPE;
  setRawFiles: (files: codePostFile[]) => void;
  delimiter: string;
}

const StepOneUploadZips = (props: IStepOneProps) => {
  const beforeUpload = beforeLMSImport(props.rawFiles, props.uploadType === IMPORT_TYPE.zipList, props.setRawFiles);

  const exampleText =
    props.uploadType === IMPORT_TYPE.zipList ? getZipExample(props.delimiter) : getFileExample(props.delimiter);

  return (
    <div>
      <Collapse
        style={{ marginBottom: 20 }}
        activeKey={['1']}
        items={[
          {
            key: '1',
            label: 'Instructions',
            children: (
              <>
                Upload a folder of files, in the format below:
                <br />
                <br />
                <ReactMarkdown>{exampleText}</ReactMarkdown>
              </>
            ),
          },
        ]}
      />
      <Upload.Dragger showUploadList={false} directory={true} multiple={false} beforeUpload={beforeUpload}>
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
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

interface IStepTwoProps {
  goBack: () => void;
  nextStep: () => void;
  folderMap: FolderToStudentMap;
  setUserIndex: (index: number) => void;
  delimiter: string;
}
const StepTwoSelectUserName = (props: IStepTwoProps) => {
  const [sliderIndex, setSliderIndex] = useState(0);
  const [toShow, setToShow] = useState(5);

  //************* Change parent state *********
  const onContinue = () => {
    props.setUserIndex(sliderIndex);
    props.nextStep();
  };

  //************* Change component state *********
  const handleChange = (e: number) => {
    setSliderIndex(e);
  };

  const showMore = () => {
    setToShow(toShow + 5);
  };

  //************* Render utils *********

  const folders = Object.keys(props.folderMap);
  const maxIndex = folders.reduce((acc, folder) => {
    const numVals = folder.split(props.delimiter).length;
    return numVals > acc ? numVals : acc;
  }, 1);

  const shortFolders: string[] = [];
  folders.forEach((folder) => {
    const numVals = folder.split(props.delimiter).length;
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

  const highlightedStyle = { fontWeight: 600, color: colors.brandPrimary, fontSize: 16 };
  const normalStyle = { fontWeight: 400, color: 'grey', fontSize: 14 };
  const renderFolder = (f: string) => {
    const elems = f.split(props.delimiter);
    return (
      <List.Item style={{ paddingLeft: 25 }}>
        <div>
          {elems.map((el, i) => {
            return (
              <span>
                <span style={i === sliderIndex ? highlightedStyle : normalStyle}>{el}</span>
                <span>{i < elems.length - 1 ? props.delimiter : ''}</span>
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
            tooltip={{ open: false }}
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

interface IStepThreeProps {
  nextStep: () => void;
  goBack: () => void;
  folderMap: FolderToStudentMap;
  idIndex: number;
  students: string[];
  setStudent: (folderName: string, email: string) => void;
  setFolderMap: (map: FolderToStudentMap) => void;
  onUpload: () => void;
  course: Course;
}

// *************************************************************************************
// *************************** Step Two: Map the LMS id to the student *****************
// *************************************************************************************

const StepThreeMapStudent = (props: IStepThreeProps) => {
  const [editMode, setEditMode] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [newMapping, setNewMapping] = useState<{ [id: string]: string | null | undefined }>({});
  const [loading, setLoading] = useState(true);
  const [isGuessing, setIsGuessing] = useState(false);

  const didMountRef = React.useRef(false);

  const guessMapping = () => {
    setIsGuessing(true);
    Object.keys(props.folderMap).forEach((folderName) => {
      const id = getIdentifierFromFolder(folderName, props.idIndex);
      let guess = '';

      // First, figure out if we have an exact match
      // i.e., <id>@school.edu
      for (let i = 0; i < props.students.length; i++) {
        const student = props.students[i];
        if (student.split('@')[0] === id) {
          guess = student;
          break;
        }
      }

      // if we haven't found an exact match, find the closest match
      if (guess.length === 0) {
        let minDist = 1000;
        const DIST_THRESHOLD = 6;
        for (let i = 0; i < props.students.length; i++) {
          const student = props.students[i];
          const thisDist = stringDistance(student.split('@')[0], id);
          if (thisDist < minDist && thisDist < DIST_THRESHOLD) {
            guess = student;
            minDist = thisDist;
          }
        }
      }

      props.setStudent(folderName, guess);
    });
    setIsGuessing(false);
  };

  React.useEffect(() => {
    const fetchMap = async () => {
      setLoading(true);
      const response = await coursesApi.rosterMapRetrieve({ id: props.course.id });
      setNewMapping(response.rosterMap ?? {});
    };
    fetchMap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
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
        const email = newMapping[identifier];
        if (email) {
          props.setStudent(folderNameByID[identifier], email);
          studentsMatched += 1;
        }
      }
    });

    // If all students have been matched, turn off edit mode
    if (studentsMatched === props.students.length) {
      setEditMode(false);
    }
    if (didMountRef.current) {
      setLoading(false);
    } else {
      didMountRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newMapping]);

  interface MappingRow {
    name: string;
    identifier: string;
    email: React.ReactNode;
    emailValue: string | undefined;
  }

  const columns = [
    {
      title: 'File name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: MappingRow, b: MappingRow) => a.name.localeCompare(b.name),
    },
    {
      title: 'Student ID',
      dataIndex: 'identifier',
      key: 'identifier',
      sorter: (a: MappingRow, b: MappingRow) => a.identifier.localeCompare(b.identifier),
      defaultSortOrder: 'ascend' as const,
    },
    {
      title: 'codePost email',
      dataIndex: 'email',
      key: 'email',
      sorter: (a: MappingRow, b: MappingRow) => {
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

    const lastOption = <Select.Option value={undefined}> </Select.Option>;
    const studentEmail = !editMode ? (
      <span>{props.folderMap[folderName] || undefined}</span>
    ) : (
      <Select
        value={props.folderMap[folderName] || undefined}
        showSearch={true}
        onChange={(e: string) => props.setStudent(folderName, e)}
        style={{ minWidth: 250 }}
        allowClear={true}
      >
        {props.students
          .map((student) => {
            const isDisabled = mappedStudents.includes(student);
            return (
              <Select.Option key={isDisabled ? 1 : -1} value={student} disabled={isDisabled}>
                {student}
              </Select.Option>
            );
          })
          .sort((a, b) => {
            const aKey = a.key ?? 0;
            const bKey = b.key ?? 0;
            return Number(aKey) - Number(bKey);
          })}
        {lastOption}
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
    // Save the map in api, so users don't lose their work
    // Generated client expects PatchCourse but legacy sends rosterMap which is not in PatchCourse definition.
    // Casting to any or PatchCourse to bypass.
    await coursesApi.rosterMapPartialUpdate({
      id: props.course.id,
      patchedCourseRosterMap: { rosterMap: newMap },
    });
    setNewMapping(newMap);
    setShowUpload(false);
    message.success('Mapping saved!');
  };

  const onUpload = async () => {
    // Save the map in the api, in case updates were made via selectors
    const latestMap: Record<string, string | null> = {};
    Object.keys(props.folderMap).forEach((folderName) => {
      if (props.folderMap[folderName]) {
        const id = getIdentifierFromFolder(folderName, props.idIndex);
        latestMap[id] = props.folderMap[folderName];
      }
    });

    await coursesApi.rosterMapPartialUpdate({
      id: props.course.id,
      patchedCourseRosterMap: { rosterMap: latestMap },
    });
    props.onUpload();
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
            valueStyle={{ color: colors.brandPrimary }}
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
          <span>
            <Button onClick={() => setShowUpload(true)} style={{ marginBottom: 10 }}>
              <UploadOutlined /> Upload a mapping
            </Button>{' '}
            &nbsp;
            <Tooltip title="Let codePost try to match IDs with student emails.">
              <Button type="primary" onClick={guessMapping} loading={isGuessing}>
                <RocketOutlined /> Guess
              </Button>
            </Tooltip>
          </span>
        ) : (
          <Button type="default" onClick={() => setEditMode(true)}>
            <EditOutlined /> Edit
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
        onForward={onUpload}
        disableForward={mappedStudents.length === 0}
        confirmText={
          mappedStudents.length !== Object.keys(props.folderMap).length
            ? "Some students haven't been mapped. Are you sure you want to do a partial save? You can come back later and add the missing students."
            : undefined
        }
      />
    </div>
  );
};
