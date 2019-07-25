import * as React from 'react';

import 'rc-slider/assets/index.css';

import Slider from 'rc-slider';

const Range = Slider.Range;

import useWindowSize from '../../core/useWindowSize';

import { ConsoleThemeContext } from '../../../styles/abstracts/_console-theme-context';
import themeVars from '../../../styles/abstracts/_theme.js';

enum RESIZER {
  CODE,
  COMMENTS,
}

export type CodeConsoleDimensionsType = {
  codeWidth: number;
  commentsWidth: number;
};

export const getInitialDimensions = () => {
  return {
    codeWidth: Math.max(Math.min(themeVars.grade.splitBasis, window.innerWidth - 700), 400),
    commentsWidth: 360,
  };
};

const absoluteCodeWidthMinimum = 400;
const absoluteCommentsWidthMinimum = 280;

interface ILayoutResizerProps {
  initialDimensions: CodeConsoleDimensionsType;
  setDimensions: any;
}

const LayoutResizer = (props: ILayoutResizerProps) => {
  const windowSize = useWindowSize();
  const { consoleTheme } = React.useContext(ConsoleThemeContext);

  // @ts-ignore
  const marks = {
    630: '80char',
    775: '100char',
    915: '120char',
  };

  const [ranges, setRanges] = React.useState([
    0,
    props.initialDimensions.codeWidth,
    props.initialDimensions.codeWidth + 20,
    props.initialDimensions.codeWidth + 20 + (props.initialDimensions.commentsWidth - 20),
  ]);

  const [hovered, setHovered] = React.useState(false);
  const onMouseEnter = () => {
    setHovered(true);
  };

  const onMouseLeave = () => {
    setHovered(false);
  };

  const handleChange = (r: any) => {
    setRanges((prevRanges) => {
      const activeResizer = prevRanges[1] === r[1] ? RESIZER.COMMENTS : RESIZER.CODE;

      const n0 = 0; // code start

      const n1 = r[1] < absoluteCodeWidthMinimum ? absoluteCodeWidthMinimum : r[1]; // code end

      const n2 = n1 + 20; // comments start

      let n3; // comments end
      if (activeResizer === RESIZER.COMMENTS) {
        n3 = r[3] - n2 > absoluteCommentsWidthMinimum ? r[3] : n2 + absoluteCommentsWidthMinimum;
      } else {
        n3 = n2 + (prevRanges[3] - prevRanges[2]);
      }

      return [n0, n1, n2, n3];
    });
  };

  const afterChange = (r: any) => {
    props.setDimensions({ codeWidth: r[1], commentsWidth: r[3] - r[2] + 20 });
  };

  return (
    <div style={{ width: `${windowSize.width * 2}px` }} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <Range
        className="layout-resizer"
        value={ranges}
        onChange={handleChange}
        onAfterChange={afterChange}
        min={0}
        max={windowSize.width * 2}
        handleStyle={[
          { backgroundColor: 'transparent', borderColor: 'transparent', cursor: 'auto' },
          { backgroundColor: consoleTheme.resizerTrack, borderColor: consoleTheme.resizerTrackActive },
          { backgroundColor: 'transparent', borderColor: 'transparent', cursor: 'auto' },
          {
            backgroundColor: hovered ? consoleTheme.resizerTrack : 'transparent',
            borderColor: hovered ? consoleTheme.resizerTrackActive : 'transparent',
          },
        ]}
        trackStyle={[
          { backgroundColor: consoleTheme.resizerTrackActive },
          { backgroundColor: consoleTheme.resizerTrack },
          { backgroundColor: hovered ? consoleTheme.resizerTrackActive : consoleTheme.resizerTrack },
        ]}
        railStyle={{ backgroundColor: consoleTheme.resizerTrack }}
      />
    </div>
  );
};

export default LayoutResizer;
