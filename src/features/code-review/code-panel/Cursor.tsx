// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
export type LeadPosition = 'front' | 'back';

export interface ICursorType {
  startChar: number;
  endChar: number;
  startLine: number;
  endLine: number;
  lead: LeadPosition;
}

export const back = (cursor: ICursorType): ICursorType => {
  return {
    ...cursor,
    endChar: cursor.startChar + 1,
    endLine: cursor.startLine,
  };
};

export const front = (cursor: ICursorType): ICursorType => {
  return {
    ...cursor,
    startChar: cursor.endChar - 1,
    startLine: cursor.endLine,
  };
};

export const up = (code: string[], cursor: ICursorType): ICursorType => {
  if (cursor.startLine === 0) {
    return { ...cursor, lead: 'back' };
  } else {
    const prevStartLine = code[cursor.startLine - 1];
    const prevStartChar = prevStartLine.search(/\S/);
    return {
      ...cursor,
      startChar: prevStartChar === -1 ? 0 : prevStartChar,
      endChar: prevStartLine.length === 0 ? 1 : prevStartLine.length,
      startLine: cursor.startLine - 1,
      endLine: cursor.startLine - 1,
      lead: 'back',
    };
  }
};

export const down = (code: string[], cursor: ICursorType): ICursorType => {
  if (cursor.endLine === code.length - 1) {
    return { ...cursor, lead: 'back' };
  } else {
    const nextStartLine = code[cursor.startLine + 1];
    const nextStartChar = nextStartLine.search(/\S/);
    return {
      ...cursor,
      startChar: nextStartChar === -1 ? 0 : nextStartChar,
      endChar: nextStartLine.length === 0 ? 1 : nextStartLine.length,
      startLine: cursor.startLine + 1,
      endLine: cursor.startLine + 1,
      lead: 'back',
    };
  }
};

export const left = (
  code: string[],
  cursor: ICursorType,
  optionKey: boolean = false,
  jumpSpace: boolean = false,
  triggerKey: boolean = false,
): ICursorType => {
  const line = code[cursor.endLine];

  if (cursor.startChar <= 0) {
    if (cursor.startLine === 0) {
      // Beginning of file
      return {
        ...cursor,
        endChar: 1,
        endLine: 0,
        lead: 'back',
      };
    } else {
      // Jump to last char of previous line
      const prevLine = code[cursor.startLine - 1];
      return {
        ...cursor,
        startChar: prevLine.length - 1,
        endChar: prevLine.length,
        startLine: cursor.startLine - 1,
        endLine: cursor.startLine - 1,
        lead: 'back',
      };
    }
  } else {
    let newEndChar;

    if (triggerKey) {
      newEndChar = 1;
    } else if (optionKey) {
      const regexp = /\s/g;
      const spaces = line.matchAll(regexp);
      const spaceIndices = [...spaces].filter((match: any) => {
        return match.index < cursor.startChar - 1;
      });

      if (spaceIndices.length === 0) {
        newEndChar = 1;
      } else {
        if (jumpSpace) {
          newEndChar = spaceIndices[spaceIndices.length - 1].index;
        } else {
          newEndChar = spaceIndices[spaceIndices.length - 1].index + 2;
        }
      }
    } else {
      newEndChar = cursor.startChar;
    }

    return {
      ...cursor,
      startChar: newEndChar - 1,
      endChar: newEndChar,
      endLine: cursor.startLine,
      lead: 'back',
    };
  }
};

export const right = (
  code: string[],
  cursor: ICursorType,
  optionKey: boolean = false,
  jumpSpace: boolean = true,
  triggerKey: boolean = false,
): ICursorType => {
  const line = code[cursor.endLine];

  if (cursor.endChar >= line.length) {
    const trimmedLineLength = line.trim().length;
    if (cursor.endLine === code.length - 1) {
      // End of file
      return {
        ...cursor,
        startChar: cursor.endChar - 1,
        startLine: cursor.endLine,
        lead: 'front',
      };
    } else if (cursor.startLine === cursor.endLine && trimmedLineLength === cursor.endChar - cursor.startChar) {
      return {
        ...cursor,
        startChar: cursor.startChar,
        endChar: cursor.startChar + 1,
        startLine: cursor.endLine,
        endLine: cursor.endLine,
        lead: 'front',
      };
    } else {
      // Jump to first char of next line
      return {
        ...cursor,
        startChar: 0,
        endChar: 1,
        startLine: cursor.endLine + 1,
        endLine: cursor.endLine + 1,
        lead: 'front',
      };
    }
  } else {
    let newEndChar;
    if (triggerKey) {
      newEndChar = line.length - 1;
    } else if (optionKey) {
      const regexp = /\s/g;
      const spaces = line.matchAll(regexp);
      const spaceIndices = [...spaces].filter((match: any) => {
        return match.index > cursor.endChar;
      });

      if (spaceIndices.length === 0) {
        newEndChar = line.length - 1;
      } else {
        if (jumpSpace) {
          newEndChar = spaceIndices[0].index + 1;
        } else {
          newEndChar = spaceIndices[0].index - 1;
        }
      }
    } else {
      newEndChar = cursor.endChar;
    }

    return {
      ...cursor,
      startChar: newEndChar,
      endChar: newEndChar + 1,
      startLine: cursor.endLine,
      lead: 'front',
    };
  }
};

