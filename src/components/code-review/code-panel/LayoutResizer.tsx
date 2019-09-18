import * as React from 'react';

import 'rc-slider/assets/index.css';

import Slider from 'rc-slider';

import useWindowSize from '../../core/useWindowSize';

import { ConsoleThemeContext } from '../../../styles/abstracts/_console-theme-context';

import { ShowTooltipContext } from '../../core/tooltips';

import themeVars from '../../../styles/abstracts/_theme.js';

import useHotkeys, { LEFT_ARROW, RIGHT_ARROW } from '../useHotkeys';

import { osControlKey } from '../../core/operatingSystem';

const createSliderWithTooltip = Slider.createSliderWithTooltip;
const Range = createSliderWithTooltip(Slider.Range);

enum RESIZER {
  CODE,
  COMMENTS,
}

export type CodeConsoleDimensionsType = {
  codeWidth: number;
  commentsWidth: number;
};

export const getInitialDimensions = (): CodeConsoleDimensionsType => {
  const dimensions = {
    codeWidth: Math.max(Math.min(themeVars.grade.codeTargetWidth, window.innerWidth - 700), 400),
    commentsWidth: themeVars.grade.commentsTargetWidth,
  };
  return dimensions;
};

const absoluteCodeWidthMinimum = 400;
const absoluteCommentsWidthMinimum = 280;

interface ILayoutResizerProps {
  initialDimensions: CodeConsoleDimensionsType;
  setDimensions: (dimensions: CodeConsoleDimensionsType) => void;
  hasComments: boolean;
  isEditingComment: boolean;
}

