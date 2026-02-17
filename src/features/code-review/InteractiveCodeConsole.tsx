import React from 'react';

/**
 * Lightweight wrapper for the code review console playground.
 *
 * This keeps the CodePlayground page functional without requiring
 * full routing/assignment context. Replace with a richer implementation
 * when playground requirements are defined.
 */
const InteractiveCodeConsole: React.FC = () => {
  return (
    <div style={{ padding: 16 }}>
      <h3 style={{ marginTop: 0 }}>Interactive Console</h3>
      <p style={{ color: '#666' }}>
        The interactive playground is not fully wired yet. Use the standard code review flow to access the console.
      </p>
    </div>
  );
};

export default InteractiveCodeConsole;
