// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';

import { getFileContent, type AssignmentFileType, type FileType } from '../../../utils/file';

import { ConsoleThemeContext } from '../../../styles/abstracts/_console-theme-context';

interface ITemplateCodeProps {
  file: FileType;
  assignmentFile: AssignmentFileType;
}

const TemplateCode = (props: ITemplateCodeProps) => {
  const { consoleTheme } = React.useContext(ConsoleThemeContext);
  if (!props.assignmentFile || !props.assignmentFile.data) {
    return <div />;
  }
  const tokens = props.assignmentFile.data.split('\n').filter((l: string) => {
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

      for (const t of tokens) {
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
  return <div>{linesOfCode(getFileContent(props.file))}</div>;
};

export default TemplateCode;
