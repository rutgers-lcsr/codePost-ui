// react imports
import { useState } from 'react';

// library imports
import { Button } from 'antd';

// codePost util imports
import { codeMirorLanguageMap } from './languageUtils';

import useHotkeys, { S_KEY } from '../../../../../code-review/useHotkeys';
import Editor from '@monaco-editor/react';

type themeType = 'light' | 'dark';

interface IProps {
  code: string;
  name: string;
  onSave?: (code: string) => Promise<void>;
  onChange?: (code: string) => void;
  onDelete?: () => void;
  theme?: themeType;
  height?: string;
}

export const CodeWindow = (props: IProps) => {
  // ************************** State Variables ******************************
  const [editedCode, setEditedCode] = useState(props.code);
  const [prevCode, setPrevCode] = useState(props.code);
  const [isSaving, setIsSaving] = useState(false);

  if (props.code !== prevCode) {
    setPrevCode(props.code);
    setEditedCode(props.code);
  }
  // ******************************* State change functions  *******************************
  // const onEdit = () => {
  //   setEditedCode(props.code);
  // };

  const onSave = async () => {
    if (props.onSave) {
      setIsSaving(true);
      await props.onSave(editedCode.replace('\\r', ''));
      setIsSaving(false);
    }
  };

  useHotkeys(S_KEY, onSave);

  // ******************************* Util functions  *******************************
  const getMode = () => {
    let extension: string;
    if (props.name.includes('.')) {
      extension = props.name.split('.')[1].replace('.', '');
    } else {
      extension = props.name;
    }
    if (extension in codeMirorLanguageMap) {
      return codeMirorLanguageMap[extension];
    } else return 'txt';
  };

  // ******************************* Return  *******************************
  return (
    <div
      style={{
        fontSize: 12,
        minWidth: 300,
        width: '100%',
        position: 'relative',
        height: props.height || undefined,
        paddingTop: 30,
      }}
    >
      {!props.onChange && (
        <Button
          style={{ position: 'absolute', right: 15, top: '-10px', zIndex: 100 }}
          type={'primary'}
          ghost={!props.onSave}
          onClick={onSave}
          loading={isSaving}
          disabled={!props.onSave || props.code === editedCode}
        >
          {props.onSave ? 'Save [⌘+S]' : 'Editing is Disabled'}
        </Button>
      )}

      <Editor
        height={props.height || '100%'}
        width="100%"
        language={getMode()}
        value={props.onSave ? editedCode : props.code}
        onChange={(value) => {
          if (!value) return;
          setEditedCode(value);
          if (props.onChange) {
            props.onChange(value);
          }
        }}
        options={{
          automaticLayout: true,
          minimap: { enabled: false },
          readOnly: !(props.onSave || props.onChange) || isSaving,
        }}
        theme={props.theme === 'dark' ? 'vs-dark' : 'light'}
      />
    </div>
  );
};
