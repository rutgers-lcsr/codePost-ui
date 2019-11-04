// react imports
import React, { useState } from 'react';

// library imports
import { Controlled as CodeMirror } from 'react-codemirror2';
import { Button } from 'antd';

// codePost other imports
import { codeMirorLanguageMap } from './languageUtils';

interface IProps {
  code: string;
  name: string;
  onSave?: (code: string) => Promise<void>;
  onChange?: (code: string) => void;
}

export const CodeWindow = (props: IProps) => {
  // ************************** State Variables ******************************
  const [isEditing, setIsEditing] = useState(false);
  const [editedCode, setEditedCode] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // ******************************* State change functions  *******************************
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
    setEditedCode(value);
  };

  // ******************************* Util functions  *******************************
  const getMode = () => {
    const extension = props.name.split('.')[1].replace('.', '');
    if (extension in codeMirorLanguageMap) {
      return codeMirorLanguageMap[extension];
    } else return 'txt';
  };

  // ******************************* Return  *******************************
  return (
    <div style={{ fontSize: 12, minWidth: 300, position: 'relative' }}>
      <CodeMirror
        key={`codeMirror`}
        onBeforeChange={onBeforeChange}
        value={isEditing && props.onSave ? editedCode : props.code}
        options={{
          lineNumbers: true,
          lineWrapping: true,
          mode: getMode(),
          theme: 'neo',
          styleActiveLine: { nonEmpty: true },
          readOnly: props.onSave && (!isEditing || isSaving),
        }}
      />
      {props.onSave && (
        <Button
          style={{ position: 'absolute', zIndex: 100, bottom: 15, right: 15 }}
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
