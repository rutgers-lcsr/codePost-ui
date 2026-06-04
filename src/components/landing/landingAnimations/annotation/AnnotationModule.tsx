// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import React, { useEffect, useState } from 'react';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { googlecode } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { Badge, Card } from 'antd';
import { LinkOutlined } from '@ant-design/icons';
import { colors } from '../../../../theme/colors';

// ── Code for each tab ──────────────────────────────────────────────
const codeSnippet = `def merge_sort(arr):
    if len(arr) <= 1:
        return arr
    mid = len(arr) // 2
    left  = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])
    return merge(left, right)

def merge(left, right):
    result, i, j = [], 0, 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            result.append(left[i]); i += 1
        else:
            result.append(right[j]); j += 1
    return result + left[i:] + right[j:]`;

const jupyterCode = `import matplotlib.pyplot as plt
import numpy as np

x = np.linspace(0, 2 * np.pi, 100)
y = np.sin(x)
plt.plot(x, y)
plt.title("Sine Wave")
plt.show()`;

const pdfLines = [
  "In this paper we analyze Dijkstra's algorithm for finding",
  'shortest paths in a weighted, directed graph. The algorithm',
  'maintains a min-priority queue to efficiently select the',
  'node with minimum tentative distance at each iteration.',
  '',
  'Time complexity:  O((V + E) log V)',
  'Space complexity: O(V)',
];

// ── Comment data per tab ───────────────────────────────────────────
interface CommentData {
  line: string; // "Line 3" or "Cell 1" or "Page 1"
  author: string;
  points: number;
  text: string;
  rubric?: string; // optional rubric comment text
}

const COMMENTS: Record<string, CommentData[]> = {
  Code: [
    {
      line: 'Line 3',
      author: 'grader1',
      points: 2,
      text: 'Missing base-case guard — what if arr is None?',
      rubric: 'Missing edge case check',
    },
    {
      line: 'Line 10',
      author: 'grader1',
      points: 1,
      text: 'Consider in-place merge to avoid O(n) extra space per call.',
    },
  ],
  Jupyter: [
    {
      line: 'Cell 1',
      author: 'grader1',
      points: 1,
      text: 'Label your axes with plt.xlabel() and plt.ylabel().',
      rubric: 'Missing axis labels',
    },
  ],
  PDF: [
    {
      line: 'Page 1',
      author: 'grader1',
      points: 1,
      text: 'Space complexity analysis is incomplete — add O(V) discussion.',
    },
  ],
};

// ── Highlight lines per tab (1-indexed) ────────────────────────────
const CODE_HIGHLIGHT_LINES = [3, 10];
const JUPYTER_HIGHLIGHT_LINES = [6, 7];
const PDF_HIGHLIGHT_LINE = 5; // "Time complexity" line

// ── Comment card (mirrors real Comment.tsx Card layout) ────────────
interface CommentCardProps {
  data: CommentData;
  visible: boolean;
  hovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

const CommentCard: React.FC<CommentCardProps> = ({ data, visible, hovered, onMouseEnter, onMouseLeave }) => (
  <div
    style={{
      marginBottom: 10,
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(6px)',
      transition: 'opacity 0.35s ease, transform 0.35s ease, box-shadow 0.15s ease',
      boxShadow: hovered
        ? 'rgba(0,0,0,0.25) 0px 14px 28px, rgba(0,0,0,0.22) 0px 10px 10px'
        : 'rgba(0,0,0,0.24) 0px 3px 8px',
    }}
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
  >
    <Card
      size="small"
      hoverable
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontWeight: 500, fontStyle: 'italic', fontSize: 13, color: '#333' }}>{data.line}</span>
            <LinkOutlined style={{ fontSize: 11, color: '#aaa' }} />
          </div>
          <Badge count={data.points} />
        </div>
      }
      styles={{
        header: {
          padding: '6px 12px',
          minHeight: 32,
          backgroundColor: '#fafafa',
          borderBottom: '1px solid rgb(232,232,232)',
        },
        body: { padding: '10px 12px' },
      }}
      style={{ borderRadius: 4, overflow: 'hidden' }}
    >
      {data.rubric && (
        <div
          style={{
            marginBottom: 8,
            padding: '4px 8px',
            borderRadius: 4,
            border: '1px solid #ffa39e',
            backgroundColor: '#fff1f0',
            fontSize: 11,
            color: '#cf1322',
            fontWeight: 500,
          }}
        >
          {data.rubric} &nbsp;({data.points > 0 ? `-${data.points}` : `+${Math.abs(data.points)}`})
        </div>
      )}
      <div style={{ fontSize: 12, lineHeight: 1.67, color: '#333', whiteSpace: 'pre-wrap' }}>{data.text}</div>
      <div
        style={{
          marginTop: 8,
          paddingTop: 8,
          borderTop: '1px solid rgb(232,232,232)',
          fontSize: 11,
          fontStyle: 'italic',
          color: '#595959',
        }}
      >
        Author: {data.author}
      </div>
    </Card>
  </div>
);

