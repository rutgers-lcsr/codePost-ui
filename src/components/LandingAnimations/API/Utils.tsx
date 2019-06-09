import React from 'react';

const Circle = (props: { item: React.ReactElement; radius: number; borderWidth: number; color: string }) => {
  const d = props.radius * 2;
  return (
    <div
      style={{
        width: d,
        height: d,
        borderWidth: props.borderWidth,
        borderColor: props.color,
        borderRadius: props.radius,
        backgroundColor: 'white',
        borderStyle: 'solid',
        verticalAlign: 'middle',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {props.item}
    </div>
  );
};

const AbsoluteCircle = (props: {
  x: number;
  y: number;
  boxWidth: number;
  boxHeight: number;
  radius: number;
  item: React.ReactElement;
}) => {
  const top = props.boxHeight - props.y - props.radius;
  const left = props.boxWidth - props.x - props.radius;

  return (
    <div
      style={{
        position: 'absolute',
        top,
        left,
        zIndex: 5,
        verticalAlign: 'middle',
      }}
    >
      {props.item}
    </div>
  );
};

function hexToRGB(hex: string, alpha: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  return `rgba(${r},${g},${b},${alpha})`;
}

export { Circle, AbsoluteCircle, hexToRGB };
