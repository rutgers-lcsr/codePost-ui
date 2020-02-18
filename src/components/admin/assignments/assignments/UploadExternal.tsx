import React, { useState } from 'react';

import {
  Alert,
  Button,
  Icon,
  Input,
  List,
  message,
  Modal,
  Upload,
  Slider,
  Select,
  Statistic,
  Table,
  Typography,
} from 'antd';

import { UploadFile } from 'antd/lib/upload/interface';

import { codePostFile, IProtoFileUpload, fileToProtoFileUpload, readZipTopLevel } from './FileReader';

import { CourseType } from '../../../../infrastructure/types';

import LogViewer from '../../..//core/LogViewer';
import { Course } from '../../../../infrastructure/course';

interface IUploadFormProps {
  rawFiles: codePostFile[];
  setRawFiles: any;
  processSubmissionsFromFiles: (
    files: codePostFile[],
    getStudentsFromFile: (file: IProtoFileUpload) => string[],
  ) => void;
  students: string[];
  mode?: string;
  course: CourseType;
}

const beforeUploadDirectory = (files: UploadFile[], callback: any) => {
  const beforeUpload = async (file: File, fileList: File[]) => {
    let newList: codePostFile[] = [];
    if (fileList.length > 1) {
      // Case 1: use has selected a folder via menu, which will place all files into
      // fileList
      const promises = fileList.map(async (thisFile) => {
        console.log('THIS FILE', thisFile);
        if (thisFile.name.endsWith('.zip')) {
          const unzippedFiles = await readZipTopLevel(thisFile);
          const protoFiles = unzippedFiles.map((f: File) => {
            console.log(f);
            // We can't set the path of a file, so need to do a path override
            // @ts-ignore
            // console.log(JSON.parse(f.toString()));
            const cPFile: codePostFile = new File([f], f.name);

            cPFile['uid'] = '';
            // @ts-ignore
            cPFile['pathOverride'] = `${thisFile.webkitRelativePath}/${f.name}`;
            return cPFile;
          });
          newList.push(...protoFiles);
        }
        return Promise.resolve();
      });
      await Promise.all(promises);
      console.log(newList);
      const filesToSet = [...files, ...newList];

      callback(filesToSet);
    } else {
      // Case 2: user drags in a folder. This will cause each file to uploaded such that fileList
      // contains only one file at a time. So add these files one-by-one to state.rawFiles

      if (file.name.endsWith('.zip')) {
        const unzippedFiles = await readZipTopLevel(file);
        console.log(unzippedFiles);
        const filteredFiles = unzippedFiles.filter((file: File) => {
          const protoFileUpload: IProtoFileUpload = fileToProtoFileUpload(file);
          return protoFileUpload.path.split('/').length > 1;
        });
        callback([...files, filteredFiles]);
      }
    }

    // prevent upload
    return Promise.reject();
  };

  return beforeUpload;
};

interface FolderToStudentMap {
  [folderName: string]: string | null;
}

