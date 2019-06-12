import * as React from 'react';

import themeVars from '../../styles/abstracts/_theme.js';

export const useGradeResizer = () => {
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerHeight !== 0) {
        const fileMenu = document.getElementById('file-menu');
        const rubricMenu = document.getElementById('rubric-menu');
        const rubricMenuTitle = document.getElementById('rubric-menu-title');

        if (fileMenu !== null && rubricMenu !== null && rubricMenuTitle !== null) {
          // Don't let the file menu take up more than half of the vertical space
          // allowable for files and rubric
          const fileMenuMaxHeight =
            (window.innerHeight - themeVars.grade.headerHeight) / 2 - themeVars.grade.subheaderHeight;
          fileMenu.style.setProperty('max-height', `${fileMenuMaxHeight}px`);

          const fileMenuBottom = fileMenu.getBoundingClientRect().bottom;
          const rubricMenuTitleHeight = rubricMenuTitle.offsetHeight;
          const rubricMenuMaxHeight = window.innerHeight - fileMenuBottom - rubricMenuTitleHeight;
          rubricMenu.style.setProperty('max-height', `${rubricMenuMaxHeight}px`);
        }
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []); // only run on mount, unmount
};
