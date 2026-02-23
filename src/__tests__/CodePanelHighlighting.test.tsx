// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import CodePanelHighlighting from '../features/code-review/code-panel/CodePanelHighlighting';
import { CommentIO, CommentType } from '../utils/comments';

describe('CodePanelHighlighting', () => {
  it('sort comments', () => {
    const comments = [
      {
        id: 1,
        text: 'good job',
        pointDelta: 1,
        startChar: 0,
        endChar: 8,
        startLine: 3,
        endLine: 3,
        file: 1,
        rubricComment: null,
        feedback: 0,
      },
      {
        id: 2,
        text: 'good job',
        pointDelta: 3,
        startChar: 0,
        endChar: 4,
        startLine: 0,
        endLine: 4,
        file: 2,
        rubricComment: null,
        feedback: 0,
      },
      {
        id: 3,
        text: 'good job',
        pointDelta: 3,
        startChar: 4,
        endChar: 6,
        startLine: 3,
        endLine: 3,
        file: 2,
        rubricComment: null,
        feedback: 0,
      },
      {
        id: 4,
        text: 'good job',
        pointDelta: 3,
        startChar: 0,
        endChar: 3,
        startLine: 0,
        endLine: 1,
        file: 2,
        rubricComment: null,
        feedback: 0,
      },
    ];

    const sortedIDs = comments.sort(CommentIO.compare).map((comment: CommentType) => {
      return comment.id;
    });

    expect(sortedIDs).toEqual([2, 4, 1, 3]);
  });

  // getHighlights() cases:
  // 0:
  //    no highlights on this line
  // 1:
  //    text sits in the middle of a multi-line highlight
  // 2a:
  //    highlight starts on this line _and_ ends on this line
  // 2b:
  //    highlight starts on this line, but ends on a different line
  // 3:
  //    highlight does not start on this line, but ends on this line

  it('getHighlights() - Case 0 (see test file)', () => {
    const comments = [
      {
        id: 1,
        text: 'good job',
        pointDelta: 1,
        startChar: 0,
        endChar: 8,
        startLine: 3,
        endLine: 3,
        file: 1,
        rubricComment: null,
        feedback: 0,
      },
    ];

    const sortedComments = comments.sort(CommentIO.compare);

    const highlights = CodePanelHighlighting.getHighlights(sortedComments, 'Lorem ipsum dolor sit amet', 2);
    expect(highlights).toEqual([]);
  });

  it('getHighlights() - Case 1 (see test file)', () => {
    const comments = [
      {
        id: 1,
        text: 'good job',
        pointDelta: 1,
        startChar: 0,
        endChar: 8,
        startLine: 0,
        endLine: 3,
        file: 1,
        rubricComment: null,
        feedback: 0,
      },
    ];

    const thetext = 'Lorem ipsum dolor sit amet';
    const sortedComments = comments.sort(CommentIO.compare);

    const highlights = CodePanelHighlighting.getHighlights(sortedComments, thetext, 2);
    expect(highlights).toEqual([[0, thetext.length, 1]]);
  });

  it('getHighlights() - Case 2a (see test file)', () => {
    const comments = [
      {
        id: 1,
        text: 'good job',
        pointDelta: 1,
        startChar: 1,
        endChar: 4,
        startLine: 2,
        endLine: 2,
        file: 1,
        rubricComment: null,
        feedback: 0,
      },
    ];

    const thetext = 'Lorem ipsum dolor sit amet';
    const sortedComments = comments.sort(CommentIO.compare);

    const highlights = CodePanelHighlighting.getHighlights(sortedComments, thetext, 2);
    expect(highlights).toEqual([[1, 4, 1]]);
  });

  it('getHighlights() - Case 2b (see test file)', () => {
    const comments = [
      {
        id: 1,
        text: 'good job',
        pointDelta: 1,
        startChar: 1,
        endChar: 4,
        startLine: 2,
        endLine: 3,
        file: 1,
        rubricComment: null,
        feedback: 0,
      },
    ];

    const thetext = 'Lorem ipsum dolor sit amet';
    const sortedComments = comments.sort(CommentIO.compare);

    const highlights = CodePanelHighlighting.getHighlights(sortedComments, thetext, 2);
    expect(highlights).toEqual([[1, thetext.length, 1]]);
  });

  it('getHighlights() - Case 3 (see test file)', () => {
    const comments = [
      {
        id: 1,
        text: 'good job',
        pointDelta: 1,
        startChar: 1,
        endChar: 4,
        startLine: 1,
        endLine: 2,
        file: 1,
        rubricComment: null,
        feedback: 0,
      },
    ];

    const thetext = 'Lorem ipsum dolor sit amet';
    const sortedComments = comments.sort(CommentIO.compare);

    const highlights = CodePanelHighlighting.getHighlights(sortedComments, thetext, 2);
    expect(highlights).toEqual([[0, 4, 1]]);
  });

  // buildHTMLString() cases:
  // 0:
  //     no highlights on this line
  // 1a:
  //     one highlight at the beginning
  // 1b:
  //     one highlight at the end
  // 1c:
  //     one highlight in the middle
  // 2a:
  //     two highlights separated
  // 2b:
  //     two highlights end-to-end
  // 2c:
  //     two highlights overlapped
  // 2d:
  //     two highlights, one inside the other

  it('buildHTMLString() - Case 0 (see test file)', () => {
    const highlights: number[][] = [];
    const thetext = 'Lorem ipsum dolor sit amet';
    const line = 2;

    const [HTMLString, styles] = CodePanelHighlighting.buildHTMLString(highlights, thetext, line);
    const expected = thetext;
    expect(HTMLString).toEqual(expected);
    expect(styles).toEqual({});
  });

  it('buildHTMLString() - Case 1a (see test file)', () => {
    const highlights: number[][] = [[0, 5, 1]];
    const thetext = 'Lorem ipsum dolor sit amet';
    const line = 2;

    const [HTMLString, styles] = CodePanelHighlighting.buildHTMLString(highlights, thetext, line);
    const expected = `<strong id="line-${line}" class="highlight-${1}">Lorem</strong> ipsum dolor sit amet`;
    expect(HTMLString).toEqual(expected);
    expect(styles).toEqual({});
  });

  it('buildHTMLString() - Case 1b (see test file)', () => {
    const highlights: number[][] = [[22, 26, 1]];
    const thetext = 'Lorem ipsum dolor sit amet';
    const line = 2;

    const [HTMLString, styles] = CodePanelHighlighting.buildHTMLString(highlights, thetext, line);
    const expected = `Lorem ipsum dolor sit <strong id="line-${line}" class="highlight-${1}">amet</strong>`;
    expect(HTMLString).toEqual(expected);
    expect(styles).toEqual({});
  });

  it('buildHTMLString() - Case 1c (see test file)', () => {
    const highlights: number[][] = [[6, 11, 1]];
    const thetext = 'Lorem ipsum dolor sit amet';
    const line = 2;

    const [HTMLString, styles] = CodePanelHighlighting.buildHTMLString(highlights, thetext, line);
    const expected = `Lorem <strong id="line-${line}" class="highlight-${1}">ipsum</strong> dolor sit amet`;
    expect(HTMLString).toEqual(expected);
    expect(styles).toEqual({});
  });

  it('buildHTMLString() - Case 2a (see test file)', () => {
    const highlights: number[][] = [
      [0, 5, 1],
      [12, 17, 2],
    ];
    const thetext = 'Lorem ipsum dolor sit amet';
    const line = 2;

    const [HTMLString, styles] = CodePanelHighlighting.buildHTMLString(highlights, thetext, line);
    const expected = `<strong id="line-${line}" class="highlight-${1}">Lorem</strong> ipsum <strong id="line-${line}" class="highlight-${2}">dolor</strong> sit amet`; // tslint:disable-line
    expect(HTMLString).toEqual(expected);
    expect(styles).toEqual({});
  });

  it('buildHTMLString() - Case 2b (see test file)', () => {
    const highlights: number[][] = [
      [0, 5, 1],
      [5, 11, 2],
    ];
    const thetext = 'Lorem ipsum dolor sit amet';
    const line = 2;

    const [HTMLString, styles] = CodePanelHighlighting.buildHTMLString(highlights, thetext, line);
    const expected = `<strong id="line-${line}" class="highlight-${1}">Lorem</strong><strong id="line-${line}" class="highlight-${2}"> ipsum</strong> dolor sit amet`; // tslint:disable-line
    expect(HTMLString).toEqual(expected);
    expect(styles).toEqual({});
  });

  it('buildHTMLString() - Case 2c (see test file)', () => {
    const highlights: number[][] = [
      [0, 11, 1],
      [6, 17, 2],
    ];
    const thetext = 'Lorem ipsum dolor sit amet';
    const line = 2;

    const [HTMLString, styles] = CodePanelHighlighting.buildHTMLString(highlights, thetext, line);
    const expected = `<strong id="line-${line}" class="highlight-${1}">Lorem </strong><strong id="line-${line}" class="highlight-${1} highlight-${2}">ipsum</strong><strong id="line-${line}" class="highlight-${2}"> dolor</strong> sit amet`; // tslint:disable-line
    expect(HTMLString).toEqual(expected);
    expect(styles).toEqual({ 2: 1 });
  });

  it('buildHTMLString() - Case 2d (see test file)', () => {
    const highlights: number[][] = [
      [0, 17, 1],
      [6, 11, 2],
    ];
    const thetext = 'Lorem ipsum dolor sit amet';
    const line = 2;

    const [HTMLString, styles] = CodePanelHighlighting.buildHTMLString(highlights, thetext, line);
    const expected = `<strong id="line-${line}" class="highlight-${1}">Lorem </strong><strong id="line-${line}" class="highlight-${1} highlight-${2}">ipsum</strong><strong id="line-${line}" class="highlight-${1}"> dolor</strong> sit amet`; // tslint:disable-line
    expect(HTMLString).toEqual(expected);
    expect(styles).toEqual({ 2: 1 });
  });

  it('convertStringToJSX()', () => {
    const htmlString =
      '<strong id="line-2" class="highlight-1">Lorem </strong><strong id="line-2" class="highlight-1 highlight-2">ipsum</strong><strong id="line-2" class="highlight-2"> dolor</strong> sit amet'; // tslint:disable-line
    const returnElements = CodePanelHighlighting.convertStringToJSX(htmlString, 2, false, () => {});
    expect(returnElements.length).toBe(7);
  });
});