// ── Code panel (left side with highlights) ─────────────────────────
const HighlightColor = 'rgba(46, 125, 50, 0.18)';
const HighlightHoverColor = 'rgba(255, 152, 0, 0.35)';

const CodeTab: React.FC<{ hoveredLine: number | null; onHoverLine: (l: number | null) => void }> = ({
  hoveredLine,
  onHoverLine,
}) => (
  <div style={{ fontSize: 11.5 }}>
    <SyntaxHighlighter
      language="python"
      style={googlecode}
      showLineNumbers
      wrapLines
      lineNumberStyle={{ fontSize: 10, color: '#595959', minWidth: '2em' }}
      lineProps={(n) => {
        const isHighlighted = CODE_HIGHLIGHT_LINES.includes(n);
        const isHovered = hoveredLine === n;
        return {
          style: {
            display: 'block',
            background: isHovered ? HighlightHoverColor : isHighlighted ? HighlightColor : 'transparent',
            cursor: isHighlighted ? 'pointer' : undefined,
            transition: 'background 0.15s ease',
          },
          onMouseEnter: isHighlighted ? () => onHoverLine(n) : undefined,
          onMouseLeave: isHighlighted ? () => onHoverLine(null) : undefined,
        };
      }}
    >
      {codeSnippet}
    </SyntaxHighlighter>
  </div>
);

const JupyterTab: React.FC<{ hoveredLine: number | null; onHoverLine: (l: number | null) => void }> = ({
  hoveredLine,
  onHoverLine,
}) => (
  <div style={{ fontSize: 11.5 }}>
    {/* Notebook cell chrome */}
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 8px',
        background: '#f7f7f7',
        borderBottom: '1px solid #e0e0e0',
        fontSize: 10,
        color: '#888',
      }}
    >
      <span style={{ fontFamily: 'monospace' }}>In [1]:</span>
    </div>
    <SyntaxHighlighter
      language="python"
      style={googlecode}
      showLineNumbers
      wrapLines
      lineNumberStyle={{ fontSize: 10, color: '#595959', minWidth: '2em' }}
      lineProps={(n) => {
        const isHighlighted = JUPYTER_HIGHLIGHT_LINES.includes(n);
        const isHovered = hoveredLine === n;
        return {
          style: {
            display: 'block',
            background: isHovered ? HighlightHoverColor : isHighlighted ? HighlightColor : 'transparent',
            transition: 'background 0.15s ease',
          },
          onMouseEnter: isHighlighted ? () => onHoverLine(n) : undefined,
          onMouseLeave: isHighlighted ? () => onHoverLine(null) : undefined,
        };
      }}
    >
      {jupyterCode}
    </SyntaxHighlighter>
  </div>
);

const PDFTab: React.FC<{ hoveredLine: number | null; onHoverLine: (l: number | null) => void }> = ({
  hoveredLine,
  onHoverLine,
}) => (
  <div
    style={{
      padding: '10px 12px',
      fontFamily: 'Georgia, serif',
      fontSize: 13,
      lineHeight: 1.75,
      color: '#222',
    }}
  >
    {pdfLines.map((line, i) => {
      const isHighlighted = i === PDF_HIGHLIGHT_LINE;
      const isHovered = hoveredLine === i;
      return (
        <div
          key={i}
          style={{
            background: isHovered ? HighlightHoverColor : isHighlighted ? HighlightColor : 'transparent',
            paddingLeft: isHighlighted ? 6 : 0,
            transition: 'background 0.15s ease',
            cursor: isHighlighted ? 'pointer' : undefined,
          }}
          onMouseEnter={isHighlighted ? () => onHoverLine(i) : undefined}
          onMouseLeave={isHighlighted ? () => onHoverLine(null) : undefined}
        >
          {line || '\u00A0'}
        </div>
      );
    })}
  </div>
);

