import * as React from 'react';
import { CommentType } from '../../../infrastructure/comment';
import { POSITION } from '../../../types/common';

import Highlight from './Highlight';

type StyleType = {
  [highlightID: string]: number;
};

/**
 * Convert hex color to rgba with alpha transparency
 */
const hexToRgba = (hex: string, alpha: number): string => {
  // Remove # if present
  hex = hex.replace('#', '');

  // Parse hex values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
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
        // Avoid starting and stopping a highlight on the same char
        const end = thetext[thetext.length - 1] === '\r' ? thetext.length - 1 : thetext.length;
        const start = highlight.startChar === thetext.length ? end - 1 : highlight.startChar;
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

/**
 * Build HTML string from highlights for a line
 */
export const buildHTMLString = (highlights: number[][], thetext: string, line: number): [string, StyleType] => {
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
          [`${updatedIDs[i]}`]: Math.max(i, styles[`highlight-${updatedIDs}`] ? styles[`highlight-${updatedIDs}`] : 0),
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

/**
 * Convert HTML string to JSX elements with Highlight components
 */
export const convertStringToJSX = (
  htmlString: string,
  line: number,
  readOnly: boolean,
  onHighlightClick: (e: React.MouseEvent) => void,
) => {
  const components = htmlString.split(/(<strong .*?>.*?<\/strong>)/g);
  const returnElements = components.map((html: string, i: number) => {
    if (html.includes('</strong>')) {
      let className = html.match(/class=".*?"/g) ? html.match(/class=".*?"/g)![0] : '';
      let commentID = 0;
      if (className !== '') {
        className = className.split('=')[1];
        className = className.substring(1, className.length - 1);
        commentID = +className.substring(10);
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

/**
 * Main highlight function - processes comments and generates highlighted JSX elements
 * O(NM) where N is the number of highlights and M is the length of the line
 */
export const highlight = (
  sortedComments: CommentType[],
  thetext: string,
  line: number,
  readOnly: boolean,
  color: string,
  onHighlightClick: (e: React.MouseEvent) => void,
) => {
  const highlights = getHighlights(sortedComments, thetext, line);

  const [htmlString, styles] = buildHTMLString(highlights, thetext, line);

  // In Firefox, stylesheet.insertRule produces a SecurityError
  // https://stackoverflow.com/questions/15229330/attempt-to-add-a-rule-to-a-css-stylesheet-gives-the-operation-is-insecure-in-f
  // So, we skip stylesheet manipulation on Firefox
  const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

  if (!isFirefox) {
    // Collect all unique comment IDs that need CSS rules
    const allHighlightIds = new Set<string>();

    // Add IDs from nested highlights (from styles object)
    Object.keys(styles).forEach((id) => {
      if (id !== '0' && id !== `${Number.MAX_SAFE_INTEGER}`) {
        allHighlightIds.add(id);
      }
    });

    // Add IDs from ALL highlights on this line (not just nested ones)
    highlights.forEach(([_start, _end, id]) => {
      const idStr = `${id}`;
      if (idStr !== '0' && idStr !== `${Number.MAX_SAFE_INTEGER}`) {
        allHighlightIds.add(idStr);
      }
    });

    // Find a stylesheet we can modify
    let rules;
    let stylesheet;
    for (let i = 0; i < document.styleSheets.length; i++) {
      if (document.styleSheets[i].href === null) {
        stylesheet = document.styleSheets[i] as CSSStyleSheet;
        rules = stylesheet.cssRules;
        break;
      }
    }

    if (stylesheet && rules) {
      // Create CSS rules for all highlights
      allHighlightIds.forEach((highlightId) => {
        const className = `.highlight-${highlightId}`;
        const level = styles[highlightId] || 0;

        // Better alpha scaling for visual hierarchy with MORE CONTRAST
        // Single highlights: 0.55 (much more visible)
        // Nested highlights: DECREASE alpha to show layering (0.47, 0.39, etc.)
        const alpha = level > 0 ? Math.max(0.35, 0.55 - 0.08 * level) : 0.6;

        // Convert hex to rgba for transparency - this way text remains visible!
        const rgbaColor = hexToRgba(color, alpha);

        let ruleExists = false;
        for (const x in rules) {
          if (rules[x].selectorText === className) {
            rules[x].style.backgroundColor = rgbaColor;
            ruleExists = true;
            break;
          }
        }

        if (!ruleExists) {
          try {
            stylesheet.insertRule(
              `.highlight-${highlightId} {
                background-color: ${rgbaColor} !important; 
                transition: background-color 0.2s ease-in-out, box-shadow 0.15s ease-in-out, transform 0.1s ease-in-out !important;
                border-radius: 3px !important;
                box-shadow: 0 0 0 0.5px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0, 0, 0, 0.08) !important;
              }`,
            );
          } catch (e) {
            // Silently fail if rule insertion fails
            console.warn('Failed to insert highlight rule:', e);
          }
        }
      });
    }
  }

  const returnElements = convertStringToJSX(htmlString, line, readOnly, onHighlightClick);

  return returnElements;
};

/**
 * Get the selection offset relative to parent element
 * https://stackoverflow.com/questions/48810664/get-click-range-relative-to-parent-element
 */
export const getSelectionOffsetRelativeToParent = (parentElement: any, currentNode: any, position: POSITION): any => {
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

  return offset + getSelectionOffsetRelativeToParent(parentElement, currNode.parentNode, position);
};

/**
 * Brighten a highlight by changing its background color
 * Enhanced with better visual feedback
 */
export const brightenHighlight = (commentID: number) => {
  if (commentID === 0 || commentID === Number.MAX_SAFE_INTEGER) {
    return;
  }

  if (commentID < 0) {
    return;
  }

  const className = `highlight-${commentID}`;
  const elems = document.getElementsByClassName(className);
  let hasScrolled = false;
  [].forEach.call(elems, (elem: HTMLElement) => {
    // Convert hex color to rgba with transparency - brighter and more prominent
    elem.classList.add(`highlight--hovered`);
    if (!hasScrolled) {
      elem.scrollIntoView({ behavior: 'smooth', block: 'center' });
      hasScrolled = true;
    }
  });
};

/**
 * Darken a highlight by changing its background color
 * Enhanced to restore original appearance
 */
export const darkenHighlight = (commentID: number) => {
  if (commentID === 0 || commentID === Number.MAX_SAFE_INTEGER) {
    return;
  }
  if (commentID < 0) {
    return;
  }

  const className = `highlight-${commentID}`;
  const elems = document.getElementsByClassName(className);

  [].forEach.call(elems, (elem: any) => {
    elem.classList.remove(`highlight--hovered`);
  });
};

// For backward compatibility, export all functions as a single object
const CodePanelHighlighting = {
  getHighlights,
  buildHTMLString,
  convertStringToJSX,
  highlight,
  getSelectionOffsetRelativeToParent,
  brightenHighlight,
  darkenHighlight,
};

export default CodePanelHighlighting;
