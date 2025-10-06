import React, { Children, useEffect, useRef, useState } from 'react';

type Props = {
  children?: React.ReactNode;
};

export default function SplitScreen({ children }: Props) {
  const [leftWidth, setLeftWidth] = useState(50);
  const [isDividerHovered, setIsDividerHovered] = useState(false);
  const [renderKey, setRenderKey] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const childArray = Children.toArray(children);
  const [leftChild, rightChild] = childArray;

  const handleMouseDown = () => {
    isDragging.current = true;
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return;

    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;

    setLeftWidth(Math.max(10, Math.min(90, newLeftWidth)));
  };
  const handleMouseUp = () => {
    isDragging.current = false;
    setRenderKey((prev) => prev + 1);
  };

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);
  return (
    <div ref={containerRef} style={{ display: 'flex', height: '100%', width: '100%' }}>
      <div key={`left-${renderKey}`} style={{ width: `${leftWidth}%`, overflow: 'auto' }}>
        {leftChild && <>{leftChild}</>}
      </div>
      <div
        onMouseDown={handleMouseDown}
        onMouseEnter={() => setIsDividerHovered(true)}
        onMouseLeave={() => setIsDividerHovered(false)}
        style={{
          width: '6px',
          margin: '0px 4px',
          cursor: 'col-resize',
          backgroundColor: isDividerHovered ? '#aaa' : '#ccc',
          userSelect: 'none',
        }}
      />
      <div key={`right-${renderKey}`} style={{ flex: 1, overflow: 'auto' }}>
        {rightChild && <>{rightChild}</>}
      </div>
    </div>
  );
}
