import * as React from 'react';
import { Button } from 'react-md';

interface ISlide {
  imgLink: string;
  text: string;
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
    imgLink: require('../../img/Admin-onboarding/Course-Selector.png'),
    text: 'Get started by choosing a course to view.',
  },
  {
    imgLink: require('../../img/Admin-onboarding/Submissions-Student.png'),
    text: 'View all submissions by student and grader.',
  },
  {
    imgLink: require('../../img/Admin-onboarding/Submissions-Student-DoubleClick.png'),
    text: 'Double click on any student or grader to get more details about his/her submissions.',
  },
  {
    imgLink: require('../../img/Admin-onboarding/Assignments.png'),
    text: 'Keep track of all assignments, including real-time data on statistics.',
  },
  {
    imgLink: require('../../img/Admin-onboarding/Assignments-Rubric.png'),
    text: 'Maintain standard assignment rubrics, to be used as a scoring guideline by graders.',
  },
  {
    imgLink: require('../../img/Admin-onboarding/Roster-Students.png'),
    text: 'Manage the course roster of students, graders, administrators, and sections.',
  },
  {
    imgLink: require('../../img/Admin-onboarding/Roster-Sections.png'),
    text: 'Manage grader privileges, such as the ability to manage all students in a section.',
  },
  {
    imgLink: require('../../img/Admin-onboarding/CreateCourse.png'),
    text: 'Replicate new courses each semester from historical courses, copying all assignments and rubrics.',
  },
  {
    imgLink: require('../../img/Admin-onboarding/Api-Docs.png'),
    text:
      "Write scripts to interact with codePost's api for complete course control. \
      See the documentation at https://docs.codepost.io. \
      A unique API key is provided in user settings. ",
  },
];
export { ModalCarousel, adminCarouselContent };
