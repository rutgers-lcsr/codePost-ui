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
    const codeSyntax = document.getElementById('code-syntax');
    if (codeSyntax !== null) {
      const lineNumbers = codeSyntax.firstChild?.firstChild as HTMLElement | null;
      console.log(lineNumbers);
      if (lineNumbers !== null) {
        return lineNumbers.offsetWidth;
      }
    }
    return code.split('\n').length.toString().length * 7.205;
  };
}

export default CodePanelLayout;