const LayoutResizer = (props: ILayoutResizerProps) => {
  const windowSize = useWindowSize();
  const { consoleTheme } = React.useContext(ConsoleThemeContext);
  const showTooltips = React.useContext(ShowTooltipContext);

  const [ranges, setRanges] = React.useState([
    0,
    props.initialDimensions.codeWidth,
    props.initialDimensions.codeWidth + 20,
    props.initialDimensions.codeWidth + 20 + (props.initialDimensions.commentsWidth - 20),
  ]);

  const [hovered, setHovered] = React.useState(false);
  const onMouseEnter = () => {
    if (props.hasComments) {
      setHovered(true);
    }
  };

  const [activeHandle, setActiveHandle] = React.useState<number | null>(null);

  React.useEffect(() => {
    const handleCodeHandle = () => {
      setActiveHandle(RESIZER.CODE);
    };

    const handleCommentsHandle = () => {
      setActiveHandle(RESIZER.COMMENTS);
    };

    const codeHandle =
      document.getElementsByClassName('rc-slider-handle-2').length > 0
        ? document.getElementsByClassName('rc-slider-handle-2')[0]
        : null;
    if (codeHandle !== null) {
      codeHandle.addEventListener('mousedown', handleCodeHandle);
    }

    const commentsHandle =
      document.getElementsByClassName('rc-slider-handle-4').length > 0
        ? document.getElementsByClassName('rc-slider-handle-4')[0]
        : null;
    if (commentsHandle !== null) {
      commentsHandle.addEventListener('mousedown', handleCommentsHandle);
    }

    return () => {
      if (codeHandle !== null) {
        codeHandle.removeEventListener('mousedown', handleCodeHandle);
      }

      if (commentsHandle !== null) {
        commentsHandle.removeEventListener('mousedown', handleCommentsHandle);
      }
    };
  });

  const onMouseLeave = () => {
    setHovered(false);
  };

  const handleChange = (r: number[]) => {
    setRanges((prevRanges) => {
      if (activeHandle === null) {
        return prevRanges;
      }

      if (activeHandle === RESIZER.CODE) {
        let changedValue = r[1];
        if (prevRanges[1] === r[1]) {
          if (prevRanges[2] !== r[2]) {
            changedValue = r[2];
          } else if (prevRanges[3] !== r[3]) {
            changedValue = r[3];
          } else if (prevRanges[0] !== r[0]) {
            changedValue = r[0];
          }
        }

        // [codeStart, codeEnd, commentsStart, commentsEnd]
        // [n0, n1, n2, n3]
        const n0 = 0;
        const n1 = changedValue < absoluteCodeWidthMinimum ? absoluteCodeWidthMinimum : changedValue;
        const n2 = n1 + 20;
        const n3 = n2 + (prevRanges[3] - prevRanges[2]);
        return [n0, n1, n2, n3];
      } else {
        let changedValue = r[3];
        if (prevRanges[3] === r[3]) {
          if (prevRanges[2] !== r[2]) {
            changedValue = r[2];
          } else if (prevRanges[1] !== r[1]) {
            changedValue = r[1];
          } else if (prevRanges[0] !== r[0]) {
            changedValue = r[0];
          }
        }

        // [codeStart, codeEnd, commentsStart, commentsEnd]
        // [n0, n1, n2, n3]
        const n0 = 0;
        const n1 = r[1] < absoluteCodeWidthMinimum ? absoluteCodeWidthMinimum : r[1];
        const n2 = n1 + 20;
        const n3 = changedValue - n2 > absoluteCommentsWidthMinimum ? changedValue : n2 + absoluteCommentsWidthMinimum;
        return [n0, n1, n2, n3];
      }
    });
  };

  const beforeChange = (r: number[]) => {
    document.documentElement.style.userSelect = 'none';
  };

  const afterChange = (r: number[]) => {
    if (document.getElementsByClassName('rc-slider-handle').length > 0) {
      for (const el of document.getElementsByClassName('rc-slider-handle') as any) {
        el.blur();
      }
    }
    setActiveHandle(null);
    document.documentElement.style.userSelect = 'auto';
    props.setDimensions({ codeWidth: r[1], commentsWidth: r[3] - r[2] + 20 });
  };

  const grow = (n: number) => {
    const newRanges = [ranges[0], ranges[1] + n, ranges[2] + n, ranges[3] + n + n];

    setRanges(newRanges);
    afterChange(newRanges);
  };

  const shrink = (n: number) => {
    const n0 = 0;
    const n1 = Math.max(ranges[1] - n, absoluteCodeWidthMinimum);
    const n2 = n1 + 20;
    const n3 =
      ranges[3] - n - n - n2 > absoluteCommentsWidthMinimum ? ranges[3] - n - n : n2 + absoluteCommentsWidthMinimum;

    const newRanges = [n0, n1, n2, n3];

    setRanges(newRanges);
    afterChange(newRanges);
  };

  useHotkeys(LEFT_ARROW, () => shrink(80), undefined, props.isEditingComment);
  useHotkeys(RIGHT_ARROW, () => grow(80), undefined, props.isEditingComment);

  const tooltip = (
    <div>
      Resize window
      <br />[{osControlKey()} + left / right arrow]
    </div>
  );

  const tipFormatter = (value: any) => {
    return tooltip;
  };

  const prefixCls =
    activeHandle === null && showTooltips ? 'rc-slider-tooltip' : 'rc-slider-tooltip rc-slider-tooltip-hidden';
  const tipProps = {
    placement: 'bottom',
    prefixCls,
  };

  return (
    <div style={{ width: `${windowSize.width * 2}px` }} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <Range
        className="layout-resizer"
        value={ranges}
        onChange={handleChange}
        onBeforeChange={beforeChange}
        onAfterChange={afterChange}
        min={0}
        max={windowSize.width * 2}
        handleStyle={[
          {
            backgroundColor: 'transparent',
            borderColor: 'transparent',
            cursor: 'auto',
          },
          {
            backgroundColor: consoleTheme.resizerTrack,
            borderColor: consoleTheme.resizerTrackActive,
          },
          {
            backgroundColor: 'transparent',
            borderColor: 'transparent',
            cursor: 'auto',
          },
          {
            backgroundColor:
              hovered || (activeHandle !== null && props.hasComments) ? consoleTheme.resizerTrack : 'transparent',
            borderColor:
              hovered || (activeHandle !== null && props.hasComments) ? consoleTheme.resizerTrackActive : 'transparent',
          },
        ]}
        trackStyle={[
          { backgroundColor: consoleTheme.resizerTrackActive },
          { backgroundColor: consoleTheme.resizerTrack },
          {
            backgroundColor:
              hovered || (activeHandle !== null && props.hasComments)
                ? consoleTheme.resizerTrackActive
                : consoleTheme.resizerTrack,
          },
        ]}
        railStyle={{ backgroundColor: consoleTheme.resizerTrack }}
        tipFormatter={tipFormatter}
        tipProps={tipProps}
      />
    </div>
  );
};

export default LayoutResizer;
