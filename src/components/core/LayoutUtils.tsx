class Layout {
  public static pixelsPerLine = (): number => {
    let lineHeight = 20; // estimate until the lines are rendered
    const lineElement = document.getElementById('line-0');
    if (lineElement) {
      lineHeight = lineElement.offsetHeight;
    }
    return lineHeight;
  };

  public static codeHeight = (code: string): number => {
    return code.split('\n').length * Layout.pixelsPerLine();
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
}

export default Layout;
