import React, { useState } from 'react';

import { Button, Icon, List, Upload, Slider, Select, Steps, Table, Typography } from 'antd';

import { UploadFile } from 'antd/lib/upload/interface';

import { codePostFile, IProtoFileUpload, fileToProtoFileUpload, readZipTopLevel } from './FileReader';

interface IUploadFormProps {
  rawFiles: codePostFile[];
  setRawFiles: any;
  processSubmissionsFromFiles: (
    files: codePostFile[],
    getStudentsFromFile: (file: IProtoFileUpload) => string[],
  ) => void;
  students: string[];
  mode?: string;
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
            console.log(cPFile);
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
      subtitle = 'This is to identify the canvas ID to which this submission belongs to.';
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
        />
      );
      title = 'Map the canvas unique identifier to codePost emails';
      break;
    default:
      content = <div />;
      break;
  }

  return (
    <div>
      <Typography.Title level={4} style={{ marginBottom: 15 }}>
        {title}
      </Typography.Title>
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
}

const StepTwoMapStudent = (props: IStepTwoProps) => {
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

  const data = Object.keys(props.folderMap).map((folderName) => {
    const elems = folderName.split('_');
    const id = elems.length < props.idIndex + 1 ? elems[elems.length - 1] : elems[props.idIndex];

    const studentSelect = (
      <Select onChange={(e: string) => props.setStudent(folderName, e)}>
        {props.students.map((student) => (
          <Select.Option value={student}>{student}</Select.Option>
        ))}
      </Select>
    );

    return {
      name: folderName,
      identifier: id,
      email: studentSelect,
    };
  });

  return (
    <div>
      <Button onClick={props.onUpload}>Upload</Button>
      <Table columns={columns} dataSource={data} />
    </div>
  );
};
