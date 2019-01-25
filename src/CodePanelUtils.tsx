import { CommentType } from './infrastructure/comment';
import { POSITION } from './types/common';

export default class CodePanelUtils {
  public static sortComments = (comments: CommentType[]): CommentType[] => {
    return comments.sort((a: CommentType, b: CommentType) => {
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

  public static highlight = (sortedHighlights: CommentType[], thetext: string, line: number) => {
    // Highlights
    const highlights: any[] = [];
    for (const highlight of sortedHighlights) {
      if (highlight.startLine < line && highlight.endLine > line) {
        // this line sits between a multi-line highlight
        highlights.push([0, thetext.length, highlight.id]);
      } else if (highlight.startLine === line) {
        // we may be in a partial highlight situation
        // is the whole comment in one line?
        if (highlight.endLine === highlight.startLine) {
          highlights.push([highlight.startChar, highlight.endChar, highlight.id]);
        } else {
          highlights.push([highlight.startChar, thetext.length, highlight.id]);
        }
      } else if (highlight.endLine === line) {
        highlights.push([0, highlight.endChar, highlight.id]);
      }
      // otherwise, the highlight ends before our line starts
    }

    const elements: any[] = [];
    let prevIDs: number[] = [];

    // tslint:disable-next-line
    for (let i = 0; i <= thetext.length; i++) {
      const newIDs: number[] = [];
      const remIDs: number[] = [];
      for (const h of highlights) {
        if (h[0] === i) {
          newIDs.push(h[2]);
        }
        if (h[1] === i) {
          remIDs.push(h[2]);
        }
      }

      const updatedIDs = prevIDs
        .filter((x) => {
          return !remIDs.includes(x);
        })
        .concat(newIDs); // ids = ids - remIDs + newIDs

      let element = '';
      if (i === thetext.length) {
        if (remIDs.length >= 1) {
          element = '</strong>';
        }
      } else {
        if (newIDs.length === 0 && remIDs.length === 0) {
          element = `${element}${thetext.charAt(i)}`;
        } else if (prevIDs.length === 0 && newIDs.length >= 1) {
          element = `${element}<strong id=${line.toString()} class="${updatedIDs.join(' ')}">${thetext.charAt(i)}`;
        } else if (updatedIDs.length === 0 && remIDs.length >= 1) {
          element = `</strong>${thetext.charAt(i)}`;
        } else {
          element = `${element}</strong><strong id=${line.toString()} class="${updatedIDs.join(' ')}">${thetext.charAt(
            i,
          )}`;
        }
      }
      prevIDs = updatedIDs;
      elements.push(element);
    }
    return { __html: elements.join('') };
  };

  // https://stackoverflow.com/questions/48810664/get-click-range-relative-to-parent-element
  // Get the offset from the parent div
  public static getSelectionOffsetRelativeToParent = (
    parentElement: any,
    currentNode: any,
    position: POSITION,
  ): any => {
    let currentSelection;
    let currentRange;
    let offset = 0;
    let prevSibling;
    let nodeContent;
    let currNode = currentNode;

    if (!currNode) {
      currentSelection = window.getSelection();
      currentRange = currentSelection.getRangeAt(0);
      if (position === POSITION.Start) {
        currNode = currentRange.startContainer;
        offset += currentRange.startOffset;
      } else if (position === POSITION.End) {
        currNode = currentRange.endContainer;
        offset += currentRange.endOffset;
      }
    }

    if (currNode === parentElement) {
      return offset;
    }

    if (!parentElement.contains(currNode)) {
      return -1;
    }

    // tslint:disable-next-line
    while ((prevSibling = (prevSibling || currNode).previousSibling)) {
      nodeContent = prevSibling.innerText || prevSibling.nodeValue || '';
      offset += nodeContent.length;
    }

    return offset + CodePanelUtils.getSelectionOffsetRelativeToParent(parentElement, currNode.parentNode, position);
  };
}
