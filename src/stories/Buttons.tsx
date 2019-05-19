import * as React from 'react';

import CPButton from '../components/core/CPButton';

import * as fonts from '../styles/abstracts/_fonts.scss';

export const ButtonsPrimary = () => {
  const captionStyle: React.CSSProperties = {
    color: 'rgba(0, 0, 0, .3)',
    fontSize: '12px',
    lineHeight: 1,
    marginBottom: '1em',
    textTransform: 'uppercase',
    fontFamily: fonts.fontMain,
  };
  // <div style={{ display: 'inline-block', padding: '10px' }}>
  //        <CPButton type="primary" shape="circle" icon="save" size="small" />
  //      </div>
  //      <div style={{ display: 'inline-block', padding: '10px' }}>
  //        <CPButton type="primary" icon="save" size="small">
  //          Primary
  //        </CPButton>
  //      </div>
  // <div>
  //         <div style={{ display: 'inline-block', padding: '10px' }}>
  //           <span style={captionStyle}>default</span>
  //         </div>
  //         <div style={{ display: 'inline-block', padding: '10px' }}>
  //           <CPButton type="primary" size="default">
  //             Primary
  //           </CPButton>
  //         </div>
  //         <div style={{ display: 'inline-block', padding: '10px' }}>
  //           <CPButton type="primary" shape="circle" icon="save" size="default" />
  //         </div>
  //         <div style={{ display: 'inline-block', padding: '10px' }}>
  //           <CPButton type="primary" icon="save" size="default">
  //             Primary
  //           </CPButton>
  //         </div>
  //       </div>
  //       <div>
  //         <div style={{ display: 'inline-block', padding: '10px' }}>
  //           <span style={captionStyle}>large</span>
  //         </div>
  //         <div style={{ display: 'inline-block', padding: '10px' }}>
  //           <CPButton type="primary" size="large">
  //             Primary
  //           </CPButton>
  //         </div>
  //         <div style={{ display: 'inline-block', padding: '10px' }}>
  //           <CPButton type="primary" shape="circle" icon="save" size="large" />
  //         </div>
  //         <div style={{ display: 'inline-block', padding: '10px' }}>
  //           <CPButton type="primary" icon="save" size="large">
  //             Primary
  //           </CPButton>
  //         </div>
  //       </div>
  return (
    <div>
      <div>
        <div>
          <div style={{ display: 'inline-block', padding: '10px' }}>
            <span style={captionStyle}>default</span>
          </div>
          <div style={{ display: 'inline-block', padding: '10px' }}>
            <CPButton cpType="primary" size="default">
              Primary
            </CPButton>
          </div>
          <div style={{ display: 'inline-block', padding: '10px' }}>
            <CPButton cpType="primary" icon="save" size="default" />
          </div>
          <div style={{ display: 'inline-block', padding: '10px' }}>
            <CPButton cpType="primary" icon="save" size="default">
              Primary
            </CPButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ButtonsSecondary = () => {
  return (
    <div>
      <div style={{ display: 'inline-block', padding: '10px' }}>
        <CPButton cpType="secondary">Secondary</CPButton>
      </div>
      <div style={{ display: 'inline-block', padding: '10px' }}>
        <CPButton cpType="danger">Danger</CPButton>
      </div>
    </div>
  );
};

export const ButtonsDisabled = () => {
  return (
    <div>
      <div style={{ display: 'inline-block', padding: '10px' }}>
        <CPButton cpType="primary" disabled={true}>
          Disabled
        </CPButton>
      </div>
      <div style={{ display: 'inline-block', padding: '10px' }}>
        <CPButton cpType="primary" icon="save" disabled={true} />
      </div>
      <div style={{ display: 'inline-block', padding: '10px' }}>
        <CPButton cpType="primary" icon="save" disabled={true}>
          Disabled
        </CPButton>
      </div>
      <div style={{ display: 'inline-block', padding: '10px' }}>
        <CPButton cpType="secondary" disabled={true}>
          Secondary
        </CPButton>
      </div>
    </div>
  );
};
