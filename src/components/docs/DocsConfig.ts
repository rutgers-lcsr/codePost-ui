// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
export type DocCategory =
  | 'Getting Started'
  | 'Instructor Workflows'
  | 'Role Guides'
  | 'Python SDK'
  | 'Reference'
  | 'Changelog';

export interface DocRoute {
  key: string;
  path: string;
  title: string;
  fileName: string;
  category: DocCategory;
  order?: number;
}
