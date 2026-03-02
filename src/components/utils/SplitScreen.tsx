// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import React, { Children, useEffect, useRef, useState } from 'react';

type Props = {
  initialLeftWidth?: number; // percentage
  /** Minimum pixel width for the left (code) pane */
  minLeftWidth?: number;
  /** Minimum pixel width for the right (comments) pane */
  minRightWidth?: number;
  children?: React.ReactNode;
};

export default function SplitScreen({ children, initialLeftWidth = 50, minLeftWidth, minRightWidth }: Props) {
  const [leftWidth, setLeftWidth] = useState(initialLeftWidth);
  const [isDividerHovered, setIsDividerHovered] = useState(false);
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
    <div ref={containerRef} style={{ display: 'flex', height: '100%', width: '100%', overflow: 'hidden' }}>
      <div
        className="split-screen-pane"
        style={{
          width: `${leftWidth}%`,
          minWidth: minLeftWidth != null ? `${minLeftWidth}px` : '200px',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        {leftChild && <>{leftChild}</>}
      </div>
      <div
        onMouseDown={handleMouseDown}
        onMouseEnter={() => setIsDividerHovered(true)}
        onMouseLeave={() => setIsDividerHovered(false)}
        style={{
          width: '6px',
          margin: '0px 10px',
          cursor: 'col-resize',
          backgroundColor: isDividerHovered ? '#aaa' : '#ccc',
          userSelect: 'none',
          flexShrink: 0,
        }}
      />
      <div
        className="split-screen-pane"
        style={{
          flex: 1,
          minWidth: minRightWidth != null ? `${minRightWidth}px` : '180px',
          overflow: 'hidden',
        }}
      >
        {rightChild && <>{rightChild}</>}
      </div>
    </div>
  );
}
