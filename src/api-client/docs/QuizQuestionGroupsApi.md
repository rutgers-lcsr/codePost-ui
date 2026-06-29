# QuizQuestionGroupsApi

All URIs are relative to *http://localhost*

| Method                                                      | HTTP request                         | Description |
| ----------------------------------------------------------- | ------------------------------------ | ----------- |
| [**create**](QuizQuestionGroupsApi.md#create)               | **POST** /quizQuestionGroups/        |             |
| [**destroy**](QuizQuestionGroupsApi.md#destroy)             | **DELETE** /quizQuestionGroups/{id}/ |             |
| [**list**](QuizQuestionGroupsApi.md#list)                   | **GET** /quizQuestionGroups/         |             |
| [**partialUpdate**](QuizQuestionGroupsApi.md#partialupdate) | **PATCH** /quizQuestionGroups/{id}/  |             |
| [**retrieve**](QuizQuestionGroupsApi.md#retrieve)           | **GET** /quizQuestionGroups/{id}/    |             |
| [**update**](QuizQuestionGroupsApi.md#update)               | **PUT** /quizQuestionGroups/{id}/    |             |

## create

> QuizQuestionGroup create(quizQuestionGroup)

Random-draw groups on a quiz: pick N random questions from a bank, P points each. POST to add (with quiz + bank + pickCount + pointsPerQuestion), PATCH to edit, DELETE to remove.

### Example

```ts
import {
  Configuration,
  QuizQuestionGroupsApi,
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
  const api = new QuizQuestionGroupsApi(config);

  const body = {
    // QuizQuestionGroup
    quizQuestionGroup: ...,
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

| Name                  | Type                                      | Description | Notes |
| --------------------- | ----------------------------------------- | ----------- | ----- |
| **quizQuestionGroup** | [QuizQuestionGroup](QuizQuestionGroup.md) |             |       |

### Return type

[**QuizQuestionGroup**](QuizQuestionGroup.md)

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

Random-draw groups on a quiz: pick N random questions from a bank, P points each. POST to add (with quiz + bank + pickCount + pointsPerQuestion), PATCH to edit, DELETE to remove.

### Example

```ts
import { Configuration, QuizQuestionGroupsApi } from '';
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
  const api = new QuizQuestionGroupsApi(config);

  const body = {
    // number | A unique integer value identifying this quiz question group.
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

| Name   | Type     | Description                                                  | Notes                     |
| ------ | -------- | ------------------------------------------------------------ | ------------------------- |
| **id** | `number` | A unique integer value identifying this quiz question group. | [Defaults to `undefined`] |

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

> Array&lt;QuizQuestionGroup&gt; list()

Random-draw groups on a quiz: pick N random questions from a bank, P points each. POST to add (with quiz + bank + pickCount + pointsPerQuestion), PATCH to edit, DELETE to remove.

### Example

```ts
import { Configuration, QuizQuestionGroupsApi } from '';
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
  const api = new QuizQuestionGroupsApi(config);

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

[**Array&lt;QuizQuestionGroup&gt;**](QuizQuestionGroup.md)

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

> QuizQuestionGroup partialUpdate(id, patchedQuizQuestionGroup)

Random-draw groups on a quiz: pick N random questions from a bank, P points each. POST to add (with quiz + bank + pickCount + pointsPerQuestion), PATCH to edit, DELETE to remove.

### Example

```ts
import {
  Configuration,
  QuizQuestionGroupsApi,
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
  const api = new QuizQuestionGroupsApi(config);

  const body = {
    // number | A unique integer value identifying this quiz question group.
    id: 56,
    // PatchedQuizQuestionGroup (optional)
    patchedQuizQuestionGroup: ...,
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

| Name                         | Type                                                    | Description                                                  | Notes                     |
| ---------------------------- | ------------------------------------------------------- | ------------------------------------------------------------ | ------------------------- |
| **id**                       | `number`                                                | A unique integer value identifying this quiz question group. | [Defaults to `undefined`] |
| **patchedQuizQuestionGroup** | [PatchedQuizQuestionGroup](PatchedQuizQuestionGroup.md) |                                                              | [Optional]                |

### Return type

[**QuizQuestionGroup**](QuizQuestionGroup.md)

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

> QuizQuestionGroup retrieve(id)

Random-draw groups on a quiz: pick N random questions from a bank, P points each. POST to add (with quiz + bank + pickCount + pointsPerQuestion), PATCH to edit, DELETE to remove.

### Example

```ts
import { Configuration, QuizQuestionGroupsApi } from '';
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
  const api = new QuizQuestionGroupsApi(config);

  const body = {
    // number | A unique integer value identifying this quiz question group.
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
| **id** | `number` | A unique integer value identifying this quiz question group. | [Defaults to `undefined`] |

### Return type

[**QuizQuestionGroup**](QuizQuestionGroup.md)

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

> QuizQuestionGroup update(id, quizQuestionGroup)

Random-draw groups on a quiz: pick N random questions from a bank, P points each. POST to add (with quiz + bank + pickCount + pointsPerQuestion), PATCH to edit, DELETE to remove.

### Example

```ts
import {
  Configuration,
  QuizQuestionGroupsApi,
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
  const api = new QuizQuestionGroupsApi(config);

  const body = {
    // number | A unique integer value identifying this quiz question group.
    id: 56,
    // QuizQuestionGroup
    quizQuestionGroup: ...,
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

| Name                  | Type                                      | Description                                                  | Notes                     |
| --------------------- | ----------------------------------------- | ------------------------------------------------------------ | ------------------------- |
| **id**                | `number`                                  | A unique integer value identifying this quiz question group. | [Defaults to `undefined`] |
| **quizQuestionGroup** | [QuizQuestionGroup](QuizQuestionGroup.md) |                                                              |                           |

### Return type

[**QuizQuestionGroup**](QuizQuestionGroup.md)

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
