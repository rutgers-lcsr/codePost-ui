import * as React from 'react';
import { CommentType } from './infrastructure/comment';

export default class CodePanelUtils {
  public static sortHighlights = (highlights: CommentType[]): CommentType[] => {
    return highlights.sort((a: CommentType, b: CommentType) => {
      if (a.startLine === b.startLine) {
        if (a.startChar > b.startChar) {
          return 1;
        }
        return -1;
      }
      if (a.startLine > b.startLine) {
        return 1;
      }
      return -1;
    });
  };

  public static highlightText = (sortedHighlights: CommentType[], thetext: string, line: number): any => {
    for (const highlight of sortedHighlights) {
      if (highlight.startLine < line && highlight.endLine > line) {
        // this line sits between a multi-line highlight
        return (
          <div id={line.toString()}>
            <strong id={line.toString()} className={highlight.id.toString()}>
              {thetext}
            </strong>
          </div>
        );
      }
      if (highlight.startLine === line) {
        let part1 = '';
        let part2 = '';
        let part3 = '';
        // we may be in a partial highlight situation

        // is the whole comment in one line?
        if (highlight.endLine === highlight.startLine) {
          part1 = thetext.substring(0, highlight.startChar);
          part2 = thetext.substring(highlight.startChar, highlight.endChar);
          part3 = thetext.substring(highlight.endChar, thetext.length).replace(/\s*$/, '');
          return (
            <div id={line.toString()}>
              {part1}
              <strong id={line.toString()} className={highlight.id.toString()}>
                {part2}
              </strong>
              {part3}
            </div>
          );
        }
        part1 = thetext.substring(0, highlight.startChar);
        part2 = thetext.substring(highlight.startChar, thetext.length).replace(/\s*$/, '');
        return (
          <div id={line.toString()}>
            {part1}
            <strong id={line.toString()} className={highlight.id.toString()}>
              {part2}
            </strong>
          </div>
        );
      }
      if (highlight.endLine === line) {
        const part1 = thetext.substring(0, highlight.endChar);
        const part2 = thetext.substring(highlight.endChar, thetext.length).replace(/\s*$/, '');
        return (
          <div id={line.toString()}>
            <strong id={line.toString()} className={highlight.id.toString()}>
              {part1}
            </strong>
            {part2}
          </div>
        );
      }
      // otherwise, the highlight ends before our line starts
    }
    return thetext;
  };
}
