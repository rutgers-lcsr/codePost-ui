import React, { useState } from 'react';

import { Controlled as CodeMirror } from 'react-codemirror2';

import { languageMap } from './codemirrorLanguages';

import { Button } from 'antd';

interface IProps {
  code: string;
  extension: string;
  onSave?: (hello: string) => Promise<void>;
  onChange?: (hello: string) => void;
}

export const CodeWindow = (props: IProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedCode, setEditedCode] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const onEdit = () => {
    setIsEditing(true);
    setEditedCode(props.code);
  };

  const onSave = async () => {
    if (props.onSave) {
      setIsSaving(true);
      await props.onSave(editedCode);
      setIsSaving(false);
      setIsEditing(false);
      setEditedCode('');
    }
  };

  const onBeforeChange = (editor: any, data: any, value: string) => {
    if (props.onChange) {
      props.onChange(value);
    }
    console.log('here');
    setEditedCode(value);
  };

  const getMode = () => {
    const extension = props.extension.replace('.', '');
    console.log(extension);
    if (extension in languageMap) {
      console.log(languageMap[extension]);
      return languageMap[extension];
    } else return 'txt';
  };

  return (
    <div>
      <CodeMirror
        key={`codeMirror`}
        onBeforeChange={onBeforeChange}
        value={isEditing && props.onSave ? editedCode : props.code}
        options={{
          lineNumbers: true,
          lineWrapping: true,
          mode: getMode(),
          theme: 'neo',
          readOnly: props.onSave && (!isEditing || isSaving),
        }}
      />
      {props.onSave && (
        <Button
          style={{ position: 'absolute', zIndex: 999999, bottom: 15, right: 15 }}
          type={isEditing ? 'primary' : 'default'}
          onClick={isEditing ? onSave : onEdit}
          loading={isSaving}
        >
          {isEditing ? 'Save' : 'Edit'}
        </Button>
      )}
    </div>
  );
};
