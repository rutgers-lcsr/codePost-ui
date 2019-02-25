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
    imgLink: require('../../img/Admin-onboarding/CreateCourse.png'),
    text: 'Get started by creating a course. You can also copy assignments from an old one to save time.',
  },
  {
    imgLink: require('../../img/Admin-onboarding/Roster-Student.png'),
    text:
      'Upload your roster to create students, graders, and admins. \
      Add yourself as a grader if you’d like to grade submissions yourself.',
  },
  {
    imgLink: require('../../img/Admin-onboarding/Create-Assignment.png'),
    text: 'Create your first assignment.',
  },
  {
    imgLink: require('../../img/Admin-onboarding/Assignment-Rubric.png'),
    text:
      'Create a rubric. Graders will use the rubric to make comments on student work, as well as apply deductions. \
      You can track the frequency with which rubric items are applied here, as well.',
  },
  {
    imgLink: require('../../img/Admin-onboarding/Submissions-Overview.png'),
    text: 'View submissions by student and grader.',
  },
  {
    imgLink: require('../../img/Admin-onboarding/Assignments--Drawer.png'),
    text: 'Keep track of all assignments, including real-time data on statistics.',
  },
  {
    imgLink: require('../../img/Admin-onboarding/Api-Docs.png'),
    text: (
      <div>
        Check out the{' '}
        <a href="http://docs.codepost.io" target="_blank">
          codePost API{' '}
        </a>
        to start building powerful scripts and integrations. \ Your unique API key can be accessed from your{' '}
        <Link to={'/settings'}>settings</Link> page
      </div>
    ),
  },
];
export { ModalCarousel, adminCarouselContent };
