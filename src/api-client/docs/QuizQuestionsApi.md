# QuizQuestionsApi

All URIs are relative to *http://localhost*

| Method                                                 | HTTP request                    | Description |
| ------------------------------------------------------ | ------------------------------- | ----------- |
| [**create**](QuizQuestionsApi.md#create)               | **POST** /quizQuestions/        |             |
| [**destroy**](QuizQuestionsApi.md#destroy)             | **DELETE** /quizQuestions/{id}/ |             |
| [**list**](QuizQuestionsApi.md#list)                   | **GET** /quizQuestions/         |             |
| [**partialUpdate**](QuizQuestionsApi.md#partialupdate) | **PATCH** /quizQuestions/{id}/  |             |
| [**retrieve**](QuizQuestionsApi.md#retrieve)           | **GET** /quizQuestions/{id}/    |             |
| [**update**](QuizQuestionsApi.md#update)               | **PUT** /quizQuestions/{id}/    |             |

## create

> QuizQuestion create(quizQuestion)

Add/remove/reorder a Question within a Quiz. POST to add (with quiz + question), PATCH &#x60;&#x60;sortKey&#x60;&#x60;/&#x60;&#x60;pointsOverride&#x60;&#x60; to reorder/override, DELETE to remove.

### Example

```ts
import {
  Configuration,
  QuizQuestionsApi,
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
  const api = new QuizQuestionsApi(config);

  const body = {
    // QuizQuestion
    quizQuestion: ...,
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

| Name             | Type                            | Description | Notes |
| ---------------- | ------------------------------- | ----------- | ----- |
| **quizQuestion** | [QuizQuestion](QuizQuestion.md) |             |       |

### Return type

[**QuizQuestion**](QuizQuestion.md)

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

Add/remove/reorder a Question within a Quiz. POST to add (with quiz + question), PATCH &#x60;&#x60;sortKey&#x60;&#x60;/&#x60;&#x60;pointsOverride&#x60;&#x60; to reorder/override, DELETE to remove.

### Example

```ts
import { Configuration, QuizQuestionsApi } from '';
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
  const api = new QuizQuestionsApi(config);

  const body = {
    // number | A unique integer value identifying this quiz question.
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

| Name   | Type     | Description                                            | Notes                     |
| ------ | -------- | ------------------------------------------------------ | ------------------------- |
| **id** | `number` | A unique integer value identifying this quiz question. | [Defaults to `undefined`] |

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

> Array&lt;QuizQuestion&gt; list()

Add/remove/reorder a Question within a Quiz. POST to add (with quiz + question), PATCH &#x60;&#x60;sortKey&#x60;&#x60;/&#x60;&#x60;pointsOverride&#x60;&#x60; to reorder/override, DELETE to remove.

### Example

```ts
import { Configuration, QuizQuestionsApi } from '';
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
  const api = new QuizQuestionsApi(config);

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

[**Array&lt;QuizQuestion&gt;**](QuizQuestion.md)

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

## partialUpdate

> QuizQuestion partialUpdate(id, patchedQuizQuestion)

Add/remove/reorder a Question within a Quiz. POST to add (with quiz + question), PATCH &#x60;&#x60;sortKey&#x60;&#x60;/&#x60;&#x60;pointsOverride&#x60;&#x60; to reorder/override, DELETE to remove.

### Example

```ts
import {
  Configuration,
  QuizQuestionsApi,
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
  const api = new QuizQuestionsApi(config);

  const body = {
    // number | A unique integer value identifying this quiz question.
    id: 56,
    // PatchedQuizQuestion (optional)
    patchedQuizQuestion: ...,
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

| Name                    | Type                                          | Description                                            | Notes                     |
| ----------------------- | --------------------------------------------- | ------------------------------------------------------ | ------------------------- |
| **id**                  | `number`                                      | A unique integer value identifying this quiz question. | [Defaults to `undefined`] |
| **patchedQuizQuestion** | [PatchedQuizQuestion](PatchedQuizQuestion.md) |                                                        | [Optional]                |

### Return type

[**QuizQuestion**](QuizQuestion.md)

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

> QuizQuestion retrieve(id)

Add/remove/reorder a Question within a Quiz. POST to add (with quiz + question), PATCH &#x60;&#x60;sortKey&#x60;&#x60;/&#x60;&#x60;pointsOverride&#x60;&#x60; to reorder/override, DELETE to remove.

### Example

```ts
import { Configuration, QuizQuestionsApi } from '';
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
  const api = new QuizQuestionsApi(config);

  const body = {
    // number | A unique integer value identifying this quiz question.
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

| Name   | Type     | Description                                            | Notes                     |
| ------ | -------- | ------------------------------------------------------ | ------------------------- |
| **id** | `number` | A unique integer value identifying this quiz question. | [Defaults to `undefined`] |

### Return type

[**QuizQuestion**](QuizQuestion.md)

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

> QuizQuestion update(id, quizQuestion)

Add/remove/reorder a Question within a Quiz. POST to add (with quiz + question), PATCH &#x60;&#x60;sortKey&#x60;&#x60;/&#x60;&#x60;pointsOverride&#x60;&#x60; to reorder/override, DELETE to remove.

### Example

```ts
import {
  Configuration,
  QuizQuestionsApi,
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
  const api = new QuizQuestionsApi(config);

  const body = {
    // number | A unique integer value identifying this quiz question.
    id: 56,
    // QuizQuestion
    quizQuestion: ...,
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

| Name             | Type                            | Description                                            | Notes                     |
| ---------------- | ------------------------------- | ------------------------------------------------------ | ------------------------- |
| **id**           | `number`                        | A unique integer value identifying this quiz question. | [Defaults to `undefined`] |
| **quizQuestion** | [QuizQuestion](QuizQuestion.md) |                                                        |                           |

### Return type

[**QuizQuestion**](QuizQuestion.md)

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
