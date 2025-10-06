import { DeleteOutlined, UploadOutlined } from '@ant-design/icons';

import { Button, message, Upload } from 'antd';

interface IProps {
  isReplacement: boolean;
  updateTemplate: (code: string) => void;
  fileName: string;
}

const UploadFileTemplates = (props: IProps) => {
  const onChange = (info: any) => {
    if (info.file.status === 'done') {
      message.success(`${info.file.name} file uploaded successfully`);
    } else if (info.file.status === 'error') {
      message.error(`${info.file.name} file upload failed.`);
    }
  };

  const customRequest = async (r: any) => {
    if (r.file.name !== props.fileName) {
      r.onError();
      message.error(`Upload failed. You must upload a file called ${props.fileName}`);
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      if (reader.result) {
        props.updateTemplate(reader.result as string);
        r.onSuccess(props.fileName, r.file);
      } else {
        message.error(`${r.file.name} cannot be uploaded because it is empty.`);
        r.onError();
      }
    };
    reader.readAsText(r.file);
  };

  return (
    // @ts-ignore
    <div>
      <Upload showUploadList={false} onChange={onChange} customRequest={customRequest}>
        <Button>
          <UploadOutlined /> {props.isReplacement ? 'Replace' : 'Upload'}
        </Button>
      </Upload>
      &nbsp; {props.isReplacement ? <DeleteOutlined onClick={() => props.updateTemplate('')} /> : ''}
    </div>
  );
};

export default UploadFileTemplates;
