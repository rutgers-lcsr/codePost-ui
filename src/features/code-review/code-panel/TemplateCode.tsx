// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';

import { getFileContent, type AssignmentFileType, type FileType } from '../../../utils/file';

import { ConsoleThemeContext } from '../../../styles/abstracts/_console-theme-context';

interface ITemplateCodeProps {
  file: FileType;
  assignmentFile: AssignmentFileType;
}

const TemplateCode = React.memo((props: ITemplateCodeProps) => {
  const { consoleTheme } = React.useContext(ConsoleThemeContext);

  const fileContent = getFileContent(props.file);
  const assignmentData = props.assignmentFile?.data ?? '';

  const tokens = React.useMemo(
    () =>
      assignmentData
        ? assignmentData.split('\n').filter((l: string) => {
            if (l.trim().length > 2) return true;
            if (l.trim() === '*' || l.trim() === '#') return true;
            return false;
          })
        : [],
    [assignmentData],
  );

  const tokenSet = React.useMemo(() => new Set(tokens.map((t) => t.trim())), [tokens]);

  const renderedLines = React.useMemo(
    () =>
      fileContent.split('\n').map((text: string, i: number) => {
        const templatized = tokenSet.has(text.trim());
        return (
          <div
            key={i}
            id={`template-line-${i}`}
            style={{ color: templatized ? consoleTheme.templateCode : 'transparent' }}
          >
            {text === '' ? ' ' : text}
          </div>
        );
      }),
    [fileContent, tokenSet, consoleTheme.templateCode],
  );

  if (!props.assignmentFile || !assignmentData) {
    return <div />;
  }

  return <div>{renderedLines}</div>;
});

TemplateCode.displayName = 'TemplateCode';

export default TemplateCode;
