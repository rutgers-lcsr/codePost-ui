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