// ── Tabs ───────────────────────────────────────────────────────────
const TABS = ['Code', 'Jupyter', 'PDF'] as const;
type Tab = (typeof TABS)[number];

interface IProps {
  index: number;
}

const AnnotationModule: React.FC<IProps> = ({ index = 0 }) => {
  const currentTab: Tab = TABS[index] ?? 'Code';
  const [commentVisible, setCommentVisible] = useState(false);
  const [hoveredComment, setHoveredComment] = useState<number | null>(null);
  const [hoveredLine, setHoveredLine] = useState<number | null>(null);

  useEffect(() => {
    // animation reset on tab change with delayed reveal
    setHoveredComment(null);
    setHoveredLine(null);
    const t = setTimeout(() => setCommentVisible(true), 500);
    return () => clearTimeout(t);
  }, [currentTab]);

  const comments = COMMENTS[currentTab] || [];

  // Bidirectional hover: comment ↔ code highlight
  const handleHoverComment = (idx: number | null) => {
    setHoveredComment(idx);
    if (idx !== null) {
      if (currentTab === 'Code') setHoveredLine(CODE_HIGHLIGHT_LINES[idx] ?? null);
      else if (currentTab === 'Jupyter') setHoveredLine(JUPYTER_HIGHLIGHT_LINES[idx] ?? null);
      else setHoveredLine(PDF_HIGHLIGHT_LINE);
    } else {
      setHoveredLine(null);
    }
  };

  const handleHoverLine = (line: number | null) => {
    setHoveredLine(line);
    if (line !== null) {
      if (currentTab === 'Code') {
        const idx = CODE_HIGHLIGHT_LINES.indexOf(line);
        setHoveredComment(idx >= 0 ? idx : null);
      } else if (currentTab === 'Jupyter') {
        const idx = JUPYTER_HIGHLIGHT_LINES.indexOf(line);
        setHoveredComment(idx >= 0 ? idx : null);
      } else {
        setHoveredComment(0);
      }
    } else {
      setHoveredComment(null);
    }
  };

  const filename = currentTab === 'Code' ? 'solution.py' : currentTab === 'Jupyter' ? 'solution.ipynb' : 'report.pdf';

  return (
    <div
      style={{
        width: 560,
        background: 'rgb(242, 242, 242)',
        borderRadius: 6,
        border: '1px solid #ddd',
        overflow: 'hidden',
        boxShadow: '0 4px 16px rgba(0,0,0,0.07)',
      }}
    >
      {/* File tab bar */}
      <div
        style={{
          background: '#fafafa',
          borderBottom: '1px solid #e8e8e8',
          padding: '5px 12px',
          fontSize: 12,
          color: colors.neutralTitle,
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{filename}</span>
      </div>

      {/* Split panel: code left, comments right */}
      <div style={{ display: 'flex', minHeight: 300 }}>
        {/* Left: Code */}
        <div
          style={{
            flex: '0 0 62%',
            borderRight: '1px solid #e0e0e0',
            overflow: 'auto',
            background: '#fff',
          }}
        >
          {currentTab === 'Code' && <CodeTab hoveredLine={hoveredLine} onHoverLine={handleHoverLine} />}
          {currentTab === 'Jupyter' && <JupyterTab hoveredLine={hoveredLine} onHoverLine={handleHoverLine} />}
          {currentTab === 'PDF' && <PDFTab hoveredLine={hoveredLine} onHoverLine={handleHoverLine} />}
        </div>

        {/* Right: Comments */}
        <div
          style={{
            flex: 1,
            padding: '10px 8px',
            overflowY: 'auto',
            background: 'rgb(242, 242, 242)',
          }}
        >
          {comments.map((c, i) => (
            <CommentCard
              key={`${currentTab}-${i}`}
              data={c}
              visible={commentVisible}
              hovered={hoveredComment === i}
              onMouseEnter={() => handleHoverComment(i)}
              onMouseLeave={() => handleHoverComment(null)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnnotationModule;
