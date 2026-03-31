// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import type { CommentType } from '../../../types/models';
import { POSITION } from '../../../types/common';

import Highlight from './Highlight';
import { SUGGESTION_ID_OFFSET } from './CommentHighlightContext';

type StyleType = {
  [highlightID: string]: number;
};

/**
 * Get highlights for a specific line from sorted comments
 */
export const getHighlights = (sortedComments: CommentType[], thetext: string, line: number): number[][] => {
  // const highlights: is an array of tuples for a highlight's placement on a given line
  // (startChar, endChar, highlight.id)
  // Note that these are different from highlight.startChar and highlight.endChar
  // The algorithm builds html string by opening and closing <strong> tags whenever
  // a new highlight begins and/or ends
  // e.g.
  // <strong className=1> first highlight </strong><strong className=1 2>middle
  //          </strong><strong className=2>second highlight</strong>
  const highlights: Array<[number, number, number]> = [];
  for (const highlight of sortedComments) {
    if (highlight.startLine! < line && highlight.endLine! > line) {
      // this line sits between a multi-line highlight
      highlights.push([0, thetext.length, highlight.id]);
    } else if (highlight.startLine === line) {
      // we may be in a partial highlight situation
      // is the whole comment in one line?
      if (highlight.endLine === highlight.startLine) {
        if (highlight.startChar === highlight.endChar) {
          continue;
        }
        highlights.push([highlight.startChar!, highlight.endChar!, highlight.id]);
      } else {
        // Avoid starting and stopping a highlight on the same char
        const end = thetext[thetext.length - 1] === '\r' ? thetext.length - 1 : thetext.length;
        const start = highlight.startChar === thetext.length ? end - 1 : highlight.startChar!;
        highlights.push([start, end, highlight.id]);
      }
    } else if (highlight.endLine === line) {
      // Avoid starting and stopping a highlight on the same char
      const end = highlight.endChar === 0 ? 1 : highlight.endChar!;
      highlights.push([0, end, highlight.id]);
    }
    // otherwise, the highlight ends before our line starts
  }

  return highlights;
};

/**
 * Build HTML string from highlights for a line
 */
export const buildHTMLString = (highlights: number[][], thetext: string, line: number): [string, StyleType] => {
  const elements: string[] = [];
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
          [`${updatedIDs[i]}`]: Math.max(i, styles[`highlight-${updatedIDs}`] ? styles[`highlight-${updatedIDs}`] : 0),
        };
      }
    }

    let element: string;

    // We've reached the end of the line, and there are highlights that need closing
    // Close if ANY highlights are open (prevIDs) OR if highlights are ending (remIDs)
    if (i === thetext.length && (prevIDs.length >= 1 || remIDs.length >= 1)) {
      element = '</strong>';
    } else {
      const isSuggestion = updatedIDs.some((id) => id >= SUGGESTION_ID_OFFSET);
      const className = updatedIDs
        .map((id) => {
          return `highlight-${id}`;
        })
        .join(' ')
        + (isSuggestion ? ' highlight--suggestion' : '');

      // No change in highlights -> ret: `{char}`
      if (newIDs.length === 0 && remIDs.length === 0) {
        element = `${thetext.charAt(i)}`;
        // Starting new highlights with none existing -> ret: `<strong>{char}`
      } else if (prevIDs.length === 0 && newIDs.length >= 1) {
        element = `<strong id="line-${line}" class="${className}">${thetext.charAt(i)}`;
        // Closing highlights with no new or existing -> ret: `</strong>{char}`
      } else if (updatedIDs.length === 0 && remIDs.length >= 1) {
        element = `</strong>${thetext.charAt(i)}`;
        // Starting and/or closing highlights -> ret: `</strong><strong>{char}`
      } else {
        element = `</strong><strong id="line-${line}" class="${className}">${thetext.charAt(i)}`;
      }
    }
    prevIDs = updatedIDs;
    elements.push(element);
  }
  return [elements.join(''), styles];
};

/**
 * Convert HTML string to JSX elements with Highlight components
 */
