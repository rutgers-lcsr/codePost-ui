// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
class CodePanelLayout {
  public static pixelsPerLine = (): number => {
    let lineHeight = 20; // estimate until the lines are rendered
    const lineElement = document.getElementById('line-0');
    if (lineElement) {
      lineHeight = lineElement.offsetHeight;
    }
    return lineHeight;
  };

  public static codeHeight = (code: string): number => {
    const codeMarkdown = document.getElementById('code-markdown');
    if (codeMarkdown !== null) {
      // FIXME: This will sometimes give the wrong height if an image
      //        takes a long time to load.
      //        Refreshing usually solves (faster load time).
      return codeMarkdown.getBoundingClientRect().height;
    }
    return code.split('\n').length * CodePanelLayout.pixelsPerLine();
  };

  public static commentHeight = (commentID: number): number => {
    // Estimate until the elements are rendered
    //   In the current design, I don't think this is ever necessary
    //   Keeping it here in case of a missed edge case, where this will be nice to have
    let heightOfComment = 80;
    const commentElement = document.getElementById(`comment-${commentID}`);
    if (commentElement) {
      heightOfComment = commentElement.clientHeight;
    }

    return heightOfComment;
  };

  public static lineNumberPadding = (code: string): number => {
    // Returns the width of the line number gutter, when using SyntaxHighlighter (code--syntax) and code--underlay

    const codeSyntax = document.getElementById('code-syntax');

    if (codeSyntax !== null) {
      const lineNumbers = codeSyntax.firstChild?.firstChild as HTMLElement | null;
      if (lineNumbers !== null) {
        return lineNumbers.offsetWidth;
      }
    }
    // Fallback estimate
    const numberOfLines = code.split('\n').length;
    const digits = numberOfLines.toString().length;
    const co = digits * 8 + 16; // approx. 8 pixels per digit + padding

    return co;
  };
}

export default CodePanelLayout;