export const shiftLeft = (
  code: string[],
  cursor: ICursorType,
  optionKey: boolean = false,
  triggerKey: boolean = false,
): ICursorType => {
  if (cursor.lead === 'front') {
    if (triggerKey && cursor.startLine === cursor.endLine && cursor.startChar !== 0) {
      return {
        ...cursor,
        startChar: 0,
        endChar: cursor.startChar,
        lead: 'back',
      };
    } else if (triggerKey && cursor.startLine !== cursor.endLine) {
      const previousLine = code[cursor.endLine - 1];
      return {
        ...cursor,
        endChar: previousLine.length === 0 ? 1 : previousLine.length,
        endLine: cursor.endLine - 1,
      };
    } else if (cursor.startLine === cursor.endLine && cursor.endChar - cursor.startChar <= 1) {
      const leadCursor = left(code, cursor, optionKey, true);
      return {
        ...leadCursor,
        endChar: cursor.endChar,
        endLine: cursor.endLine,
      };
    } else {
      const frontCursor = left(code, front(cursor), optionKey, true);

      return {
        ...cursor,
        endChar: frontCursor.endChar,
        endLine: frontCursor.endLine,
      };
    }
  } else {
    const leadCursor = left(code, cursor, optionKey, false, triggerKey);
    return {
      ...leadCursor,
      endChar: cursor.endChar,
      endLine: cursor.endLine,
    };
  }
};

export const shiftRight = (
  code: string[],
  cursor: ICursorType,
  optionKey: boolean = false,
  triggerKey: boolean = false,
): ICursorType => {
  if (cursor.lead === 'back') {
    const line = code[cursor.endLine];

    // CMD-SHIFT-RIGHT: Togggle lead cursor, swap the start and end char, move the end char to the end of the line
    if (triggerKey && cursor.startLine === cursor.endLine && cursor.endChar !== line.length) {
      return {
        ...cursor,
        startChar: cursor.endChar - 1,
        endChar: line.length === 0 ? 1 : line.length,
        lead: 'front',
      };
      // CMD-SHIFT-RIGHT: Clear the whole trailing top line
    } else if (triggerKey && cursor.startLine !== cursor.endLine) {
      return {
        ...cursor,
        startChar: 0,
        startLine: cursor.startLine + 1,
      };
      // Start char mode on the same line
      // https://github.com/codepost-io/codePost-ui/pull/1038/commits/dbb82e8f347041484c16740e4a91f6558d4637de
    } else if (cursor.startLine === cursor.endLine && cursor.endChar - cursor.startChar <= 1) {
      const leadCursor = right(code, cursor, optionKey, true);
      return {
        ...leadCursor,
        startChar: cursor.startChar,
        startLine: cursor.startLine,
      };
    } else {
      const leadCursor = right(code, back(cursor), optionKey, true);
      return {
        ...cursor,
        startChar: leadCursor.startChar,
        startLine: leadCursor.startLine,
      };
    }
  } else {
    const leadCursor = right(code, front(cursor), optionKey, false, triggerKey);

    return {
      ...cursor,
      endChar: leadCursor.endChar,
      endLine: leadCursor.endLine,
    };
  }
};

export const shiftUp = (code: string[], cursor: ICursorType): ICursorType => {
  if (cursor.lead === 'back') {
    if (cursor.startLine === 0) {
      return cursor;
    } else {
      return {
        ...cursor,
        startLine: cursor.startLine - 1,
        startChar: 0,
      };
    }
  } else {
    if (cursor.startLine === cursor.endLine) {
      return {
        ...cursor,
        lead: 'back',
        startLine: cursor.startLine - 1,
        startChar: 0,
      };
    } else {
      const prevLine = code[cursor.endLine - 1];
      return {
        ...cursor,
        endLine: cursor.endLine - 1,
        endChar: prevLine.length === 0 ? 1 : prevLine.length,
      };
    }
  }
};

export const shiftDown = (code: string[], cursor: ICursorType): ICursorType => {
  if (cursor.lead === 'front') {
    if (cursor.endLine === code.length - 1) {
      return cursor;
    } else {
      const nextLine = code[cursor.endLine + 1];
      return {
        ...cursor,
        endLine: cursor.endLine + 1,
        endChar: nextLine.length === 0 ? 1 : nextLine.length,
      };
    }
  } else {
    if (cursor.startLine === cursor.endLine) {
      const nextLine = code[cursor.endLine + 1];
      return {
        ...cursor,
        lead: 'front',
        endLine: cursor.endLine + 1,
        endChar: nextLine.length === 0 ? 1 : nextLine.length,
      };
    } else {
      return {
        ...cursor,
        startLine: cursor.startLine + 1,
        startChar: 0,
      };
    }
  }
};
