# Testing Utilities for use in vitests

These include common mocks used by tests. If there is a change in the models from the API, update the factories here to reflect that change and regenerate snapshots.

This will have mocks, factories, generated test data, and any other utilities that are shared across multiple test files. The goal is to avoid duplication and make it easy to create realistic test data.

## Example usage

```ts
import { makeSubmission } from '@test-utils/factories';
```
