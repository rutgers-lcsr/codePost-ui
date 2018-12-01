import * as React from 'react';
import { BUTTON_STATE } from '../types/common';

interface IButtonProps {
  handleClick: any;
  buttonState: BUTTON_STATE;
}

export const GetAnotherSubmissionButton = (props: IButtonProps) => {
  const { handleClick, buttonState } = props;

  if (buttonState === BUTTON_STATE.Inactive) {
    return <div>Inactive</div>;
  }

  if (buttonState === BUTTON_STATE.Loading) {
    return <div>Loading...</div>;
  }

  return <div onClick={handleClick}>Active</div>;
};

export const StartGradingButton = (props: IButtonProps) => {
  const { handleClick, buttonState } = props;

  switch (buttonState) {
    case BUTTON_STATE.Inactive:
      return <div>Nothing left to grade!</div>;
    case BUTTON_STATE.Loading:
      return <div>Loading...</div>;
    default:
      return <div onClick={handleClick}>Start grading!</div>;
  }
};
