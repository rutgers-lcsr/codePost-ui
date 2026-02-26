// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
// react imports
import { useState } from 'react';

// library imports
import { Button } from 'antd';

// codePost util imports
import { codeMirorLanguageMap } from './languageUtils';

import useHotkeys, { S_KEY } from '@code-review/useHotkeys';
import Editor, { EditorProps } from '@monaco-editor/react';
import { osControlKey } from '../../../../../core/operatingSystem';
import { File } from '../../../../../../utils/file';

type themeType = 'light' | 'dark';

interface IProps {
  code: string;
  name: string;
  onSave?: (code: string) => Promise<void>;
  onChange?: (code: string) => void;
  onDelete?: () => void;
  theme?: themeType;
  height?: string;
  onMount?: (editor: any, monaco: any) => void;
  language?: EditorProps['language'];
}

export const CodeWindow = (props: IProps) => {
  // ************************** State Variables ******************************
  const [editedCode, setEditedCode] = useState(props.code);
  const [prevCode, setPrevCode] = useState(props.code);
  const [isSaving, setIsSaving] = useState(false);

  if (props.code !== prevCode && props.code !== editedCode) {
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
    if (props.language) {
      return props.language;
    }
    const extension = File.extension(props.name);
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
        height: props.height || '100%',
        paddingTop: props.onChange ? 0 : 30, // Only pad if button might show (read-only mode usually)
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
          {props.onSave ? `Save [${osControlKey()}+S]` : 'Editing is Disabled'}
        </Button>
      )}

      <Editor
        height="100%"
        width="100%"
        language={getMode()}
        options={{
          automaticLayout: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          readOnly: !(props.onSave || props.onChange) || isSaving,
        }}
        value={props.onSave ? editedCode : props.code}
        onChange={(value) => {
          setEditedCode(value || '');
          if (props.onChange) {
            props.onChange(value || '');
          }
        }}
        onMount={props.onMount}
        theme={props.theme === 'dark' ? 'vs-dark' : 'light'}
      />
    </div>
  );
};
