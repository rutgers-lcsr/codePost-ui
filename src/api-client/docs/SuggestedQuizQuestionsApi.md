# SuggestedQuizQuestionsApi

All URIs are relative to *http://localhost*

| Method                                                          | HTTP request                                  | Description |
| --------------------------------------------------------------- | --------------------------------------------- | ----------- |
| [**acceptCreate**](SuggestedQuizQuestionsApi.md#acceptcreate)   | **POST** /suggestedQuizQuestions/{id}/accept/ |             |
| [**create**](SuggestedQuizQuestionsApi.md#create)               | **POST** /suggestedQuizQuestions/             |             |
| [**destroy**](SuggestedQuizQuestionsApi.md#destroy)             | **DELETE** /suggestedQuizQuestions/{id}/      |             |
| [**list**](SuggestedQuizQuestionsApi.md#list)                   | **GET** /suggestedQuizQuestions/              |             |
| [**partialUpdate**](SuggestedQuizQuestionsApi.md#partialupdate) | **PATCH** /suggestedQuizQuestions/{id}/       |             |
| [**rejectCreate**](SuggestedQuizQuestionsApi.md#rejectcreate)   | **POST** /suggestedQuizQuestions/{id}/reject/ |             |
| [**retrieve**](SuggestedQuizQuestionsApi.md#retrieve)           | **GET** /suggestedQuizQuestions/{id}/         |             |
| [**update**](SuggestedQuizQuestionsApi.md#update)               | **PUT** /suggestedQuizQuestions/{id}/         |             |

## acceptCreate

> Question acceptCreate(id, acceptSuggestionRequest)

Accept this suggestion. A fresh suggestion creates a new Question in the given bank (bankId required); a refresh (sourceQuestion set) updates that existing question in place. The resulting question is authored by the instructor.

### Example

```ts
import {
  Configuration,
  SuggestedQuizQuestionsApi,
} from '';
import type { AcceptCreateRequest } from '';

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
  const api = new SuggestedQuizQuestionsApi(config);

  const body = {
    // number | A unique integer value identifying this suggested quiz question.
    id: 56,
    // AcceptSuggestionRequest (optional)
    acceptSuggestionRequest: ...,
  } satisfies AcceptCreateRequest;

  try {
    const data = await api.acceptCreate(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                        | Type                                                  | Description                                                      | Notes                     |
| --------------------------- | ----------------------------------------------------- | ---------------------------------------------------------------- | ------------------------- |
| **id**                      | `number`                                              | A unique integer value identifying this suggested quiz question. | [Defaults to `undefined`] |
| **acceptSuggestionRequest** | [AcceptSuggestionRequest](AcceptSuggestionRequest.md) |                                                                  | [Optional]                |

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

## create

> SuggestedQuizQuestion create(suggestedQuizQuestion)

AI-suggested quiz questions for instructors. Staff-only. A pending suggestion can be edited (PATCH) and then accepted into a real, editable Question (authored by the instructor) or rejected.

### Example

```ts
import {
  Configuration,
  SuggestedQuizQuestionsApi,
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
  const api = new SuggestedQuizQuestionsApi(config);

  const body = {
    // SuggestedQuizQuestion
    suggestedQuizQuestion: ...,
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

| Name                      | Type                                              | Description | Notes |
| ------------------------- | ------------------------------------------------- | ----------- | ----- |
| **suggestedQuizQuestion** | [SuggestedQuizQuestion](SuggestedQuizQuestion.md) |             |       |

### Return type

[**SuggestedQuizQuestion**](SuggestedQuizQuestion.md)

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

AI-suggested quiz questions for instructors. Staff-only. A pending suggestion can be edited (PATCH) and then accepted into a real, editable Question (authored by the instructor) or rejected.

### Example

```ts
import { Configuration, SuggestedQuizQuestionsApi } from '';
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
  const api = new SuggestedQuizQuestionsApi(config);

  const body = {
    // number | A unique integer value identifying this suggested quiz question.
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
| **id** | `number` | A unique integer value identifying this suggested quiz question. | [Defaults to `undefined`] |

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

> Array&lt;SuggestedQuizQuestion&gt; list()

AI-suggested quiz questions for instructors. Staff-only. A pending suggestion can be edited (PATCH) and then accepted into a real, editable Question (authored by the instructor) or rejected.

### Example

```ts
import { Configuration, SuggestedQuizQuestionsApi } from '';
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
  const api = new SuggestedQuizQuestionsApi(config);

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

## partialUpdate

> SuggestedQuizQuestion partialUpdate(id, patchedSuggestedQuizQuestion)

AI-suggested quiz questions for instructors. Staff-only. A pending suggestion can be edited (PATCH) and then accepted into a real, editable Question (authored by the instructor) or rejected.

### Example

```ts
import {
  Configuration,
  SuggestedQuizQuestionsApi,
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
  const api = new SuggestedQuizQuestionsApi(config);

  const body = {
    // number | A unique integer value identifying this suggested quiz question.
    id: 56,
    // PatchedSuggestedQuizQuestion (optional)
    patchedSuggestedQuizQuestion: ...,
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
| **id**                           | `number`                                                        | A unique integer value identifying this suggested quiz question. | [Defaults to `undefined`] |
| **patchedSuggestedQuizQuestion** | [PatchedSuggestedQuizQuestion](PatchedSuggestedQuizQuestion.md) |                                                                  | [Optional]                |

### Return type

[**SuggestedQuizQuestion**](SuggestedQuizQuestion.md)

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

## rejectCreate

> SuggestedQuizQuestion rejectCreate(id)

Reject this suggestion.

### Example

```ts
import { Configuration, SuggestedQuizQuestionsApi } from '';
import type { RejectCreateRequest } from '';

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
  const api = new SuggestedQuizQuestionsApi(config);

  const body = {
    // number | A unique integer value identifying this suggested quiz question.
    id: 56,
  } satisfies RejectCreateRequest;

  try {
    const data = await api.rejectCreate(body);
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
| **id** | `number` | A unique integer value identifying this suggested quiz question. | [Defaults to `undefined`] |

### Return type

[**SuggestedQuizQuestion**](SuggestedQuizQuestion.md)

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

> SuggestedQuizQuestion retrieve(id)

AI-suggested quiz questions for instructors. Staff-only. A pending suggestion can be edited (PATCH) and then accepted into a real, editable Question (authored by the instructor) or rejected.

### Example

```ts
import { Configuration, SuggestedQuizQuestionsApi } from '';
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
  const api = new SuggestedQuizQuestionsApi(config);

  const body = {
    // number | A unique integer value identifying this suggested quiz question.
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
| **id** | `number` | A unique integer value identifying this suggested quiz question. | [Defaults to `undefined`] |

### Return type

[**SuggestedQuizQuestion**](SuggestedQuizQuestion.md)

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

> SuggestedQuizQuestion update(id, suggestedQuizQuestion)

AI-suggested quiz questions for instructors. Staff-only. A pending suggestion can be edited (PATCH) and then accepted into a real, editable Question (authored by the instructor) or rejected.

### Example

```ts
import {
  Configuration,
  SuggestedQuizQuestionsApi,
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
  const api = new SuggestedQuizQuestionsApi(config);

  const body = {
    // number | A unique integer value identifying this suggested quiz question.
    id: 56,
    // SuggestedQuizQuestion
    suggestedQuizQuestion: ...,
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
| **id**                    | `number`                                          | A unique integer value identifying this suggested quiz question. | [Defaults to `undefined`] |
| **suggestedQuizQuestion** | [SuggestedQuizQuestion](SuggestedQuizQuestion.md) |                                                                  |                           |

### Return type

[**SuggestedQuizQuestion**](SuggestedQuizQuestion.md)

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
