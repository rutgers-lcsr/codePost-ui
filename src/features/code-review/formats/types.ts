// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import type { FileType } from '../../../utils/file';

/**
 * Describes how a file type integrates with the code review comment system.
 *
 * - `'line'`   — line-based comments (standard code files)
 * - `'block'`  — block-level comments (markdown, jupyter, images)
 * - `'region'` — text-selection and area-selection comments (PDFs)
 * - `false`    — comments not supported
 */
export type CommentStyle = 'line' | 'block' | 'region' | false;

/**
 * Discriminated comment sub-type returned by `resolveCommentKind()`.
 * Most file types return their own `id`; PDF disambiguates into sub-kinds.
 *
 * Known built-in kinds are listed for autocomplete, but new file types can
 * return any string — no need to edit this union when adding a file type.
 */
export type CommentKind =
  | 'code'
  | 'markdown'
  | 'jupyter'
  | 'image'
  | 'pdf-page'
  | 'pdf-text'
  | 'pdf-region'
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  | (string & {});

/**
 * Controls how CodeContent dispatches rendering for this file type.
 *
 * - `'rich'`  — uses the file type's `renderer` component wrapped in a Suspense
 *               boundary with block-level commenting (markdown, jupyter, image).
 * - `'pdf'`   — uses the file type's `renderer` with PDF-specific comment layering.
 * - `'code'`  — uses the default syntax-highlighter + line-level commenting stack.
 */
export type RenderStrategy = 'rich' | 'pdf' | 'code';

export interface FileTypeCapabilities {
  /** Whether inline editing is supported for this file type. */
  edit: boolean;
  /** How the comment/annotation system works for this file type. */
  comments: CommentStyle;
  /** Whether syntax highlighting applies (code file types only). */
  syntaxHighlight: boolean;
  /** Whether files of this type can be executed by the autograder. */
  executable: boolean;
  /** Whether files of this type are binary (not displayable as text). */
  binary: boolean;
  /**
   * Whether word-wrap can be toggled in the code panel toolbar.
   * Typically true for code files, false for rich/block-based formats.
   */
  wordWrap: boolean;
  /**
   * Whether comments support deep-link sharing (the "share" icon).
   * False for block-based and PDF formats where line-level deep linking
   * is not yet supported.
   */
  deepLinking: boolean;
  /**
   * Whether the comment panel should auto-advance focus to the next
   * uncommented block after submitting a comment. Only meaningful for
   * block-based formats (markdown, jupyter).
   */
  blockFocus: boolean;
  /**
   * Whether files of this type are expected to have large payloads that
   * should bypass the file-size bouncer (e.g. PDFs, images, notebooks).
   */
  expectsLargePayload: boolean;
  /**
   * Whether execution outputs can be cleared from the toolbar.
   * Currently only true for Jupyter notebooks.
   */
  clearableOutputs: boolean;
  /**
   * Whether the "force re-execution" checkbox is shown in the execution panel.
   * Currently only true for Jupyter notebooks.
   */
  forceReExecution: boolean;
}

/** Minimal comment shape needed for comment-kind resolution and sorting. */
export interface CommentLike {
  startChar?: number | null;
  endChar?: number | null;
  startLine?: number;
  endLine?: number;
  /** File ID — needed for PDF vertical-map lookups during sort-key resolution. */
  file?: number | null;
}

export interface FileTypeDefinition {
  /** Unique identifier — matches the legacy `CodeType` values where applicable. */
  id: string;

  /** File extensions this file type handles (without leading dots, lowercase). */
  extensions: string[];

  /**
   * Optional content-based detection that overrides extension matching.
   * Return `true` if this file type should claim the file.
   */
  detect?: (file: FileType) => boolean;

  /**
   * Lazy import for the renderer component. Return `null` when the file type
   * uses the default code renderer (syntax highlighter stack).
   */
  renderer: (() => Promise<{ default: React.ComponentType<unknown> }>) | null;

  /** What this file type can do inside the code review console. */
  capabilities: FileTypeCapabilities;