export const UploadFlow = (props: IUploadFormProps) => {
  const [step, setStep] = useState(0);
  const [fileList, setFileList] = useState<codePostFile[]>([]);
  const [map, setMap] = useState<FolderToStudentMap>({});
  const [userIndex, setUserIndex] = useState(0);

  const nextStep = () => {
    if (step < 2) {
      setStep(step + 1);
    }
  };

  const setRawFiles = (files: codePostFile[]) => {
    console.log(files);
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
    console.log(map);
    const getStudentByFile = (el: IProtoFileUpload) => {
      console.log(el);
      console.log(el.path);
      console.log(map);
      const folderName = el.path.split('/')[1];
      console.log('value', map[folderName]);
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
      content = <StepZeroUploadZips nextStep={nextStep} rawFiles={fileList} setRawFiles={setRawFiles} />;
      title = '';
      break;
    case 1:
      content = <StepOneSelectUserName nextStep={nextStep} setUserIndex={setUserIndex} folderMap={map} />;
      title = "Select the student's unique identifier";
      subtitle = 'This is to identify the LMS ID from the file name.';
      break;
    case 2:
      content = (
        <StepTwoMapStudent
          nextStep={nextStep}
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

interface IStepZeroProps {
  nextStep: () => void;
  rawFiles: codePostFile[];
  setRawFiles: (files: codePostFile[]) => void;
}

const StepZeroUploadZips = (props: IStepZeroProps) => {
  const beforeUpload = beforeUploadDirectory(props.rawFiles, props.setRawFiles);
  return (
    <div>
      <Upload.Dragger showUploadList={false} directory={true} multiple={false} beforeUpload={beforeUpload}>
        <p className="ant-upload-drag-icon">
          <Icon type="inbox" />
        </p>
        <p className="ant-upload-text">Click or drag a folder to upload</p>
        <p className="ant-upload-hint">Make sure you use the format specified in the Instructions above.</p>
      </Upload.Dragger>
    </div>
  );
};

interface IStepOneProps {
  nextStep: () => void;
  folderMap: FolderToStudentMap;
  setUserIndex: (index: number) => void;
}
const StepOneSelectUserName = (props: IStepOneProps) => {
  const [sliderIndex, setSliderIndex] = useState(0);
  const [toShow, setToShow] = useState(10);

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
    setToShow(toShow + 10);
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
        <div style={{ width: 'calc(100% - 100px)', padding: '0px 25px' }}>
          <Slider
            tooltipVisible={false}
            min={0}
            max={maxIndex - 1}
            dots={true}
            onChange={handleChange}
            value={sliderIndex}
          />
        </div>
        <Button type="primary" onClick={onContinue} style={{ marginLeft: 20 }}>
          <Icon type="check" />
          Select
        </Button>
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
    </div>
  );
};

interface IStepTwoProps {
  nextStep: () => void;
  folderMap: FolderToStudentMap;
  idIndex: number;
  students: string[];
  setStudent: (folderName: string, email: string) => void;
  setFolderMap: (map: FolderToStudentMap) => void;
  onUpload: () => void;
  course: CourseType;
}

const StepTwoMapStudent = (props: IStepTwoProps) => {
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
    Object.keys(props.folderMap).forEach((folderName) => {
      const id = getIdentifierFromFolder(folderName, props.idIndex);
      folderNameByID[id] = folderName;
    });
    Object.keys(newMapping).forEach((identifier) => {
      if (identifier in folderNameByID && identifier in newMapping) {
        props.setStudent(folderNameByID[identifier], newMapping[identifier]);
      }
    });
    setLoading(false);
  }, [newMapping]);

  const columns = [
    {
      title: 'Zip Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Student identifier',
      dataIndex: 'identifier',
      key: 'identifier',
    },
    {
      title: 'codePost email',
      dataIndex: 'email',
      key: 'email',
    },
  ];

  const mappedStudents = Object.keys(props.folderMap)
    .filter((folderName) => props.folderMap[folderName])
    .map((folderName) => props.folderMap[folderName]);

  const data = Object.keys(props.folderMap).map((folderName) => {
    const id = getIdentifierFromFolder(folderName, props.idIndex);
    const studentSelect = (
      <Select
        value={props.folderMap[folderName] || undefined}
        onChange={(e: string) => props.setStudent(folderName, e)}
        style={{ minWidth: 250 }}
      >
        {props.students.map((student) => (
          <Select.Option value={student} disabled={mappedStudents.includes(student)}>
            {student}
          </Select.Option>
        ))}
      </Select>
    );

    return {
      name: folderName,
      identifier: id,
      email: studentSelect,
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
      <div style={{ display: 'flex', justifyContent: 'center' }}>
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
        <Button type="primary" onClick={() => setShowUpload(true)} style={{ marginBottom: 10 }}>
          Upload a mapping
        </Button>
      </div>
      <MappingUpload
        isVisible={showUpload}
        onCancel={() => setShowUpload(false)}
        onSave={onRosterSave}
        folderMap={props.folderMap}
        idIndex={props.idIndex}
        students={props.students}
      />
      <Table columns={columns} pagination={{ pageSize: 10 }} dataSource={data} />
      <div style={{ float: 'right' }}>
        <Button
          onClick={props.onUpload}
          disabled={mappedStudents.length !== Object.keys(props.folderMap).length}
          type="primary"
        >
          Next
        </Button>
      </div>
    </div>
  );
};

interface IMappingUploadProps {
  onSave: (newMapping: { [id: string]: string }) => void;
  onCancel: () => void;
  isVisible: boolean;
  folderMap: FolderToStudentMap;
  idIndex: number;
  students: string[];
}

const MappingUpload = (props: IMappingUploadProps) => {
  const [stringMap, setStringMap] = useState(folderMapToString(props.folderMap, props.idIndex));
  const [errors, setErrors] = useState<string[]>([]);

  React.useEffect(() => {
    setStringMap(folderMapToString(props.folderMap, props.idIndex));
  }, [props.isVisible]);

  const downloadTemplate = () => {
    const a = document.createElement('a');
    a.href = `data:text/csv;charset=utf-8,${encodeURIComponent(folderMapToString(props.folderMap, props.idIndex))}`;
    a.download = `Roster_Mapping.csv`;
    document.body.appendChild(a);
    a.click();
  };

  const beforeUpload = (file: any, fileList: any) => {
    const reader = new FileReader();
    reader.onload = () => {
      console.log(typeof reader.result);
      if (typeof reader.result === 'string') {
        console.log(reader.result);
        setStringMap(reader.result);
      }
    };
    reader.readAsText(file);

    // prevent Ant upload component from trying to post file
    return false;
  };

  const validateMapping = () => {
    const errors: string[] = [];
    const rows = stringMap.split('\n');
    const validRows: { [email: string]: string } = {};
    const identifierList = Object.keys(props.folderMap).map((folderName) =>
      getIdentifierFromFolder(folderName, props.idIndex),
    );

    rows.forEach((row) => {
      if (!row.match(/\w+,\w+/g)) {
        errors.push(`Row doesn't match <identifier>,<email> syntax: ${row}`);
        return;
      }
      const [identifier, email] = row.split(',');

      if (!identifierList.includes(identifier)) {
        errors.push(`Identifier ${identifier} not in list of folder names.`);
        return;
      }
      if (!props.students.includes(email)) {
        errors.push(`Student ${email} not enrolled in this course.`);
        return;
      }

      if (identifier in validRows) {
        errors.push(`Identifier ${identifier} included twice in csv.`);
        return;
      }

      if (Object.values(validRows).includes(email)) {
        errors.push(`Student ${email} included twice in csv.`);
        return;
      }

      validRows[identifier] = email;
    });

    setErrors(errors);
    if (errors.length === 0) {
      props.onSave(validRows);
      props.onCancel();
    }
  };

  const saveBtn = <Button onClick={validateMapping}>Save</Button>;

  return (
    <Modal title="Upload a mapping" visible={props.isVisible} onCancel={props.onCancel} footer={[saveBtn]}>
      <Alert
        type="info"
        message="You only need to create this mapping once. When you save it, this csv will be stored in your course, and will be
              automatically used for future uploads."
        style={{ marginBottom: 15 }}
      />
      {errors.length > 0 && (
        <div>
          Errors:
          <LogViewer text={errors.join('\n')} />
        </div>
      )}
      <div style={{ marginBottom: 10, float: 'right' }}>
        <Button type="default" onClick={downloadTemplate} style={{ marginRight: 5 }}>
          <Icon type="download" /> Download .csv template
        </Button>
        <Upload beforeUpload={beforeUpload} showUploadList={false}>
          <Button type="primary">
            <Icon type="upload" /> Upload a .csv file
          </Button>
        </Upload>
      </div>
      <Input.TextArea rows={6} value={stringMap} onChange={(e: any) => setStringMap(e.target.value)} />
    </Modal>
  );
};

// Helpers
const getIdentifierFromFolder = (folderName: string, idIndex: number) => {
  const elems = folderName.split('_');
  return elems.length < idIndex + 1 ? elems[elems.length - 1] : elems[idIndex];
};

const folderMapToString = (folderMap: FolderToStudentMap, idIndex: number) => {
  const stringArr = Object.keys(folderMap).map((folderName) => {
    const identifier = getIdentifierFromFolder(folderName, idIndex);
    return `${identifier},${folderMap[folderName] || ''}`;
  });
  return stringArr.join('\n');
};
