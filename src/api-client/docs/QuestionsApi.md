# QuestionsApi

All URIs are relative to *http://localhost*

| Method                                                                         | HTTP request                                     | Description |
| ------------------------------------------------------------------------------ | ------------------------------------------------ | ----------- |
| [**copyToBankCreate**](QuestionsApi.md#copytobankcreate)                       | **POST** /questions/copyToBank/                  |             |
| [**create**](QuestionsApi.md#create)                                           | **POST** /questions/                             |             |
| [**destroy**](QuestionsApi.md#destroy)                                         | **DELETE** /questions/{id}/                      |             |
| [**list**](QuestionsApi.md#list)                                               | **GET** /questions/                              |             |
| [**moveToBankCreate**](QuestionsApi.md#movetobankcreate)                       | **POST** /questions/moveToBank/                  |             |
| [**partialUpdate**](QuestionsApi.md#partialupdate)                             | **PATCH** /questions/{id}/                       |             |
| [**regenerateSuggestionCreate**](QuestionsApi.md#regeneratesuggestioncreate)   | **POST** /questions/{id}/regenerateSuggestion/   |             |
| [**regenerationSuggestionsList**](QuestionsApi.md#regenerationsuggestionslist) | **GET** /questions/{id}/regenerationSuggestions/ |             |
| [**retrieve**](QuestionsApi.md#retrieve)                                       | **GET** /questions/{id}/                         |             |
| [**update**](QuestionsApi.md#update)                                           | **PUT** /questions/{id}/                         |             |

## copyToBankCreate

> Array&lt;Question&gt; copyToBankCreate(bankCopyRequest)

Copy the given questions (with their choices) into another bank as new questions.

### Example

```ts
import {
  Configuration,
  QuestionsApi,
} from '';
import type { CopyToBankCreateRequest } from '';

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
  const api = new QuestionsApi(config);

  const body = {
    // BankCopyRequest
    bankCopyRequest: ...,
  } satisfies CopyToBankCreateRequest;

  try {
    const data = await api.copyToBankCreate(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                | Type                                  | Description | Notes |
| ------------------- | ------------------------------------- | ----------- | ----- |
| **bankCopyRequest** | [BankCopyRequest](BankCopyRequest.md) |             |       |

### Return type

[**Array&lt;Question&gt;**](Question.md)

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

## create

> Question create(question)

Quiz questions, each living in exactly one bank (with nested, writable choices).

### Example

```ts
import {
  Configuration,
  QuestionsApi,
} from '';
import type { CreateRequest } from '';

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
  const api = new QuestionsApi(config);

  const body = {
    // Question
    question: ...,
  } satisfies CreateRequest;

  try {
    const data = await api.create(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name         | Type                    | Description | Notes |
| ------------ | ----------------------- | ----------- | ----- |
| **question** | [Question](Question.md) |             |       |

### Return type

[**Question**](Question.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [courseKeyAuth](../README.md#courseKeyAuth)

### HTTP request headers

- **Content-Type**: `application/json`, `application/x-www-form-urlencoded`, `multipart/form-data`
- **Accept**: `application/json`

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **201**     |             | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## destroy

> destroy(id)

Quiz questions, each living in exactly one bank (with nested, writable choices).

### Example

```ts
import { Configuration, QuestionsApi } from '';
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
  const api = new QuestionsApi(config);

  const body = {
    // number | A unique integer value identifying this question.
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

| Name   | Type     | Description                                       | Notes                     |
| ------ | -------- | ------------------------------------------------- | ------------------------- |
| **id** | `number` | A unique integer value identifying this question. | [Defaults to `undefined`] |

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

## list

> Array&lt;Question&gt; list()

Quiz questions, each living in exactly one bank (with nested, writable choices).

### Example

```ts
import { Configuration, QuestionsApi } from '';
import type { ListRequest } from '';

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
  const api = new QuestionsApi(config);

  try {
    const data = await api.list();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

This endpoint does not need any parameter.

### Return type

[**Array&lt;Question&gt;**](Question.md)

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

## moveToBankCreate

> Array&lt;Question&gt; moveToBankCreate(bankQuestionsRequest)

Move the given questions into another bank (re-points each question\&#39;s bank).

### Example

```ts
import {
  Configuration,
  QuestionsApi,
} from '';
import type { MoveToBankCreateRequest } from '';

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
  const api = new QuestionsApi(config);

  const body = {
    // BankQuestionsRequest
    bankQuestionsRequest: ...,
  } satisfies MoveToBankCreateRequest;

  try {
    const data = await api.moveToBankCreate(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                     | Type                                            | Description | Notes |
| ------------------------ | ----------------------------------------------- | ----------- | ----- |
| **bankQuestionsRequest** | [BankQuestionsRequest](BankQuestionsRequest.md) |             |       |

### Return type

[**Array&lt;Question&gt;**](Question.md)

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

## partialUpdate

> Question partialUpdate(id, patchedQuestion)

Quiz questions, each living in exactly one bank (with nested, writable choices).

### Example

```ts
import {
  Configuration,
  QuestionsApi,
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
  const api = new QuestionsApi(config);

  const body = {
    // number | A unique integer value identifying this question.
    id: 56,
    // PatchedQuestion (optional)
    patchedQuestion: ...,
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

| Name                | Type                                  | Description                                       | Notes                     |
| ------------------- | ------------------------------------- | ------------------------------------------------- | ------------------------- |
| **id**              | `number`                              | A unique integer value identifying this question. | [Defaults to `undefined`] |
| **patchedQuestion** | [PatchedQuestion](PatchedQuestion.md) |                                                   | [Optional]                |

### Return type

[**Question**](Question.md)

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

## regenerateSuggestionCreate

> QuizSuggestionJob regenerateSuggestionCreate(id, regenerateSuggestionRequest)

Generate a refreshed AI suggestion seeded from this existing question (cross-semester update). The instructor reviews and accepts the suggestion. Returns the generation job to poll via quizSuggestionJobs/{id}/ for status and errors. Returns 403 when the course has the quiz_generation AI feature turned off.

### Example

```ts
import {
  Configuration,
  QuestionsApi,
} from '';
import type { RegenerateSuggestionCreateRequest } from '';

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
  const api = new QuestionsApi(config);

  const body = {
    // number | A unique integer value identifying this question.
    id: 56,
    // RegenerateSuggestionRequest (optional)
    regenerateSuggestionRequest: ...,
  } satisfies RegenerateSuggestionCreateRequest;

  try {
    const data = await api.regenerateSuggestionCreate(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                            | Type                                                          | Description                                       | Notes                     |
| ------------------------------- | ------------------------------------------------------------- | ------------------------------------------------- | ------------------------- |
| **id**                          | `number`                                                      | A unique integer value identifying this question. | [Defaults to `undefined`] |
| **regenerateSuggestionRequest** | [RegenerateSuggestionRequest](RegenerateSuggestionRequest.md) |                                                   | [Optional]                |

### Return type

[**QuizSuggestionJob**](QuizSuggestionJob.md)

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

## regenerationSuggestionsList

> Array&lt;SuggestedQuizQuestion&gt; regenerationSuggestionsList(id)

Pending AI refresh suggestions seeded from this question (for review/accept).

### Example

```ts
import { Configuration, QuestionsApi } from '';
import type { RegenerationSuggestionsListRequest } from '';

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
  const api = new QuestionsApi(config);

  const body = {
    // number | A unique integer value identifying this question.
    id: 56,
  } satisfies RegenerationSuggestionsListRequest;

  try {
    const data = await api.regenerationSuggestionsList(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name   | Type     | Description                                       | Notes                     |
| ------ | -------- | ------------------------------------------------- | ------------------------- |
| **id** | `number` | A unique integer value identifying this question. | [Defaults to `undefined`] |

### Return type

[**Array&lt;SuggestedQuizQuestion&gt;**](SuggestedQuizQuestion.md)

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

## retrieve

> Question retrieve(id)

Quiz questions, each living in exactly one bank (with nested, writable choices).

### Example

```ts
import { Configuration, QuestionsApi } from '';
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
  const api = new QuestionsApi(config);

  const body = {
    // number | A unique integer value identifying this question.
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

| Name   | Type     | Description                                       | Notes                     |
| ------ | -------- | ------------------------------------------------- | ------------------------- |
| **id** | `number` | A unique integer value identifying this question. | [Defaults to `undefined`] |

### Return type

[**Question**](Question.md)

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

> Question update(id, question)

Quiz questions, each living in exactly one bank (with nested, writable choices).

### Example

```ts
import {
  Configuration,
  QuestionsApi,
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
  const api = new QuestionsApi(config);

  const body = {
    // number | A unique integer value identifying this question.
    id: 56,
    // Question
    question: ...,
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

| Name         | Type                    | Description                                       | Notes                     |
| ------------ | ----------------------- | ------------------------------------------------- | ------------------------- |
| **id**       | `number`                | A unique integer value identifying this question. | [Defaults to `undefined`] |
| **question** | [Question](Question.md) |                                                   |                           |

### Return type

[**Question**](Question.md)

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
