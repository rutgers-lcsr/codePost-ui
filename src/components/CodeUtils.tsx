import * as React from 'react';
import { IComment } from '../types/common';

const PIXELS_PER_LINE = 19;

export default class CodeUtils {
  public static pixelsPerLine = (): number => {
    return PIXELS_PER_LINE;
  };

  public static heightOfComment = (comment: IComment, activeCommentId?: number): number => {
    const linesDeduction = comment.pointDelta !== 0 ? 2 : 0;
    const linesRubricComment = comment.rubricComment
      ? comment.rubricComment.text.length / 30 + 1
      : 0;
    const linesComment = comment.text.length / 36;
    const linesButtons = activeCommentId === comment.localId ? 4 : 0;
    const buffer = 6;

    const totalLines = linesDeduction + linesRubricComment + linesComment + linesButtons + buffer;

    return totalLines * PIXELS_PER_LINE;
  };

  public static sortHighlights = (highlights: IComment[]): IComment[] => {
    return highlights.sort((a: IComment, b: IComment) => {
      if (a.startLine === b.startLine) {
        if (a.startChar > b.startChar) {
          return 1;
        }
        return -1;
      }
      if (a.startLine > b.startLine) return 1;
      return -1;
    });
  };

  public static highlightText = (
    sortedHighlights: IComment[],
    thetext: string,
    line: number,
  ): any => {
    for (const highlight of sortedHighlights) {
      if (highlight.startLine < line && highlight.endLine > line) {
        // this line sits between a multi-line highlight
        return (
          <strong id={line.toString()} className={highlight.localId.toString()}>
            {thetext}
          </strong>
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
              <strong className={highlight.localId.toString()}>{part2}</strong>
              {part3}
            </div>
          );
        }
        part1 = thetext.substring(0, highlight.startChar);
        part2 = thetext.substring(highlight.startChar, thetext.length).replace(/\s*$/, '');
        return (
          <div id={line.toString()}>
            {part1}
            <strong className={highlight.localId.toString()}>{part2}</strong>
          </div>
        );
      }
      if (highlight.endLine === line) {
        const part1 = thetext.substring(0, highlight.endChar);
        const part2 = thetext.substring(highlight.endChar, thetext.length).replace(/\s*$/, '');
        return (
          <div id={line.toString()}>
            <strong className={highlight.localId.toString()}>{part1}</strong>
            {part2}
          </div>
        );
      }
      // otherwise, the highlight ends before our line starts
    }
    return thetext;
  };
}