export const convertStringToJSX = (
  htmlString: string,
  line: number,
  readOnly: boolean,
  onHighlightClick: (e: React.MouseEvent, commentId: number) => void,
  onHoverEnter?: (commentId: number) => void,
  onHoverLeave?: (commentId: number) => void,
) => {
  // Fixed regex: space after <strong is optional (was causing highlights to render as text)
  const components = htmlString.split(/(<strong\s.*?>.*?<\/strong>)/g);

  const returnElements = components.map((html: string, i: number) => {
    if (html.includes('</strong>')) {
      let className = html.match(/class=".*?"/g) ? html.match(/class=".*?"/g)![0] : '';
      let commentID = 0;
      let commentIDs: number[];

      if (className !== '') {
        className = className.split('=')[1];
        className = className.substring(1, className.length - 1);

        // Extract ALL comment IDs from the class name
        // Class name can be like: "highlight-123" or "highlight-123 highlight-456 highlight-789"
        const classNames = className.split(' ');
        commentIDs = classNames
          .filter((cls) => cls.startsWith('highlight-'))
          .map((cls) => parseInt(cls.replace('highlight-', ''), 10))
          .filter((id) => !isNaN(id));

        // Use the FIRST valid comment ID (primary highlight)
        // This is the outermost/first comment that covers this span
        commentID = commentIDs.length > 0 ? commentIDs[0] : 0;
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
          onMouseEnter={onHoverEnter}
          onMouseLeave={onHoverLeave}
        />
      );
    } else {
      return html;
    }
  });

  return returnElements;
};

/**
 * Main highlight function - processes comments and generates highlighted JSX elements
 * O(NM) where N is the number of highlights and M is the length of the line
 */
export const highlight = (
  sortedComments: CommentType[],
  thetext: string,
  line: number,
  readOnly: boolean,
  _color: string,
  onHighlightClick: (e: React.MouseEvent, commentId: number) => void,
  onHoverEnter?: (commentId: number) => void,
  onHoverLeave?: (commentId: number) => void,
) => {
  const highlights = getHighlights(sortedComments, thetext, line);

  const [htmlString] = buildHTMLString(highlights, thetext, line);

  // NOTE: We no longer use dynamic CSS injection via stylesheet.insertRule()
  // Instead, we rely on static CSS in _code.scss which is more reliable and works in all browsers
  // The SCSS has comprehensive styling for .code--underlay .highlight and .code--underlay [class*='highlight-']
  // This approach is:
  // - More maintainable (styles in one place)
  // - Works in Firefox (no security issues)
  // - Better for hot module replacement
  // - Easier to debug (visible in source files)
  // - Faster (no runtime DOM manipulation)

  const returnElements = convertStringToJSX(htmlString, line, readOnly, onHighlightClick, onHoverEnter, onHoverLeave);

  return returnElements;
};

/**
 * Get the selection offset relative to parent element
 * https://stackoverflow.com/questions/48810664/get-click-range-relative-to-parent-element
 */
export const getSelectionOffsetRelativeToParent = (
  parentElement: Node,
  currentNode: Node | null,
  position: POSITION,
  initialOffset: number = 0,
): number => {
  if (!parentElement || !currentNode) {
    return -1;
  }

  // Ensure the current node is within the parent element
  if (!parentElement.contains(currentNode)) {
    return -1;
  }

  let offset = 0;

  // Include offset within the current node
  if (currentNode.nodeType === Node.TEXT_NODE) {
    offset += initialOffset;
  } else if (currentNode.nodeType === Node.ELEMENT_NODE) {
    const element = currentNode as Element;
    const childCount = Math.min(initialOffset, element.childNodes.length);
    for (let i = 0; i < childCount; i++) {
      const child = element.childNodes[i];
      offset += child.textContent ? child.textContent.length : 0;
    }
  }

  // Add lengths of all previous siblings
  let prevSibling = currentNode.previousSibling;
  while (prevSibling) {
    offset += prevSibling.textContent ? prevSibling.textContent.length : 0;
    prevSibling = prevSibling.previousSibling;
  }

  if (currentNode === parentElement) {
    return offset;
  }

  const parentNode = currentNode.parentNode;

  if (!parentNode) {
    return offset;
  }

  if (parentNode === parentElement) {
    return offset;
  }

  const parentOffset = getSelectionOffsetRelativeToParent(parentElement, parentNode, position, 0);
  if (parentOffset === -1) {
    return -1;
  }

  return offset + parentOffset;
};

// For backward compatibility, export all functions as a single object
const CodePanelHighlighting = {
  getHighlights,
  buildHTMLString,
  convertStringToJSX,
  highlight,
  getSelectionOffsetRelativeToParent,
};

export default CodePanelHighlighting;
