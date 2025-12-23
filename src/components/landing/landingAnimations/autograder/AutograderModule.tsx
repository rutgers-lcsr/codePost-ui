import { useState, useEffect, useRef } from 'react';

import { Slider, Typography } from 'antd';

import fileMode from './FileMode.jpg';
import noCode from './IO.jpg';
import unit from './Unit.jpg';

const AutograderModule = () => {
  const [index, setIndex] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Add aria-label to the slider handle for accessibility
  useEffect(() => {
    if (sliderRef.current) {
      const handle = sliderRef.current.querySelector('.ant-slider-handle');
      if (handle) {
        handle.setAttribute('aria-label', 'Test complexity: Simple to Flexible');
      }
    }
  }, []);

  const noCodeImg = <img style={{ marginTop: 5, marginLeft: 10 }} width={550} src={noCode} alt="" />;
  const unitImg = <img style={{ marginTop: 6, marginLeft: 10 }} width={550} src={unit} alt="" />;
  const fileModeImg = <img style={{ marginTop: 0, marginLeft: 5 }} width={550} src={fileMode} alt="" />;

  const handleChange = (e: any) => {
    setIndex(e);
  };

  let text;
  switch (index) {
    case 0:
      text = 'Write tests without any code!';
      break;
    case 1:
      text = 'Write powerful unit tests.';
      break;
    case 2:
      text = 'Import your existing test scripts and run them as is.';
      break;
  }
  return (
    <div style={{ marginRight: 25 }}>
      <div ref={sliderRef} style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
        <Typography.Text
          className={index === 0 ? 'slider-text--active' : index === 1 ? 'slider-text' : 'slider-text--inactive'}
          style={{ marginRight: 15 }}
        >
          Simple
        </Typography.Text>
        <Slider
          style={{ width: 'calc(100% - 80px)' }}
          tooltip={{ open: false }}
          min={0}
          max={2}
          dots={true}
          onChange={handleChange}
          value={index}
          aria-label="Test complexity: Simple to Flexible"
        />
        <Typography.Text
          className={index === 2 ? 'slider-text--active' : index === 1 ? 'slider-text' : 'slider-text--inactive'}
          style={{ marginLeft: 15 }}
        >
          Flexible
        </Typography.Text>
      </div>
      <div
        style={{
          fontWeight: 500,
          fontSize: 18,
          color: '#666666',
          fontStyle: 'italic',
          marginBottom: 10,
        }}
        className={`display-flex justify-content-center align-items-center`}
      >
        {text}
      </div>
      <div
        style={{
          maxWidth: 550,
          width: 550,
          height: 390,
          position: 'relative',
        }}
        className={`display-flex justify-content-center align-items-center`}
      >
        <div
          style={{ position: 'absolute', maxWidth: 550, borderRadius: 8 }}
          className={`display-flex justify-content-center align-items-center bevel autograder-image${index === 0 ? '--active' : ''
            }`}
        >
          {noCodeImg}
        </div>
        <div
          style={{ position: 'absolute', maxWidth: 550, borderRadius: 8 }}
          className={`display-flex justify-content-center align-items-center bevel autograder-image${index === 1 ? '--active' : ''
            }`}
        >
          {unitImg}
        </div>
        <div
          style={{ position: 'absolute', maxWidth: 550, borderRadius: 8 }}
          className={`display-flex justify-content-center align-items-center bevel autograder-image${index === 2 ? '--active' : ''
            }`}
        >
          {fileModeImg}
        </div>
      </div>
    </div>
  );
};

export default AutograderModule;
