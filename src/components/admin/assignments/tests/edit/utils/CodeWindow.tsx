// react imports
import { useEffect, useState } from 'react';

// library imports
import { Button } from 'antd';
import { Controlled as CodeMirror } from 'react-codemirror2';

// codePost util imports
import { codeMirorLanguageMap } from './languageUtils';

import useHotkeys, { S_KEY } from '../../../../../code-review/useHotkeys';

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
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setEditedCode(props.code);
  }, [props.code]);
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

  const onBeforeChange = (_editor: any, _data: any, value: string) => {
    if (props.onChange) {
      props.onChange(value);
    }
    setEditedCode(value);
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
      }}
    >
      {!props.onChange && (
        <Button
          style={{ position: 'absolute', right: 15, top: '-34px', zIndex: 100 }}
          type={'primary'}
          ghost={!props.onSave}
          onClick={onSave}
          loading={isSaving}
          disabled={!props.onSave || props.code === editedCode}
        >
          {props.onSave ? 'Save [⌘+S]' : 'Editing is Disabled'}
        </Button>
      )}
      <CodeMirror
        key={`codeMirror`}
        onBeforeChange={onBeforeChange}
        value={props.onSave ? editedCode : props.code}
        options={{
          lineNumbers: true,
          lineWrapping: true,
          mode: getMode(),
          theme: props.theme && props.theme === 'dark' ? 'material' : 'neo',
          styleActiveLine: { nonEmpty: true },
          readOnly: !(props.onSave || props.onChange) || isSaving,
        }}
      />
    </div>
  );
};
