import * as React from 'react';
import { Button } from 'react-md';
import { Link } from 'react-router-dom';

interface ISlide {
  imgLink: string;
  text: string | any;
}

interface IProps {
  content: ISlide[];
  defaultIndex: number;
  isVisible: boolean;
  closeModal: () => void;
  isModal: boolean;
  className: string;
  onlyImage: boolean;
}

interface IState {
  index: number;
}

class ModalCarousel extends React.Component<IProps, IState> {
  public state: Readonly<IState> = {
    index: this.props.defaultIndex,
  };

  public slideRight = () => {
    const oldIndex = this.state.index;
    const newIndex = oldIndex < this.props.content.length - 1 ? oldIndex + 1 : oldIndex;
    this.setState({ index: newIndex });
  };

  public slideLeft = () => {
    const oldIndex = this.state.index;
    const newIndex = oldIndex > 0 ? oldIndex - 1 : oldIndex;
    if (oldIndex > 0) {
      this.setState({ index: newIndex });
    }
  };

  public close = () => {
    this.props.closeModal();
  };

  public render() {
    const { content, className, onlyImage } = this.props;
    const { index } = this.state;

    const navDot = <div className={`${className}__navDots__navDot`} />;

    const navDots = Array(content.length)
      .fill(navDot)
      .map((elem, i) => {
        console.log(i);
        if (i === index) {
          return <div className={`${className}__navDots__navDot--active`} />;
        }
        return elem;
      });

    const thisSlide = content[index];

    let slideContent;
    if (!onlyImage) {
      slideContent = (
        <div className={`${className}__content`}>
          <div>
            <img className={`${className}__content__image`} src={thisSlide.imgLink} />
          </div>
          <div className={`${className}__content__text`}>{thisSlide.text}</div>
        </div>
      );
    } else {
      slideContent = (
        <div className={`${className}__content--onlyimg`}>
          <img className={`${className}__content--onlyimg__image`} src={thisSlide.imgLink} />
          <div className={`${className}__content--onlyimg__text`}>{thisSlide.text}</div>
        </div>
      );
    }
    if (this.props.isVisible) {
      return (
        <div className={className}>
          {this.props.isModal ? <div className={`${className}__close`} onClick={this.close} /> : <div />}
          <div className={`${className}__box`}>
            <Button
              raised
              onClick={this.slideLeft}
              flat={true}
              icon={true}
              forceIconFontSize={true}
              forceIconSize={32}
              className={`${className}__leftBtn${this.state.index === 0 ? '--hidden' : ''}`}
            >
              keyboard_arrow_left
            </Button>
            {slideContent}
            <Button
              raised
              onClick={this.slideRight}
              flat={true}
              icon={true}
              forceIconFontSize={true}
              forceIconSize={32}
              className={`${className}__rightBtn${
                this.state.index === this.props.content.length - 1 ? '--hidden' : ''
              }`}
            >
              keyboard_arrow_right
            </Button>
          </div>
          <div className={`${className}__navDots`}>{navDots}</div>
        </div>
      );
    } else {
      return <div />;
    }
  }
}

const adminCarouselContent = [
  {
    imgLink: require('../../img/Admin-onboarding/0-CreateCourse.png'),
    text: 'Get started by creating a course.',
  },
  {
    imgLink: require('../../img/Admin-onboarding/1-UploadRoster.png'),
    text:
      'Upload your roster to create student, grader, and admin profiles. \
      Add yourself as a grader if you’d like to review submissions yourself.',
  },
  {
    imgLink: require('../../img/Admin-onboarding/2-AddAssignment.png'),
    text: 'Create your first assignment.',
  },
  {
    imgLink: require('../../img/Admin-onboarding/3-AddRubric.png'),
    text:
      'Write a rubric. Graders will use the rubric to make structured comments and deductions on student work. \
      You can use this view to track rubric comment frequency, as well!',
  },
  {
    imgLink: require('../../img/Admin-onboarding/4-UploadSubmission.png'),
    text:
      'Upload submissions by (1) using the interface shown above \
      or (2) using the codePost API. Once uploaded, submissions become available for grading.',
  },
  {
    imgLink: require('../../img/Admin-onboarding/5-Grade.png'),
    text: 'Review submissions in the editor.',
  },
  {
    imgLink: require('../../img/Admin-onboarding/6-ReviewSubmissions.png'),
    text: 'Manage an overview of submissions by student and grader.',
  },
  {
    imgLink: require('../../img/Admin-onboarding/7-MonitorAssignments.png'),
    text:
      'Keep track of all assignments and monitor submission data in real-time \
      (e.g., # of graded submissions, mean of grades).',
  },
  {
    imgLink: require('../../img/Admin-onboarding/8-APIDocs.png'),
    text: (
      <div>
        Check out the{' '}
        <a href="http://docs.codepost.io" target="_blank">
          codePost API{' '}
        </a>
        to start building powerful scripts and integrations. Your unique API key can be generated from your{' '}
        <Link to={'/settings'}>settings</Link> page
      </div>
    ),
  },
  {
    imgLink: require('../../img/Admin-onboarding/9-logo.png'),
    text: (
      <div>
        Need help getting started? Schedule a setup walkthrough with us{' '}
        <a href="https://calendly.com/codepost/demo" target="_blank">
          here
        </a>
        .
      </div>
    ),
  },
];
export { ModalCarousel, adminCarouselContent };
