import * as React from 'react';

import { BUTTON_STATE } from '../types/common';

interface IButtonProps {
  handleClick: any;
  buttonState: BUTTON_STATE;
  children?: any;
}

// Callback: drawUnassigned
export const GetAnotherSubmissionButton = (props: IButtonProps) => {
  const { handleClick, buttonState } = props;

  if (buttonState === BUTTON_STATE.Inactive) {
    return <div className="button--get-another button--get-another--disabled">Nothing left to grade</div>;
  }

  if (buttonState === BUTTON_STATE.Loading) {
    return <div className="button--get-another button--get-another--disabled">Loading...</div>;
  }

  return (
    <div>
      <div className="button--get-another " onClick={handleClick}>
        Grade another
      </div>
      {props.children}
    </div>
  );
};

// Callback: drawUnassigned
export const StartGradingButton = (props: IButtonProps) => {
  const { handleClick, buttonState } = props;

  switch (buttonState) {
    case BUTTON_STATE.Inactive:
      return <div className="button--start-grading button--get-another--disabled">Nothing left to grade!</div>;
    case BUTTON_STATE.Loading:
      return <div className="button--start-grading button--get-another--disabled">Loading...</div>;
    default:
      return (
        <div>
          <div className="button--start-grading" onClick={handleClick}>
            Start grading!
          </div>
          {props.children}
        </div>
      );
  }
};

// Callback: toggleFinalized
export const FinalizeButton = (props: IButtonProps) => {
  const { handleClick, buttonState } = props;

  switch (buttonState) {
    case BUTTON_STATE.Active:
      return (
        <div className="button--takeback" onClick={handleClick}>
          Take Back
        </div>
      );
    case BUTTON_STATE.Loading:
      return <div className="button--finalize">Loading...</div>;
    default:
      return (
        <div className="button--finalize" onClick={handleClick}>
          Finalize
        </div>
      );
  }
};
