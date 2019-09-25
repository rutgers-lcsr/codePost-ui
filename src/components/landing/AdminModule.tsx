import * as React from 'react';

const assignments = require('../../img/landing/compressed/OS.png');
const graders = require('../../img/landing/compressed/Quality_control.png');
const stats = require('../../img/landing/compressed/Grading_Progress.png');

export const AdminModule = () => {
  return (
    <div>
      <div style={{ position: 'relative', width: 550, height: 200 }}>
        <img
          src={assignments}
          style={{
            boxShadow: '0 22px 25px 0 rgba(228,228,234,.22), 0 9px 23px 0 rgba(228,228,234,.5)',
            borderRadius: 12,
            width: 450,
            padding: '20px 10px',
            left: 100,
            position: 'absolute',
            background: 'white',
            top: -20,
          }}
        />
      </div>
      <img
        src={stats}
        style={{
          boxShadow: '0 22px 25px 0 rgba(228,228,234,.22), 0 9px 23px 0 rgba(228,228,234,.5)',
          borderRadius: 12,
          width: 450,
          padding: '20px 10px',
        }}
      />
    </div>
  );
};
