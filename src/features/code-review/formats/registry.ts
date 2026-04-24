// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import LangMap from 'lang-map';
import { normalizedExtension, fileExtension } from '../../../utils/fileExtensions';
import type { FileType } from '../../../utils/file';
import type { FileTypeDefinition, CommentKind, CommentLike } from './types';

/**
 * Central registry for code review console file types.
 *
 * Each file type self-describes its extensions, renderer, capabilities, and
 * prefetch strategy. The registry handles detection (extension + content)
 * and dispatches to the correct file type at runtime.
 *
 * To add a new file type, create a `FileTypeDefinition` and call
 * `fileTypeRegistry.register(definition)`.
 */
class FileTypeRegistry {
  private fileTypes: FileTypeDefinition[] = [];
  private extensionIndex = new Map<string, FileTypeDefinition>();

  /**
   * Register a file type definition. File types with higher priority are checked
   * first during detection. Re-registering the same `id` replaces the
   * previous definition.
   */
  register(def: FileTypeDefinition): void {
    // Remove existing definition with same id (allows hot-reloading / overrides)
    this.fileTypes = this.fileTypes.filter((f) => f.id !== def.id);
    this.fileTypes.push(def);

    // Keep sorted by priority descending so detect() can short-circuit
    this.fileTypes.sort((a, b) => b.priority - a.priority);

    // Rebuild extension index
    this.rebuildExtensionIndex();
  }

  /**
   * Detect the file type for a given file. Checks file types in priority order:
   * 1. If the file type has a `detect()` function, call it first (content-based).
   * 2. Otherwise, match by normalized file extension.
   *
   * Returns the fallback 'code' file type if nothing else matches.
   */
  detect(file: FileType): FileTypeDefinition {
    const ext = normalizedExtension(file);

    // First pass: file types with custom detect() functions (priority-ordered)
    for (const ft of this.fileTypes) {
      if (ft.detect?.(file)) {
        return ft;
      }
    }

    // Second pass: extension-based lookup
    const byExt = this.extensionIndex.get(ext);
    if (byExt) return byExt;

    // Fallback: must be 'code'
    return this.getById('code')!;
  }

  /** Look up a file type by its unique id. */
  getById(id: string): FileTypeDefinition | undefined {
    return this.fileTypes.find((f) => f.id === id);
  }

  /**
   * Look up a file type by a bare extension string (without leading dot, lowercase).
   * Falls back to the `'code'` file type if no match is found.
   */
  detectByExtension(ext: string): FileTypeDefinition {
    return this.extensionIndex.get(ext.toLowerCase()) ?? this.getById('code')!;
  }

  /** Get all registered file type definitions. */
  getAll(): readonly FileTypeDefinition[] {
    return this.fileTypes;
  }

  /**
   * Look up a file type by a comment kind string.
   * Checks each definition's `commentKinds` array (falling back to `[id]`).
   * This allows `getCommentLabel` to resolve any comment kind — including
   * sub-kinds like `'pdf-text'` — back to the owning definition.
   */
  getByCommentKind(kind: string): FileTypeDefinition | undefined {
    return this.fileTypes.find((f) => {
      const kinds = f.commentKinds ?? [f.id];
      return kinds.includes(kind);
    });
  }

  /**
   * Get the extensions registered for a given file type id.
   * Returns both bare (`md`) and dot-prefixed (`.md`) variants for backward
   * compatibility with the legacy extension arrays in `src/utils/file.ts`.
   */
  getExtensionsWithDots(id: string): string[] {
    const ft = this.getById(id);
    if (!ft) return [];
    return ft.extensions.flatMap((ext) => [ext, `.${ext}`]);
  }

  /**
   * Collect extensions (with dot-prefixed variants) from all file types whose
   * capabilities match a predicate. Used to derive legacy extension arrays.
   */
  getExtensionsByCapability(predicate: (cap: FileTypeDefinition['capabilities']) => boolean): string[] {
    return this.fileTypes
      .filter((f) => predicate(f.capabilities))
      .flatMap((f) => f.extensions.flatMap((ext) => [ext, `.${ext}`]));
  }