  /**
   * How CodeContent dispatches rendering for this file type.
   * Determines which rendering branch and comment system to use.
   */
  renderStrategy: RenderStrategy;

  /**
   * How editing works for this file type.
   *
   * - `'monaco'`  — standalone Monaco editor (CodeWindow) replaces the read-only view.
   * - `'inline'`  — the file type's own renderer handles editing internally
   *                  (e.g. Jupyter embeds Monaco editors per-cell).
   * - `'none'`    — editing is not supported.
   */
  editMode: 'monaco' | 'inline' | 'none';

  /**
   * Optional language resolver for syntax-highlighted file types.
   * Returns a language identifier string for hljs / Monaco.
   */
  language?: (file: FileType) => string;

  /**
   * Optional eager-loading hook called when a submission contains files of
   * this file type. Use for warming module/HTTP caches (e.g. PDF worker).
   */
  prefetch?: () => void;

  /**
   * Detection priority — higher values are checked first.
   * Use this when a file type's extensions overlap with a more generic file type
   * (e.g. `.ipynb` is JSON but should be detected as Jupyter, not code).
   * @default 0
   */
  priority: number;

  /**
   * Human-readable label for comment locations in this file type.
   * Used to generate strings like "Line 5", "Cell 3", "Page 2".
   * Receives the 0-indexed startLine and optional endLine.
   */
  commentLabel: (startLine: number, endLine?: number) => string;

  /**
   * All comment kind strings that this file type owns.
   * Used by `getCommentLabel` to reverse-map a `CommentKind` back to
   * this definition's `commentLabel`. Most file types own a single kind
   * matching their `id` (e.g. `['code']`). PDF owns three sub-kinds:
   * `['pdf-page', 'pdf-text', 'pdf-region']`.
   *
   * Defaults to `[id]` when omitted.
   */
  commentKinds?: CommentKind[];

  /**
   * CSS class name(s) appended to the code panel's inner `<div>` when this
   * file type is active. Used for file-type-specific styling (e.g. `code--jupyter`).
   * Return an empty string if no extra class is needed.
   */
  panelClassName: string;

  /**
   * Resolve the discriminated comment sub-kind for a comment on this file type.
   * Most file types simply return their own `id`; PDF disambiguates into
   * `pdf-page`, `pdf-text`, or `pdf-region` based on comment coordinates.
   */
  resolveCommentKind: (comment: CommentLike) => CommentKind;

  /**
   * Subset of extensions from this file type (or the broader `code` type)
   * that the autograder can execute. Empty array if none.
   * Used to derive the global `ExecutableExtensions` list.
   */
  executableExtensions: string[];

  /**
   * CSS selector to locate a block/page element for a given comment startLine.
   * Used by `findBlockElement()` to scroll to the correct position.
   * Return `null` for file types that use line-based scrolling.
   */
  blockSelector?: (startLine: number) => string;

  /**
   * Apply visual focus styling to a block element when a comment card is hovered.
   * Called from Comment.tsx during highlightRelatedComment.
   *
   * @param element  The block/page DOM element found via `blockSelector`.
   * @param mode     Whether the comment panel is 'readonly' or 'active'.
   *
   * Return `undefined` (or omit) to use no block highlighting (line-based files).
   * PDF provides a no-op since PdfHighlightLayer handles hover styling separately.
   */
  focusBlock?: (element: HTMLElement, mode: 'readonly' | 'active') => void;

  /**
   * Remove visual focus styling from a block element when a comment card is unhovered.
   * Counterpart to `focusBlock`.
   */
  blurBlock?: (element: HTMLElement, mode: 'readonly' | 'active') => void;

  /**
   * Extract a sort key for ordering comments within the same startLine.
   * Used by CommentIO.sortComments / compare to interleave comments correctly.
   *
   * For most file types this returns `startChar ?? 0`.
   * PDF overrides this to normalize text-offset and region comments to a
   * shared 0–100 vertical-percentage scale.
   */
  commentSortKey?: (comment: CommentLike) => number;
}
