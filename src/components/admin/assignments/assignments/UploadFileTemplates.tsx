// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, message, Upload } from 'antd';
import type { RcFile, UploadChangeParam, UploadFile } from 'antd/es/upload/interface';
import React, { useCallback } from 'react';

interface IProps {
  isReplacement: boolean;
  updateTemplate: (code: string) => void;
  fileName: string;
}

interface CustomRequestOptions {
  file: RcFile;
  onSuccess: (body: unknown, file: RcFile) => void;
  onError: (error: Error) => void;
}

const UploadFileTemplates: React.FC<IProps> = ({ isReplacement, updateTemplate, fileName }) => {
  const onChange = useCallback((info: UploadChangeParam<UploadFile>) => {
    if (info.file.status === 'done') {
      message.success(`${info.file.name} file uploaded successfully`);
    } else if (info.file.status === 'error') {
      message.error(`${info.file.name} file upload failed.`);
    }
  }, []);

  const customRequest = useCallback(
    async (options: CustomRequestOptions) => {
      const { file, onSuccess, onError } = options;

      if (file.name !== fileName) {
        onError(new Error(`Upload failed. You must upload a file called ${fileName}`));
        message.error(`Upload failed. You must upload a file called ${fileName}`);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          updateTemplate(reader.result as string);
          onSuccess(fileName, file);
        } else {
          const error = new Error(`${file.name} cannot be uploaded because it is empty.`);
          message.error(error.message);
          onError(error);
        }
      };
      reader.readAsText(file);
    },
    [fileName, updateTemplate],
  );

  const handleClearTemplate = useCallback(() => {
    updateTemplate('');
  }, [updateTemplate]);

  return (
    <div>
      <Upload showUploadList={false} onChange={onChange} customRequest={customRequest as any}>
        <Button>
          <UploadOutlined /> {isReplacement ? 'Replace' : 'Upload'}
        </Button>
      </Upload>
      {isReplacement && (
        <>
          &nbsp; <DeleteOutlined onClick={handleClearTemplate} style={{ cursor: 'pointer' }} />
        </>
      )}
    </div>
  );
};

export default UploadFileTemplates;
