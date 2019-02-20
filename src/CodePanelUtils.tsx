import { CommentType } from './infrastructure/comment';
import { POSITION } from './types/common';

interface IStyles {
  [highlightID: string]: number;
}

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

  // O(NM) where N is the number of highlights and M is the length of the line
  public static highlight = (sortedHighlights: CommentType[], thetextUnEscaped: string, line: number) => {
    // const highlights: is an array of tuples for a highlight's placement on a given line
    // (startChar, endChar, highlight.id)
    // Note that these are different from highlight.startChar and highlight.endChar
    // The algorithm builds html string by opening and closing <strong> tags whenever
    // a new highlight begins and/or ends
    // e.g.
    // <strong className=1> first highlight </strong><strong className=1 2>middle
    //          </strong><strong className=2>second highlight</strong>
    const thetext = thetextUnEscaped
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/"/g, '&quot;');
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
    let styles: IStyles = {};

    // We need to loop through each character on the line
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

      // updatedIDs = prevIDs - remIDs + newIDs
      const updatedIDs = prevIDs
        .filter((x) => {
          return !remIDs.includes(x);
        })
        .concat(newIDs);

      // Used for determining 'nesting depth' of a highlight
      if (updatedIDs.length > 1) {
        // tslint:disable-next-line
        for (let i = 1; i < updatedIDs.length; i++) {
          styles = {
            ...styles,
            [`${updatedIDs[i]}`]: Math.max(
              i,
              styles[`highlight-${updatedIDs}`] ? styles[`highlight-${updatedIDs}`] : 0,
            ),
          };
        }
      }

      let element = '';

      // We've reached the end of the line, and there are highlights that need closing
      if (i === thetext.length && remIDs.length >= 1) {
        element = '</strong>';
      } else {
        const className = updatedIDs
          .map((id) => {
            return `highlight-${id}`;
          })
          .join(' ');

        // No change in highlights -> ret: `{char}`
        if (newIDs.length === 0 && remIDs.length === 0) {
          element = `${thetext.charAt(i)}`;
          // Starting new highlights with none existing -> ret: `<strong>{char}`
        } else if (prevIDs.length === 0 && newIDs.length >= 1) {
          element = `<strong id=line-${line} class="${className}">${thetext.charAt(i)}`;
          // Closing highlights with no new or existing -> ret: `</strong>{char}`
        } else if (updatedIDs.length === 0 && remIDs.length >= 1) {
          element = `</strong>${thetext.charAt(i)}`;
          // Starting and/or closing highlights -> ret: `</strong><strong>{char}`
        } else {
          element = `</strong><strong id=line-${line} class="${className}">${thetext.charAt(i)}`;
        }
      }
      prevIDs = updatedIDs;
      elements.push(element);
    }

    // This code doesn't quite work yet
    // We have the correct 'nesting levels', but the !important doesn't always override on deeply nested
    // highlights. It catches the first nesting, but none deeper.
    for (const [highlight, level] of Object.entries(styles)) {
      const tint = 0.5 + 0.2 * level;
      (document.styleSheets[0] as CSSStyleSheet).insertRule(
        `.highlight-${highlight} {background-color: rgba(255, 202, 147, ${tint}) !important;}`,
      );
    }

    return {
      __html: elements.join(''),
    };
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

    if (!parentElement) {
      return -1;
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

  public static updateCommentPanelHeight = (height?: number) => {
    const selectedTabElement = document.getElementsByClassName('react-tabs__tab-panel--selected')[0];
    if (selectedTabElement) {
      const commentPanel = selectedTabElement.getElementsByClassName(
        'grade__main-container__tabContent__commentPanel',
      )[0];
      const syntaxHighlighter = selectedTabElement.getElementsByClassName('code__syntax-highlighter')[0];
      const currentHeight = height ? height : syntaxHighlighter.getBoundingClientRect().height;

      let newHeight = currentHeight + 20;
      const commentElements = document.getElementsByClassName('comment');
      // tslint:disable-next-line
      for (let i = 0; i < commentElements.length; i++) {
        const elem = document.getElementById(commentElements[i].id)!;
        newHeight = Math.max(currentHeight, +elem.style.top!.slice(0, -2) + elem.getBoundingClientRect().height + 30);
      }
      document.getElementById(commentPanel.id)!.style.setProperty('height', `${newHeight}px`);
    }
  };
}
