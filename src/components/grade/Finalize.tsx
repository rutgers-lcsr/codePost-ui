import * as React from 'react';

import { BUTTON_STATE, ISubmission } from '../../types/common';

import { FinalizeButton } from '../Buttons';

interface IFinalizeProps {
  submission: ISubmission;
  toggleFinalized: any;
}

interface IFinalizeState {
  buttonState: BUTTON_STATE;
}

export class Finalize extends React.Component<IFinalizeProps, IFinalizeState> {
  public state: Readonly<IFinalizeState> = {
    // Finalized (take back) --> Active
    // else --> Inactive
    buttonState: this.props.submission.isFinalized ? BUTTON_STATE.Active : BUTTON_STATE.Inactive,
  };

  public toggleFinalized = () => {
    const { toggleFinalized } = this.props;
    this.setState({ buttonState: BUTTON_STATE.Loading });

    const promise = toggleFinalized();
    promise.then((submission: ISubmission) => {
      if (submission.isFinalized) {
        this.setState({ buttonState: BUTTON_STATE.Active });
      } else {
        this.setState({ buttonState: BUTTON_STATE.Inactive });
      }
    });
  };

  public render() {
    const { buttonState } = this.state;
    return <FinalizeButton buttonState={buttonState} handleClick={this.toggleFinalized} />;
  }
}

export default Finalize;
