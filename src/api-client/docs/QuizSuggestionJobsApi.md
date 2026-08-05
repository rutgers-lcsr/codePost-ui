# QuizSuggestionJobsApi

All URIs are relative to *http://localhost*

| Method                                            | HTTP request                      | Description |
| ------------------------------------------------- | --------------------------------- | ----------- |
| [**retrieve**](QuizSuggestionJobsApi.md#retrieve) | **GET** /quizSuggestionJobs/{id}/ |             |

## retrieve

> QuizSuggestionJob retrieve(id)

Poll an AI quiz-suggestion generation run. Jobs are created by &#x60;&#x60;assignments/{id}/generateQuizQuestions/&#x60;&#x60; and &#x60;&#x60;questions/{id}/regenerateSuggestion/&#x60;&#x60;; the generation task updates &#x60;&#x60;status&#x60;&#x60;/&#x60;&#x60;errorMessage&#x60;&#x60;/&#x60;&#x60;createdCount&#x60;&#x60; on every exit path, so clients poll here instead of inferring failure from an empty suggestion list. retrieve: Return the generation run\&#39;s current status, suggestion count, and error detail.

### Example

```ts
import { Configuration, QuizSuggestionJobsApi } from '';
import type { RetrieveRequest } from '';

async function example() {
  console.log('🚀 Testing  SDK...');
  const config = new Configuration({
    // To configure HTTP basic authorization: basicAuth
    username: 'YOUR USERNAME',
    password: 'YOUR PASSWORD',
    // To configure API key authorization: tokenAuth
    apiKey: 'YOUR API KEY',
    // To configure API key authorization: cookieAuth
    apiKey: 'YOUR API KEY',
    // To configure API key authorization: courseKeyAuth
    apiKey: 'YOUR API KEY',
  });
  const api = new QuizSuggestionJobsApi(config);

  const body = {
    // number | A unique integer value identifying this quiz suggestion job.
    id: 56,
  } satisfies RetrieveRequest;

  try {
    const data = await api.retrieve(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name   | Type     | Description                                                  | Notes                     |
| ------ | -------- | ------------------------------------------------------------ | ------------------------- |
| **id** | `number` | A unique integer value identifying this quiz suggestion job. | [Defaults to `undefined`] |

### Return type

[**QuizSuggestionJob**](QuizSuggestionJob.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [courseKeyAuth](../README.md#courseKeyAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **200**     |             | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
