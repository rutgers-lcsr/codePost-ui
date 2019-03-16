import * as React from 'react';
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

  public static getHighlights = (sortedComments: CommentType[], thetext: string, line: number): number[][] => {
    // const highlights: is an array of tuples for a highlight's placement on a given line
    // (startChar, endChar, highlight.id)
    // Note that these are different from highlight.startChar and highlight.endChar
    // The algorithm builds html string by opening and closing <strong> tags whenever
    // a new highlight begins and/or ends
    // e.g.
    // <strong className=1> first highlight </strong><strong className=1 2>middle
    //          </strong><strong className=2>second highlight</strong>
    const highlights: any[] = [];
    for (const highlight of sortedComments) {
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

    return highlights;
  };

  public static buildHTMLString = (highlights: number[][], thetext: string, line: number): [string, IStyles] => {
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

    return [elements.join(''), styles];
  };

  public static convertStringToJSX = (htmlString: string, line: number) => {
    const components = htmlString.split(/(<strong .*?>.*?<\/strong>)/g);
    const returnElements = components.map((html: string, i: number) => {
      if (html.includes('</strong>')) {
        let className = html.match(/class=".*?"/g) ? html.match(/class=".*?"/g)![0] : '';
        if (className !== '') {
          className = className.split('=')[1];
          className = className.substring(1, className.length - 1);
        }
        const text = html.replace(/<\/?strong.*?>/g, '');
        return (
          <strong key={`${line}-${i}`} id={`line-${line}`} className={className}>
            {text}
          </strong>
        );
      } else {
        return html;
      }
    });

    return returnElements;
  };

  // O(NM) where N is the number of highlights and M is the length of the line
  public static highlight = (sortedComments: CommentType[], thetext: string, line: number) => {
    const highlights = CodePanelUtils.getHighlights(sortedComments, thetext, line);

    const [htmlString, styles] = CodePanelUtils.buildHTMLString(highlights, thetext, line);

    // This code doesn't quite work yet
    // We have the correct 'nesting levels', but the !important doesn't always override on deeply nested
    // highlights. It catches the first nesting, but none deeper.
    for (const [highlight, level] of Object.entries(styles)) {
      const tint = 0.5 + 0.2 * level;
      (document.styleSheets[0] as CSSStyleSheet).insertRule(
        `.highlight-${highlight} {background-color: rgba(255, 202, 147, ${tint}) !important;}`,
      );
    }

    const returnElements = CodePanelUtils.convertStringToJSX(htmlString, line);

    return returnElements;
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

  // The Code Console needs to update its dimensions when the relevant DOM components update
  // This can either be new comments that would otherwise overflow or newly rendered code snippets
  public static updateCommentPanelHeight = (height?: number) => {
    const selectedTabElement = document.getElementsByClassName('react-tabs__tab-panel--selected')[0];
    if (selectedTabElement) {
      const commentPanel = selectedTabElement.getElementsByClassName(
        'grade__main-container__tab-content__comment-panel',
      )[0];
      const syntaxHighlighter = selectedTabElement.getElementsByClassName('code__syntax-highlighter')[0];
      const currentHeight = height ? height : syntaxHighlighter.getBoundingClientRect().height;

      let newHeight = currentHeight;
      const commentElements = document.getElementsByClassName('comment');

      // tslint:disable-next-line
      for (let i = 0; i < commentElements.length; i++) {
        const elem = document.getElementById(commentElements[i].id)!;

        // The TextArea has a transition on it
        // So when this code reads the DOM, it sees the TextArea as smaller than it is
        // Here we hard-code the expected final height of a transitioning TextArea
        let buffer = 0;
        if (elem.getElementsByTagName('textarea').length > 0) {
          const textAreaHeight = elem.getElementsByTagName('textarea')[0].getBoundingClientRect().height;
          if (textAreaHeight < 42) {
            buffer = 42;
          }
        }

        newHeight = Math.max(
          currentHeight,
          +elem.style.top!.slice(0, -2) + elem.getBoundingClientRect().height + 30 + buffer,
        );
      }
      document.getElementById(commentPanel.id)!.style.setProperty('height', `${newHeight}px`);
    }
  };
}
