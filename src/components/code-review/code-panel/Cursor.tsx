import * as React from 'react';

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
    return {
      ...cursor,
      startChar: 0,
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
    return {
      ...cursor,
      startChar: 0,
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

    if (optionKey) {
      const regexp = /\s/g;
      // @ts-ignore
      const spaces = line.matchAll(regexp);
      const spaceIndices = [...spaces].filter((match: any) => {
        return match.index < cursor.startChar - 1;
      });

      console.log(
        'LINE LEFT',
        spaceIndices.map((s: any) => {
          return s.index;
        }),
      );

      if (spaceIndices.length === 0) {
        newEndChar = 1;
      } else {
        if (jumpSpace) {
          // newEndChar = spaceIndices[0].index + 1;
          newEndChar = spaceIndices[spaceIndices.length - 1].index;
        } else {
          newEndChar = spaceIndices[spaceIndices.length - 1].index + 2;
          // newEndChar = spaceIndices[0].index - 1;
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
): ICursorType => {
  const line = code[cursor.endLine];

  if (cursor.endChar >= line.length) {
    if (cursor.endLine === code.length - 1) {
      // End of file
      return {
        ...cursor,
        startChar: cursor.endChar - 1,
        startLine: cursor.endLine,
        lead: 'front',
      };
    } else if (cursor.startLine === cursor.endLine && cursor.startChar === 0) {
      return {
        ...cursor,
        startChar: 0,
        endChar: 1,
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

    if (optionKey) {
      const regexp = /\s/g;
      // @ts-ignore
      const spaces = line.matchAll(regexp);
      const spaceIndices = [...spaces].filter((match: any) => {
        return match.index > cursor.endChar;
      });

      console.log(
        'LINE RIGHT',
        spaceIndices.map((s: any) => {
          return s.index;
        }),
      );

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

export const shiftLeft = (code: string[], cursor: ICursorType, optionKey: boolean = false): ICursorType => {
  if (cursor.lead === 'front') {
    if (cursor.startLine === cursor.endLine && cursor.endChar - cursor.startChar <= 1) {
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
    const leadCursor = left(code, cursor, optionKey, false);
    return {
      ...leadCursor,
      endChar: cursor.endChar,
      endLine: cursor.endLine,
    };
  }
};

export const shiftRight = (code: string[], cursor: ICursorType, optionKey: boolean = false): ICursorType => {
  if (cursor.lead === 'back') {
    if (cursor.startLine === cursor.endLine && cursor.endChar - cursor.startChar <= 1) {
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
    const leadCursor = right(code, front(cursor), optionKey, false);

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
