import React from 'react';

const code = require('./Code.png');
const jupyter = require('./Jupyter.png');
const pdf = require('./PDF.png');

interface IProps {
  index: number;
}

const AnnotationModule = (props: IProps) => {
  const codeImg = <img width={370} src={code} alt="" />;
  const jupyterImg = <img width={370} src={jupyter} alt="" />;
  const pdfImg = <img width={370} src={pdf} alt="" />;

  return (
    <div style={{ position: 'relative', width: 500, left: 140, top: -125 }}>
      <div
        style={{
          maxWidth: 370,
          borderRadius: 8,
          position: 'absolute',
        }}
        className={`display-flex justify-content-center align-items-center bevel annotation-image${
          props.index == 0 ? '--active' : ''
        }`}
      >
        {codeImg}
      </div>
      <div
        style={{
          maxWidth: 370,
          borderRadius: 8,
          position: 'absolute',
        }}
        className={`display-flex justify-content-center align-items-center bevel annotation-image${
          props.index == 1 ? '--active' : ''
        }`}
      >
        {jupyterImg}
      </div>
      <div
        style={{
          maxWidth: 370,
          borderRadius: 8,
          position: 'absolute',
        }}
        className={`display-flex justify-content-center align-items-center bevel annotation-image${
          props.index == 2 ? '--active' : ''
        }`}
      >
        {pdfImg}
      </div>
    </div>
  );
};

export default AnnotationModule;
