/**
 * Custom Hook: useKeyboardShortcuts
 *
 * Manages keyboard shortcuts for the code review interface.
 * This hook can be reused in Jupyter notebook extensions or other contexts
 * that need similar keyboard shortcut functionality.
 *
 * Keyboard Shortcuts:
 * - Cmd/Ctrl + / : Toggle keyboard shortcuts help
 * - Cmd/Ctrl + Shift + Y : Toggle cursor mode
 * - Cmd/Ctrl + Shift + E : Toggle custom comment explorer
 * - (Additional shortcuts when cursor mode is active)
 *
 * @example
 * ```tsx
 * const shortcuts = useKeyboardShortcuts({
 *   onToggleHelp: () => setShowHelp(prev => !prev),
 *   onToggleCursorMode: () => setCursorMode(prev => !prev),
 *   onToggleCommentExplorer: () => setShowExplorer(prev => !prev),
 *   cursorModeEnabled: cursorMode,
 *   hasActiveComment: activeCommentId !== undefined,
 *   hasSelectedFile: selectedFile !== undefined,
 *   onFocusComment: handleFocusComment,
 *   onBlurComment: handleBlurComment,
 *   onClearActiveComment: () => setActiveCommentId(undefined),
 *   onShowComments: handleShowComments,
 * });
 * ```
 */

import { useCallback, useEffect } from 'react';
import { getOsTriggerKeyFromEvent } from '../../../components/core/operatingSystem';

export interface KeyboardShortcutHandlers {
  /** Toggle keyboard shortcuts help modal */
  onToggleHelp?: () => void;

  /** Toggle cursor navigation mode */
  onToggleCursorMode?: () => void;

  /** Toggle custom comment explorer */
  onToggleCommentExplorer?: () => void;

  /** Focus on active comment (move cursor to rubric) */
  onFocusComment?: () => void;

  /** Blur active comment (move cursor back to code) */
  onBlurComment?: () => void;

  /** Clear currently active comment */
  onClearActiveComment?: () => void;

  /** Show comments sidebar */
  onShowComments?: () => void;
}

export interface KeyboardShortcutState {
  /** Whether cursor navigation mode is enabled */
  cursorModeEnabled: boolean;

  /** Whether there's an active comment selected */
  hasActiveComment: boolean;

  /** Whether a file is currently selected */
  hasSelectedFile: boolean;

  /** Current cursor domain (code, comments, rubric, etc.) */
  cursorDomain?: 'code' | 'comments' | 'rubric' | 'hidden';

  /** Whether there are comments on the selected file */
  hasCommentsOnFile?: boolean;
}

export interface UseKeyboardShortcutsOptions {
  handlers: KeyboardShortcutHandlers;
  state: KeyboardShortcutState;
  /** Whether shortcuts are enabled (default: true) */
  enabled?: boolean;
}

/**
 * Hook to manage keyboard shortcuts for code review
 */
export const useKeyboardShortcuts = (options: UseKeyboardShortcutsOptions) => {
  const { handlers, state, enabled = true } = options;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      const triggerKey = getOsTriggerKeyFromEvent(e);

      // Cmd/Ctrl + / : Toggle keyboard shortcuts help
      if (e.key === '/' && triggerKey) {
        e.preventDefault();
        e.stopPropagation();
        handlers.onToggleHelp?.();
        return;
      }

      // Cmd/Ctrl + Shift + Y : Toggle cursor mode
      if (e.key === 'y' && triggerKey && e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        handlers.onToggleCursorMode?.();
        return;
      }

      // The following shortcuts only work in cursor mode
      if (!state.cursorModeEnabled || !state.hasSelectedFile) {
        return;
      }

      if (state.hasActiveComment) {
        // Cmd/Ctrl + Y : Toggle between rubric and code view
        if (e.key === 'y' && triggerKey && !e.shiftKey) {
          e.preventDefault();
          e.stopPropagation();

          if (state.cursorDomain === 'rubric') {
            handlers.onFocusComment?.();
          } else {
            handlers.onBlurComment?.();
          }
        }
      } else {
        // Cmd/Ctrl + E : Show comments (when no active comment)
        if (e.key === 'e' && triggerKey && !e.shiftKey) {
          e.preventDefault();
          e.stopPropagation();

          if (state.hasCommentsOnFile) {
            handlers.onShowComments?.();
          }
        }
      }
    },
    [enabled, handlers, state],
  );

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown]);

  return {
    // Return utility function for components that need to know if a shortcut is active
    isShortcutKey: (e: KeyboardEvent | React.KeyboardEvent, key: string) => {
      const triggerKey = getOsTriggerKeyFromEvent(e);
      return e.key === key && triggerKey;
    },
  };
};

export default useKeyboardShortcuts;
