# GeneratedQuizQuestionsApi

All URIs are relative to *http://localhost*

| Method                                                          | HTTP request                             | Description |
| --------------------------------------------------------------- | ---------------------------------------- | ----------- |
| [**destroy**](GeneratedQuizQuestionsApi.md#destroy)             | **DELETE** /generatedQuizQuestions/{id}/ |             |
| [**partialUpdate**](GeneratedQuizQuestionsApi.md#partialupdate) | **PATCH** /generatedQuizQuestions/{id}/  |             |
| [**retrieve**](GeneratedQuizQuestionsApi.md#retrieve)           | **GET** /generatedQuizQuestions/{id}/    |             |
| [**update**](GeneratedQuizQuestionsApi.md#update)               | **PUT** /generatedQuizQuestions/{id}/    |             |

## destroy

> destroy(id)

One generated question in a student\&#39;s set. Staff PATCH-edit content inline during review (no regeneration needed) or DELETE a bad question; edits after approval are fine — started attempts are snapshot-isolated.

### Example

```ts
import { Configuration, GeneratedQuizQuestionsApi } from '';
import type { DestroyRequest } from '';

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
  const api = new GeneratedQuizQuestionsApi(config);

  const body = {
    // number | A unique integer value identifying this generated quiz question.
    id: 56,
  } satisfies DestroyRequest;

  try {
    const data = await api.destroy(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name   | Type     | Description                                                      | Notes                     |
| ------ | -------- | ---------------------------------------------------------------- | ------------------------- |
| **id** | `number` | A unique integer value identifying this generated quiz question. | [Defaults to `undefined`] |

### Return type

`void` (Empty response body)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [courseKeyAuth](../README.md#courseKeyAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: Not defined

### HTTP response details

| Status code | Description      | Response headers |
| ----------- | ---------------- | ---------------- |
| **204**     | No response body | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## partialUpdate

> GeneratedQuizQuestion partialUpdate(id, patchedGeneratedQuizQuestion)

One generated question in a student\&#39;s set. Staff PATCH-edit content inline during review (no regeneration needed) or DELETE a bad question; edits after approval are fine — started attempts are snapshot-isolated.

### Example

```ts
import {
  Configuration,
  GeneratedQuizQuestionsApi,
} from '';
import type { PartialUpdateRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({
    // To configure HTTP basic authorization: basicAuth
    username: "YOUR USERNAME",
    password: "YOUR PASSWORD",
    // To configure API key authorization: tokenAuth
    apiKey: "YOUR API KEY",
    // To configure API key authorization: cookieAuth
    apiKey: "YOUR API KEY",
    // To configure API key authorization: courseKeyAuth
    apiKey: "YOUR API KEY",
  });
  const api = new GeneratedQuizQuestionsApi(config);

  const body = {
    // number | A unique integer value identifying this generated quiz question.
    id: 56,
    // PatchedGeneratedQuizQuestion (optional)
    patchedGeneratedQuizQuestion: ...,
  } satisfies PartialUpdateRequest;

  try {
    const data = await api.partialUpdate(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                             | Type                                                            | Description                                                      | Notes                     |
| -------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------- |
| **id**                           | `number`                                                        | A unique integer value identifying this generated quiz question. | [Defaults to `undefined`] |
| **patchedGeneratedQuizQuestion** | [PatchedGeneratedQuizQuestion](PatchedGeneratedQuizQuestion.md) |                                                                  | [Optional]                |

### Return type

[**GeneratedQuizQuestion**](GeneratedQuizQuestion.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [courseKeyAuth](../README.md#courseKeyAuth)

### HTTP request headers

- **Content-Type**: `application/json`, `application/x-www-form-urlencoded`, `multipart/form-data`
- **Accept**: `application/json`

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **200**     |             | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## retrieve

> GeneratedQuizQuestion retrieve(id)

One generated question in a student\&#39;s set. Staff PATCH-edit content inline during review (no regeneration needed) or DELETE a bad question; edits after approval are fine — started attempts are snapshot-isolated.

### Example

```ts
import { Configuration, GeneratedQuizQuestionsApi } from '';
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
  const api = new GeneratedQuizQuestionsApi(config);

  const body = {
    // number | A unique integer value identifying this generated quiz question.
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

| Name   | Type     | Description                                                      | Notes                     |
| ------ | -------- | ---------------------------------------------------------------- | ------------------------- |
| **id** | `number` | A unique integer value identifying this generated quiz question. | [Defaults to `undefined`] |

### Return type

[**GeneratedQuizQuestion**](GeneratedQuizQuestion.md)

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

## update

> GeneratedQuizQuestion update(id, generatedQuizQuestion)

One generated question in a student\&#39;s set. Staff PATCH-edit content inline during review (no regeneration needed) or DELETE a bad question; edits after approval are fine — started attempts are snapshot-isolated.

### Example

```ts
import {
  Configuration,
  GeneratedQuizQuestionsApi,
} from '';
import type { UpdateRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({
    // To configure HTTP basic authorization: basicAuth
    username: "YOUR USERNAME",
    password: "YOUR PASSWORD",
    // To configure API key authorization: tokenAuth
    apiKey: "YOUR API KEY",
    // To configure API key authorization: cookieAuth
    apiKey: "YOUR API KEY",
    // To configure API key authorization: courseKeyAuth
    apiKey: "YOUR API KEY",
  });
  const api = new GeneratedQuizQuestionsApi(config);

  const body = {
    // number | A unique integer value identifying this generated quiz question.
    id: 56,
    // GeneratedQuizQuestion
    generatedQuizQuestion: ...,
  } satisfies UpdateRequest;

  try {
    const data = await api.update(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                      | Type                                              | Description                                                      | Notes                     |
| ------------------------- | ------------------------------------------------- | ---------------------------------------------------------------- | ------------------------- |
| **id**                    | `number`                                          | A unique integer value identifying this generated quiz question. | [Defaults to `undefined`] |
| **generatedQuizQuestion** | [GeneratedQuizQuestion](GeneratedQuizQuestion.md) |                                                                  |                           |

### Return type

[**GeneratedQuizQuestion**](GeneratedQuizQuestion.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [courseKeyAuth](../README.md#courseKeyAuth)

### HTTP request headers

- **Content-Type**: `application/json`, `application/x-www-form-urlencoded`, `multipart/form-data`
- **Accept**: `application/json`

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **200**     |             | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
