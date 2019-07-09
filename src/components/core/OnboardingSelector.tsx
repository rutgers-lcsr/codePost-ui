import * as React from 'react';

import { Divider, Icon, Modal } from 'antd';

import CPButton from '../core/CPButton';

import { createDemoCourse } from '../utils/DemoCourse';

interface IOnboardingSelectorProps {
  title: string | React.ReactNode;
  options: React.ReactNode[];
  message: string;
  footer: string;
  visible: boolean;
  onCancel: () => void;
}

const OnboardingSelector = (props: IOnboardingSelectorProps) => {
  return (
    <Modal title={props.title} visible={props.visible} onCancel={props.onCancel} footer={null} width={600}>
      {props.message}
      <br />
      <br />
      {props.options.map((el, index) => {
        return (
          <div key={index.toString()}>
            {el}
            <br />
            <br />
          </div>
        );
      })}
      <Divider />
      {props.footer}
    </Modal>
  );
};

interface IProps {
  visible: boolean;
  onCancel: () => void;
  email: string;
}

const AdminOnboardingSelector = (props: IProps) => {
  const [loading, setLoading] = React.useState(false);

  // call prop function onClick which triggers tour
  const tour1 = (
    <CPButton cpType="primary" block>
      Annotate some code!
    </CPButton>
  );

  const handleDemoCourse = () => {
    setLoading(true);
    createDemoCourse(name, org).then(() => {
      setLoading(false);
    });

    // call prop function which triggers tour here
  };

  const tour2 = (
    <CPButton cpType="secondary" block onClick={handleDemoCourse} loading={loading}>
      Take a spin through a demo course
    </CPButton>
  );

  const message = `Want to learn how codePost works in less
     than 5 minutes? Choose from one of the options below.`;

  const footer = `If you want to get started on your own, you can always take these tutorials
      by asking about the "intro tutorials" in the chat box on the bottom right of this screen`;

  return (
    <OnboardingSelector
      title={
        <span>
          Welcome to codePost! <Icon type="smile" theme="twoTone" twoToneColor={'#24be85'} />
        </span>
      }
      options={[tour1, tour2]}
      visible={props.visible}
      onCancel={props.onCancel}
      message={message}
      footer={footer}
    />
  );
};

export { AdminOnboardingSelector };
