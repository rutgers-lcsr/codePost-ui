// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.

export { fileTypeRegistry } from './registry';
export type {
  FileTypeDefinition,
  FileTypeCapabilities,
  CommentStyle,
  CommentKind,
  RenderStrategy,
  CommentLike,
} from './types';
export { setPdfVerticalMap } from './pdfSorting';

// Register all built-in formats.
// Import order doesn't matter — priority controls detection order.
import { fileTypeRegistry } from './registry';
import { binaryFileType } from './definitions/binary';
import { codeFileType } from './definitions/code';
import { imageFileType } from './definitions/image';
import { jupyterFileType } from './definitions/jupyter';
import { markdownFileType } from './definitions/markdown';
import { pdfFileType } from './definitions/pdf';

fileTypeRegistry.register(binaryFileType);
fileTypeRegistry.register(codeFileType);
fileTypeRegistry.register(imageFileType);
fileTypeRegistry.register(jupyterFileType);
fileTypeRegistry.register(markdownFileType);
fileTypeRegistry.register(pdfFileType);
