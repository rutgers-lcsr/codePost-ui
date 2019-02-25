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
    return (
      <div className="grader__get-another">
        <div className="button--get-another button--get-another--disabled">Nothing left to grade</div>
      </div>
    );
  }

  if (buttonState === BUTTON_STATE.Loading) {
    return (
      <div className="grader__get-another">
        <div className="button--get-another button--get-another--disabled">...</div>
      </div>
    );
  }

  return (
    <div className="grader__get-another">
      <div className="button--get-another " onClick={handleClick}>
        +
      </div>
      {props.children}
    </div>
  );
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
