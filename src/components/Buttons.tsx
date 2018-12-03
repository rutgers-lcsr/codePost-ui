import * as React from 'react';

import '../styles/Grader.scss';

import { BUTTON_STATE } from '../types/common';

interface IButtonProps {
  handleClick: any;
  buttonState: BUTTON_STATE;
}

export const GetAnotherSubmissionButton = (props: IButtonProps) => {
  const { handleClick, buttonState } = props;

  if (buttonState === BUTTON_STATE.Inactive) {
    return <div className="button-get-another disabled">Nothing left to grade</div>;
  }

  if (buttonState === BUTTON_STATE.Loading) {
    return <div className="button-get-another disabled">Loading...</div>;
  }

  return (
    <div className="button-get-another " onClick={handleClick}>
      Grade another
    </div>
  );
};

export const StartGradingButton = (props: IButtonProps) => {
  const { handleClick, buttonState } = props;

  switch (buttonState) {
    case BUTTON_STATE.Inactive:
      return <div className="button-start-grading disabled">Nothing left to grade!</div>;
    case BUTTON_STATE.Loading:
      return <div className="button-start-grading disabled">Loading...</div>;
    default:
      return (
        <div className="button-start-grading" onClick={handleClick}>
          Start grading!
        </div>
      );
  }
};
