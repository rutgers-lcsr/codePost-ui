import * as React from 'react';

import { ICodeContentCoreProps, ICodeContentEditProps } from './CodeContent';

import CodePanelHighlighting from './CodePanelHighlighting';

import { AssignmentType } from '../../../infrastructure/assignment';
import { FileType } from '../../../infrastructure/file';
import { FileTemplateType } from '../../../infrastructure/fileTemplate';

import { ConsoleThemeContext } from '../../../styles/abstracts/_console-theme-context';

// interface ICodeProps {
//   commentCounter: number;
// }

const template = `/******************************************************************************
 *
 *  Description:  Includes a few utility functions useful for working with
 *  arrays (implemented with loops).
 *
 ******************************************************************************/

public class LoopUtils {

  // Find the max element of an array
  public static int max(int[] arr) {


  }
}`;

interface ITemplateCodeProps {
  file: FileType;
}

const TemplateCode = (props: ITemplateCodeProps) => {
  const { consoleTheme } = React.useContext(ConsoleThemeContext);

  console.log('template', props.file);

  const tokens = template.split('\n').filter((l: string) => {
    if (l.trim().length > 2) {
      return true;
    }

    if (l.trim() === '*') {
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
        <div key={i} id={`template-line-${i}`} style={{ color: templatized ? '#fafafa' : 'transparent' }}>
          {text === '' ? ' ' : text}
        </div>
      );
    });
  };
  return <div>{linesOfCode(props.file.code)}</div>;
};

export default TemplateCode;
