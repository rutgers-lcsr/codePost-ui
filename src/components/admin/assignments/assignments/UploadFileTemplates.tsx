import * as React from 'react';

import { Button, Icon, message, Spin, Upload } from 'antd';

import { File } from '../../../../infrastructure/file';
import { FileTemplate, FileTemplateType } from '../../../../infrastructure/fileTemplate';

const UploadFileTemplates = (props: any) => {
  // @ts-ignore
  const [defaultFileList, setDefaultFileList] = React.useState<any>(undefined);

  React.useEffect(() => {
    const ft = props.assignment.fileTemplates.map((fileTemplateID: number) => {
      return FileTemplate.read(fileTemplateID);
    });
    // @ts-ignore
    Promise.all(ft).then((fileTemplates: FileTemplateType[]) => {
      const defaultFiles = fileTemplates.map((fileTemplate: FileTemplateType) => {
        return {
          uid: fileTemplate.id,
          name: fileTemplate.name,
          status: 'done',
        };
      });
      // @ts-ignore
      setDefaultFileList(defaultFiles);
    });

    return () => {};
  }, []);

  const onChange = (info: any) => {
    if (info.file.status === 'done') {
      message.success(`${info.file.name} file uploaded successfully`);
    } else if (info.file.status === 'error') {
      message.error(`${info.file.name} file upload failed.`);
    }
  };

  const onRemove = async (fileTemplate: any) => {
    await FileTemplate.delete(fileTemplate.uid);
  };

  const customRequest = async (r: any) => {
    if (r.file.name[0] === '.') {
      r.onError();
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      if (reader.result) {
        const fileTemplate = {
          id: -1,
          name: r.file.name,
          code: reader.result as string,
          extension: File.extension(r.file.name),
          path: '',
          assignment: props.assignment.id,
        };

        const ft = await FileTemplate.create(fileTemplate);
        r.onSuccess(ft, r.file);
      } else {
        message.error(`${r.file.name} cannot be uploaded because it is empty.`);
        r.onError();
      }
    };
    reader.readAsText(r.file);
  };

  if (defaultFileList === undefined) {
    return <Spin />;
  }

  return (
    // @ts-ignore
    <Upload defaultFileList={defaultFileList} onChange={onChange} onRemove={onRemove} customRequest={customRequest}>
      <Button>
        <Icon type="upload" /> Click to Upload
      </Button>
    </Upload>
  );
};

export default UploadFileTemplates;
