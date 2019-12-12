import React, { useState } from 'react';

import { Slider, Typography } from 'antd';

const noCode = require('./IO.png');
const unit = require('./Unit.png');
const fileMode = require('./FileMode.png');

const AutograderModule = () => {
  const [index, setIndex] = useState(0);

  const noCodeImg = <img style={{ marginTop: 30, marginLeft: 10 }} width={475} src={noCode} alt="" />;
  const unitImg = <img style={{ marginTop: 30, marginLeft: 10 }} width={475} src={unit} alt="" />;
  const fileModeImg = <img style={{ marginTop: -1, marginLeft: -5 }} width={475} src={fileMode} alt="" />;

  const handleChange = (e: any) => {
    setIndex(e);
  };

  let imgToShow;
  let text;
  switch (index) {
    case 0:
      imgToShow = noCodeImg;
      text = 'Write tests without any code!';
      break;
    case 1:
      imgToShow = unitImg;
      text = 'Write powerful unit tests.';
      break;
    case 2:
      imgToShow = fileModeImg;
      text = 'Import your existing test scripts and run them as is.';
      break;
  }
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
        <Typography.Text
          className={index == 0 ? 'slider-text--active' : index == 1 ? 'slider-text' : 'slider-text--inactive'}
          style={{ marginRight: 15 }}
        >
          Simple
        </Typography.Text>
        <Slider
          style={{ width: 'calc(100% - 80px)' }}
          tooltipVisible={false}
          min={0}
          max={2}
          dots={true}
          onChange={handleChange}
          value={index}
        />
        <Typography.Text
          className={index == 2 ? 'slider-text--active' : index == 1 ? 'slider-text' : 'slider-text--inactive'}
          style={{ marginLeft: 15 }}
        >
          Flexible
        </Typography.Text>
      </div>
      <div
        style={{
          fontWeight: 500,
          fontSize: 18,
          color: '#AAAAAA',
          fontStyle: 'italic',
          marginBottom: 10,
        }}
        className={`display-flex justify-content-center align-items-center`}
      >
        {text}
      </div>
      <div
        style={{
          maxWidth: 480,
          maxHeight: 340,
          borderRadius: 8,
        }}
        className={`display-flex justify-content-center align-items-center bevel`}
      >
        {imgToShow}
      </div>
    </div>
  );
};

export default AutograderModule;
