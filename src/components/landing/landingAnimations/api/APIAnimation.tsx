import { Icon } from 'antd';
import React from 'react';
import { AbsoluteCircle, Circle, hexToRGB } from './Utils';

// Definition of the position (on a 500x400 pixel grid), color, icon, and names of the auxillary circles
const iconSize = 20;
const circleMap = [
  { name: 'LMS', icon: 'idcard', toneColor: '#f1c40f', fontSize: iconSize, x: 150, y: 265, top: -20, left: 40 },
  { name: 'Autograder', icon: 'code', toneColor: '#16a085', fontSize: iconSize, x: 350, y: 265, top: -20, left: -15 },
  {
    name: 'Version control',
    icon: 'edit',
    toneColor: '#e67e22',
    fontSize: iconSize,
    x: 250,
    y: 80,
    top: 45,
    left: 30,
  },
  {
    name: 'Homegrown tools',
    icon: 'database',
    toneColor: '#d35400',
    fontSize: iconSize,
    x: 250,
    y: 375,
    top: -30,
    left: 30,
  },
  { name: 'Registrar', icon: 'bank', toneColor: '#3498db', fontSize: iconSize, x: 105, y: 113, top: 25, left: 40 },
  {
    name: 'Plagiarism detection',
    icon: 'safety-certificate',
    toneColor: '#9b59b6',
    fontSize: iconSize,
    x: 395,
    y: 113,
    top: 25,
    left: -10,
  },
];

export default function APIAnimation() {
  // Definition of other constants (codePost central circle, and icons)
  const codePostText = (
    <div>
      <div style={{ fontSize: 18, fontFamily: 'sans-serif', fontWeight: 300 }}>codePost</div>
      <div style={{ fontSize: 24, fontFamily: 'sans-serif', fontWeight: 700, color: 'grey', textAlign: 'center' }}>
        API
      </div>
    </div>
  );
  const cPCircle = <Circle item={codePostText} radius={40} borderWidth={0} color={'grey'} />;

  // First position logos
  // Then position center codePost circle
  // Then position auxillary circles
  // Then draw the animated paths
  return (
    <div style={{ width: 500, height: 400, marginTop: 30, position: 'relative' }}>
      <AbsoluteCircle x={250} y={200} radius={40} boxWidth={500} boxHeight={400} item={cPCircle} />
      {circleMap.map((row) => {
        const icon = (
          <div style={{ position: 'relative' }}>
            <Icon
              type={row.icon}
              theme="twoTone"
              twoToneColor={row.toneColor}
              style={{ fontSize: row.fontSize, position: 'absolute', top: row.top, left: row.left, zIndex: 10 }}
            />
            <div style={{ fontSize: 12, fontWeight: 300, textAlign: 'center' }}>{row.name}</div>
          </div>
        );
        const circle = <Circle item={icon} radius={40} borderWidth={2} color={hexToRGB(row.toneColor, '0.15')} />;
        return (
          <AbsoluteCircle key={row.name} x={row.x} y={row.y} radius={40} boxWidth={500} boxHeight={400} item={circle} />
        );
      })}
      <div style={{ position: 'absolute', top: 0 }}>
        <svg height="420" width="500" strokeDasharray={10} strokeDashoffset={10}>
          <circle
            cx="250"
            cy="200"
            r="100"
            fill="transparent"
            stroke="#24be85"
            stroke-width="3"
            transform="rotate(-25 250 200)"
          />
          <path d="M250 335 Q 50 350 130 145" stroke="grey" fill="transparent" />
          <path d="M370 145 Q 450 350 250 335" stroke="grey" fill="transparent" />
          <path d="M130 145 Q 250 -75 370 145" stroke="grey" fill="transparent" />
        </svg>
      </div>
    </div>
  );
}
