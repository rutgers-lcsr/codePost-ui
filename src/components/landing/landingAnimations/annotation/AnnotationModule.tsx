// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import code from './Code.jpg';
import jupyter from './Jupyter.jpg';
import pdf from './PDF.jpg';

interface IProps {
  index: number;
}

const AnnotationModule = (props: IProps) => {
  const codeImg = <img width={370} src={code} alt="" />;
  const jupyterImg = <img width={370} src={jupyter} alt="" />;
  const pdfImg = <img width={370} src={pdf} alt="" />;

  return (
    <div
      style={{
        position: 'relative',
        width: 550,
        height: 400,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          maxWidth: 370,
          borderRadius: 8,
          position: 'absolute',
        }}
        className={`display-flex justify-content-center align-items-center bevel annotation-image${
          props.index === 0 ? '--active' : ''
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
          props.index === 1 ? '--active' : ''
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
          props.index === 2 ? '--active' : ''
        }`}
      >
        {pdfImg}
      </div>
    </div>
  );
};

export default AnnotationModule;
