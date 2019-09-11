import * as React from 'react';
import { CommentType } from '../../../infrastructure/comment';
import { POSITION } from '../../../types/common';

import Highlight from './Highlight';

type StyleType = {
  [highlightID: string]: number;
};

class CodePanelHighlighting {
  public static getHighlights = (
    sortedComments: CommentType[],
    thetext: string,
    line: number,
  ): number[][] => {
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
          highlights.push([
            highlight.startChar,
            highlight.endChar,
            highlight.id,
          ]);
        } else {
          // Avoid starting and stopping a highlight on the same char
          const end =
            thetext[thetext.length - 1] === '\r'
              ? thetext.length - 1
              : thetext.length;
          const start =
            highlight.startChar === thetext.length
              ? end - 1
              : highlight.startChar;
          highlights.push([start, end, highlight.id]);
        }
      } else if (highlight.endLine === line) {
        // Avoid starting and stopping a highlight on the same char
        const end = highlight.endChar === 0 ? 1 : highlight.endChar;
        highlights.push([0, end, highlight.id]);
      }
      // otherwise, the highlight ends before our line starts
    }

    return highlights;
  };

  public static buildHTMLString = (
    highlights: number[][],
    thetext: string,
    line: number,
  ): [string, StyleType] => {
    const elements: any[] = [];
    let prevIDs: number[] = [];
    let styles: StyleType = {};

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
              styles[`highlight-${updatedIDs}`]
                ? styles[`highlight-${updatedIDs}`]
                : 0,
            ),
          };
        }
      }

      let element = '';

      // We've reached the end of the line, and there are highlights that need closing
      if (i === thetext.length && remIDs.length >= 1) {
        element = '</strong> ';
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
          element = `<strong id=line-${line} class="${className}">${thetext.charAt(
            i,
          )}`;
          // Closing highlights with no new or existing -> ret: `</strong>{char}`
        } else if (updatedIDs.length === 0 && remIDs.length >= 1) {
          element = `</strong>${thetext.charAt(i)}`;
          // Starting and/or closing highlights -> ret: `</strong><strong>{char}`
        } else {
          element = `</strong><strong id=line-${line} class="${className}">${thetext.charAt(
            i,
          )}`;
        }
      }
      prevIDs = updatedIDs;
      elements.push(element);
    }

    return [elements.join(''), styles];
  };

  public static convertStringToJSX = (
    htmlString: string,
    line: number,
    readOnly: boolean,
    onHighlightClick: (e: React.MouseEvent) => void,
  ) => {
    const components = htmlString.split(/(<strong .*?>.*?<\/strong>)/g);
    const returnElements = components.map((html: string, i: number) => {
      if (html.includes('</strong>')) {
        let className = html.match(/class=".*?"/g)
          ? html.match(/class=".*?"/g)![0]
          : '';
        let commentID = 0;
        if (className !== '') {
          className = className.split('=')[1];
          className = className.substring(1, className.length - 1);
          commentID = +className.substr(10);
        }
        const text = html.replace(/<\/?strong.*?>/g, '');
        return (
          <Highlight
            key={`${line}-${commentID}-${i}`}
            commentID={commentID}
            line={line}
            className={className}
            text={text}
            readOnly={readOnly}
            onHighlightClick={onHighlightClick}
          />
        );
      } else {
        return html;
      }
    });

    return returnElements;
  };

  // O(NM) where N is the number of highlights and M is the length of the line
  public static highlight = (
    sortedComments: CommentType[],
    thetext: string,
    line: number,
    readOnly: boolean,
    color: string,
    onHighlightClick: (e: React.MouseEvent) => void,
  ) => {
    const highlights = CodePanelHighlighting.getHighlights(
      sortedComments,
      thetext,
      line,
    );

    const [htmlString, styles] = CodePanelHighlighting.buildHTMLString(
      highlights,
      thetext,
      line,
    );

    // This code doesn't quite work yet
    // We have the correct 'nesting levels', but the !important doesn't always override on deeply nested
    // highlights. It catches the first nesting, but none deeper.
    for (const [highlight, level] of Object.entries(styles)) {
      const tint = 0.2 + 0.2 * level;
      (document.styleSheets[0] as CSSStyleSheet).insertRule(
        `.highlight-${highlight} {background-color: ${color} !important; opacity: ${tint} !important;}`,
      );
    }

    const returnElements = CodePanelHighlighting.convertStringToJSX(
      htmlString,
      line,
      readOnly,
      onHighlightClick,
    );

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
      if (currentSelection === null) {
        return -1;
      }
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

    return (
      offset +
      CodePanelHighlighting.getSelectionOffsetRelativeToParent(
        parentElement,
        currNode.parentNode,
        position,
      )
    );
  };

  public static brightenHighlight = (commentID: number, color: string) => {
    const className = `highlight-${commentID}`;
    const elems = document.getElementsByClassName(className);

    [].forEach.call(elems, (elem: any) => {
      elem.style.setProperty('background-color', color, 'important');
    });
  };

  public static darkenHighlight = (commentID: number, color: string) => {
    const className = `highlight-${commentID}`;
    const elems = document.getElementsByClassName(className);

    [].forEach.call(elems, (elem: any) => {
      elem.style.setProperty('background-color', color, 'important');
    });
  };
}

export default CodePanelHighlighting;
