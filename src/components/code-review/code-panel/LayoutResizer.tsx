import * as React from 'react';

import 'rc-slider/assets/index.css';

import Slider from 'rc-slider';

const Range = Slider.Range;

import useWindowSize from '../../core/useWindowSize';

import themeVars from '../../../styles/abstracts/_theme.js';

enum RESIZER {
  CODE,
  COMMENTS,
}

interface ILayoutResizerProps {
  initialCodeWidth: number;
  initialCommentsWidth: number;
  setDimensions: any;
}

const LayoutResizer = (props: ILayoutResizerProps) => {
  const windowSize = useWindowSize();

  const absoluteCodeWidthMinimum = 400;
  const absoluteCommentsWidthMinimum = 280;

  // @ts-ignore
  const marks = {
    630: '80char',
    775: '100char',
    915: '120char',
  };

  const [ranges, setRanges] = React.useState([
    0,
    props.initialCodeWidth,
    props.initialCodeWidth + 20,
    props.initialCodeWidth + 20 + (props.initialCommentsWidth - 20),
  ]);

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
    props.setDimensions(r[1], r[3] - r[2] + 20);
  };

  return (
    <Range
      className="layout-resizer"
      value={ranges}
      onChange={handleChange}
      onAfterChange={afterChange}
      min={0}
      max={windowSize.width * 2}
      handleStyle={[
        { backgroundColor: 'transparent', borderColor: 'transparent', cursor: 'auto' },
        { backgroundColor: '#f2f2f2', borderColor: themeVars.theme.actionGreen },
        { backgroundColor: 'transparent', borderColor: 'transparent', cursor: 'auto' },
        { backgroundColor: '#f2f2f2', borderColor: themeVars.theme.actionGreen },
      ]}
      trackStyle={[
        { backgroundColor: themeVars.theme.actionGreenFade },
        { backgroundColor: '#e9e9e9' },
        { backgroundColor: themeVars.theme.actionGreenFade },
      ]}
    />
  );
};

export default LayoutResizer;