  /**
   * Run prefetch hooks for all file types present in a set of files.
   * Each file type's `prefetch()` is called at most once.
   */
  prefetchAll(files: readonly FileType[]): void {
    const seen = new Set<string>();
    for (const file of files) {
      const ft = this.detect(file);
      if (!seen.has(ft.id)) {
        seen.add(ft.id);
        ft.prefetch?.();
      }
    }
  }

  /** Resolve the syntax highlighting language for a file. */
  resolveLanguage(file: FileType): string {
    const ft = this.detect(file);
    if (ft.language) {
      return ft.language(file);
    }
    // Fallback: use lang-map directly (not File.language to avoid circular calls)
    const ext = fileExtension(file.name);
    return LangMap.languages(ext)[0] || ext;
  }

  /**
   * Resolve the discriminated comment kind for a comment on a given file.
   * Delegates to the file type's `resolveCommentKind()` method.
   */
  resolveCommentKind(file: FileType, comment: CommentLike): CommentKind {
    const ft = this.detect(file);
    return ft.resolveCommentKind(comment);
  }

  /**
   * Collect all executable extensions across all registered file types.
   * Returns both bare (`py`) and dot-prefixed (`.py`) variants.
   */
  getExecutableExtensions(): string[] {
    return this.fileTypes.flatMap((f) => f.executableExtensions.flatMap((ext) => [ext, `.${ext}`]));
  }

  /**
   * Check whether a given extension (without dot) is executable.
   */
  isExecutableExtension(ext: string): boolean {
    const lower = ext.toLowerCase();
    return this.fileTypes.some((f) => f.executableExtensions.includes(lower));
  }

  /**
   * Find a block/page DOM element for a comment's startLine on a given file.
   * Returns null for file types that use line-based scrolling.
   */
  findBlockElement(file: FileType, startLine: number): Element | null {
    const ft = this.detect(file);
    if (!ft.blockSelector) return null;
    return document.querySelector(ft.blockSelector(startLine));
  }

  /**
   * Apply visual focus styling to the block element associated with a comment.
   * No-ops for file types without block highlighting (line-based or PDF).
   */
  focusBlock(file: FileType, startLine: number, mode: 'readonly' | 'active'): HTMLElement | null {
    const ft = this.detect(file);
    if (!ft.blockSelector || !ft.focusBlock) return null;
    const el = document.querySelector<HTMLElement>(ft.blockSelector(startLine));
    if (el) ft.focusBlock(el, mode);
    return el;
  }

  /**
   * Remove visual focus styling from the block element associated with a comment.
   * No-ops for file types without block highlighting.
   */
  blurBlock(file: FileType, startLine: number, mode: 'readonly' | 'active'): void {
    const ft = this.detect(file);
    if (!ft.blockSelector || !ft.blurBlock) return;
    const el = document.querySelector<HTMLElement>(ft.blockSelector(startLine));
    if (el) ft.blurBlock(el, mode);
  }

  /**
   * Extract a sort key for a comment within its startLine group.
   * Delegates to the file type's `commentSortKey` if provided,
   * otherwise falls back to `startChar ?? 0`.
   */
  commentSortKey(file: FileType, comment: CommentLike): number {
    const ft = this.detect(file);
    if (ft.commentSortKey) return ft.commentSortKey(comment);
    return comment.startChar ?? 0;
  }

  private rebuildExtensionIndex(): void {
    this.extensionIndex.clear();
    // Insert in reverse-priority order so higher-priority file types win
    const reversed = [...this.fileTypes].reverse();
    for (const ft of reversed) {
      for (const ext of ft.extensions) {
        this.extensionIndex.set(ext, ft);
      }
    }
    // Re-insert in priority order so higher-priority wins
    for (const ft of this.fileTypes) {
      for (const ext of ft.extensions) {
        this.extensionIndex.set(ext, ft);
      }
    }
  }
}

/** Singleton file type registry instance. */
export const fileTypeRegistry = new FileTypeRegistry();
