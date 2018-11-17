import * as React from 'react';
import { ButtonState } from '../types/common'

interface IButtonProps {
  handleClick: any,
  buttonState: ButtonState
}

export const GetAnotherSubmissionButton = (props: IButtonProps) => {
  const { handleClick, buttonState } = props;

  if (buttonState === ButtonState.Inactive) {
    return (
      <div>
        Inactive
      </div>
    )
  }

  if (buttonState === ButtonState.Loading) {
    return (
      <div>
        Loading...
      </div>
    )
  }

  return (
    <div onClick={handleClick}>
      Active
    </div>
  )
}

export const StartGradingButton = (props: IButtonProps) => {
  const { handleClick, buttonState } = props;

  switch (buttonState) {
    case ButtonState.Inactive:
      return (
        <div>
          Nothing left to grade!
        </div>
      )
    case ButtonState.Loading:
      return (
        <div>
          Loading...
        </div>
      )
    default:
      return (
        <div onClick={handleClick}>
          Start grading!
        </div>
      )
  }
}
