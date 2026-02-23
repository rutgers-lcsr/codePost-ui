// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { RubricCategory, RubricComment } from '../api-client/models';

export interface RubricFullData {
  rubricCategories: RubricCategory[];
  rubricComments: RubricComment[];
}

export interface RubricCommentInstanceList {
  comments: number[];
}

export interface RubricCommentFeedback {
  negative: number;
  positive: number;
}
