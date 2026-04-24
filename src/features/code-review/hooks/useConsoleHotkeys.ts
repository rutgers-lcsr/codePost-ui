// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial Licensed, included with this software.
import React, { useCallback, useEffect, useRef } from 'react';
import { CURSOR_DOMAIN, ICodeConsoleState, PANEL_TYPE, PERMISSION_LEVEL } from '../../../types/CodeConsole.types';
import { useCodeConsoleStore } from '../../../stores/useCodeConsoleStore';
import { getOsTriggerKeyFromEvent } from '../../../components/core/operatingSystem';
import { LOCAL_SETTINGS } from '../../../components/utils/LocalSettings';
import type { FileWithId } from '../../../utils/file';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface UseConsoleHotkeysOptions {
  /** The backwards-compat setState shim that builds ICodeConsoleState and diffs into the store. */
  setState: (updater: React.SetStateAction<ICodeConsoleState>) => void;
}

export interface UseConsoleHotkeysReturn {
  /** Toggle cursor mode on/off. Passed as prop to child components. */
  toggleCursorMode: (cursorMode: boolean) => void;
  /** Set the cursor domain (CODE, COMMENTS, RUBRIC, etc.). Passed as prop to child components. */
  updateCursorDomain: (domain: CURSOR_DOMAIN) => void;
  /** Raw keydown handler for hotkeys — exposed so the mount effect can still register it alongside componentDidMountLogic. */
  handleHotkeys: (e: KeyboardEvent) => void;
  /** Raw keydown handler for cursor — exposed so the mount effect can still register it alongside componentDidMountLogic. */
  handleCursor: (e: KeyboardEvent) => void;
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useConsoleHotkeys({ setState }: UseConsoleHotkeysOptions): UseConsoleHotkeysReturn {
  // Track last active sidebar key for sticky toggle (Ctrl+B)
  const lastSiderKeyRef = useRef<string | null>(null);
  const activeSiderKey = useCodeConsoleStore((s) => s.activeSiderKey);

  useEffect(() => {
    if (activeSiderKey) {
      lastSiderKeyRef.current = activeSiderKey;
    }
  }, [activeSiderKey]);

  // ── handleHotkeys ───────────────────────────────────────────────────────

  const handleHotkeys = useCallback(
    (e: KeyboardEvent) => {
      const triggerKey = getOsTriggerKeyFromEvent(e);

      // Toggle Sidebar (Ctrl+B / Cmd+B) — Ctrl+Shift+B for Hide Grades
      if (e.code === 'KeyB' && triggerKey) {
        if (e.shiftKey) {
          e.preventDefault();
          e.stopPropagation();
          setState((prev) => ({ ...prev, hideGrades: !prev.hideGrades }));
          return;
        }

        e.preventDefault();
        e.stopPropagation();
        setState((prev) => {
          if (prev.activeSiderKey) {
            return { ...prev, activeSiderKey: null };
          } else {
            let target = lastSiderKeyRef.current;
            if (!target) {
              target = prev.permissionLevel === PERMISSION_LEVEL.WRITE ? 'rubric-menu' : 'file-menu';
            }
            return { ...prev, activeSiderKey: target };
          }
        });
        return;
      }

      // Toggle Dark Mode (Ctrl+I / Cmd+I)
      if (e.code === 'KeyI' && triggerKey) {
        e.preventDefault();
        e.stopPropagation();
        const currentMode = LOCAL_SETTINGS.darkMode.getter();
        const nextMode = !currentMode;
        LOCAL_SETTINGS.darkMode.setter(nextMode);
        window.location.reload();
        return;
      }

      // File Navigation (Alt + [ / Alt + ])
      if (e.altKey && (e.code === 'BracketLeft' || e.code === 'BracketRight')) {
        e.preventDefault();
        e.stopPropagation();

        setState((prev) => {
          const currentFiles = (prev.files || []) as FileWithId[];
          const selected = prev.selectedFile as FileWithId | undefined;
          if (currentFiles.length === 0 || !selected) return prev;

          const currentIndex = currentFiles.findIndex((f) => f.id === selected.id);
          if (currentIndex === -1) return prev;

          let newIndex = e.code === 'BracketRight' ? currentIndex + 1 : currentIndex - 1;
          if (newIndex >= currentFiles.length) newIndex = 0;
          if (newIndex < 0) newIndex = currentFiles.length - 1;

          const nextFile = currentFiles[newIndex];
          LOCAL_SETTINGS.mostRecentFile.setter(nextFile.id);

          return {
            ...prev,
            selectedFile: nextFile,
            activeCommentID: undefined,
            panelType: PANEL_TYPE.FILE,
          };
        });
        return;
      }

      // Sidebar Tab Shortcuts
      const SIDEBAR_TAB_SHORTCUTS: { [key: string]: string } = {
        KeyE: 'submission-info',
        KeyD: 'tests-menu',
        KeyF: 'file-menu',
        KeyG: 'rubric-menu',
        KeyH: 'template-menu',
      };

      if (triggerKey && e.shiftKey) {
        if (e.code === 'Slash') {
          e.preventDefault();
          e.stopPropagation();
          useCodeConsoleStore.getState().setShowHelpModal(!useCodeConsoleStore.getState().showHelpModal);
          return;
        }

        const targetTab = SIDEBAR_TAB_SHORTCUTS[e.code];
        if (targetTab) {
          e.preventDefault();
          e.stopPropagation();
          setState((prev) => ({ ...prev, activeSiderKey: targetTab }));
        }
      }
    },
    [setState],
  );

  // ── Cursor helpers ──────────────────────────────────────────────────────

  const focusActiveComment = useCallback(() => {
    const commentTextArea = document.getElementById('comment-text-area');
    commentTextArea?.focus();
  }, []);

  const blurActiveComment = useCallback(() => {
    const commentTextArea = document.getElementById('comment-text-area');
    commentTextArea?.blur();
  }, []);

  const toggleCursorMode = useCallback(
    (cursorMode: boolean) => {
      setState((prev) => ({
        ...prev,
        cursorMode,
        showCursor: cursorMode ? CURSOR_DOMAIN.CODE : CURSOR_DOMAIN.CODE_HIDDEN,
      }));
    },
    [setState],
  );

  const updateCursorDomain = useCallback(
    (domain: CURSOR_DOMAIN) => {
      setState((prev) => ({
        ...prev,
        showCursor: domain,
        activeCommentID: domain === CURSOR_DOMAIN.CODE ? undefined : prev.activeCommentID,
      }));
    },
    [setState],
  );

  // ── handleCursor ────────────────────────────────────────────────────────

  const handleCursor = useCallback(
    (e: KeyboardEvent) => {
      const triggerKey = getOsTriggerKeyFromEvent(e);

      // Help Modal - Ctrl+/ or Ctrl+?
      if ((e.key === '/' || e.key === '?') && triggerKey) {
        e.preventDefault();
        e.stopPropagation();
        useCodeConsoleStore.getState().setShowHelpModal(!useCodeConsoleStore.getState().showHelpModal);
        return;
      }

      // Toggle Cursor Mode: Ctrl+Shift+Y
      if ((e.key === 'y' || e.key === 'Y') && triggerKey && e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        setState((prev) => ({
          ...prev,
          cursorMode: !prev.cursorMode,
          showCursor: !prev.cursorMode ? CURSOR_DOMAIN.CODE : CURSOR_DOMAIN.CODE_HIDDEN,
        }));
        return;
      }

      setState((prev) => {
        if (!prev.cursorMode || !prev.selectedFile) return prev;

        if (prev.activeCommentID !== undefined) {
          if (e.key === 'y' && triggerKey && !e.shiftKey) {
            e.preventDefault();
            e.stopPropagation();

            if (prev.showCursor === CURSOR_DOMAIN.RUBRIC) {
              focusActiveComment();
              return { ...prev, showCursor: CURSOR_DOMAIN.CODE_HIDDEN };
            } else {
              blurActiveComment();
              return { ...prev, showCursor: CURSOR_DOMAIN.RUBRIC };
            }
          } else if (e.key === 'e' && triggerKey && e.shiftKey) {
            e.preventDefault();
            e.stopPropagation();
            return { ...prev, showCursor: CURSOR_DOMAIN.CODE, activeCommentID: undefined };
          }
        } else {
          if (e.key === 'e' && triggerKey && !e.shiftKey) {
            e.preventDefault();
            e.stopPropagation();
            const selected = prev.selectedFile as FileWithId | undefined;
            const hasComments = selected ? prev.comments[selected.id]?.length > 0 : false;
            return hasComments ? { ...prev, showCursor: CURSOR_DOMAIN.COMMENTS } : prev;
          } else if (e.key === 'e' && triggerKey && e.shiftKey) {
            e.preventDefault();
            e.stopPropagation();
            return { ...prev, showCursor: CURSOR_DOMAIN.CODE };
          }
        }

        return prev;
      });
    },
    [blurActiveComment, focusActiveComment, setState],
  );

  return {
    toggleCursorMode,
    updateCursorDomain,
    handleHotkeys,
    handleCursor,
  };
}
