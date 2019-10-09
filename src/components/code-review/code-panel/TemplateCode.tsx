import * as React from 'react';

import { FileType } from '../../../infrastructure/file';
import { FileTemplateType } from '../../../infrastructure/fileTemplate';

import { ConsoleThemeContext } from '../../../styles/abstracts/_console-theme-context';

interface ITemplateCodeProps {
  file: FileType;
  fileTemplate: FileTemplateType;
}

const TemplateCode = (props: ITemplateCodeProps) => {
  const { consoleTheme } = React.useContext(ConsoleThemeContext);

  const tokens = props.fileTemplate.code.split('\n').filter((l: string) => {
    if (l.trim().length > 2) {
      return true;
    }

    if (l.trim() === '*' || l.trim() === '#') {
      return true;
    }

    return false;
  });

  const linesOfCode = (code: string) => {
    return code.split('\n').map((text: string, i: number) => {
      let templatized = false;

      for (let t of tokens) {
        if (t.trim() === text.trim()) {
          templatized = true;
          break;
        }
      }

      return (
        <div
          key={i}
          id={`template-line-${i}`}
          style={{ color: templatized ? consoleTheme.templateCode : 'transparent' }}
        >
          {text === '' ? ' ' : text}
        </div>
      );
    });
  };
  return <div>{linesOfCode(props.file.code)}</div>;
};

export default TemplateCode;
