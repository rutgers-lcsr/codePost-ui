class Layout {
  public static pixelsPerLine = (): number => {
    let lineHeight = 20; // estimate until the lines are rendered
    const lineElement = document.getElementById('line-0');
    if (lineElement) {
      lineHeight = lineElement.getBoundingClientRect().height;
    }
    return lineHeight;
  };
}

export default Layout;
