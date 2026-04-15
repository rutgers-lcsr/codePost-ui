# RubricCommentsApi

All URIs are relative to _http://localhost_

| Method                                                                  | HTTP request                                | Description |
| ----------------------------------------------------------------------- | ------------------------------------------- | ----------- |
| [**commentsRetrieve**](RubricCommentsApi.md#commentsretrieve)           | **GET** /rubricComments/{id}/comments/      |             |
| [**create**](RubricCommentsApi.md#create)                               | **POST** /rubricComments/                   |             |
| [**destroy**](RubricCommentsApi.md#destroy)                             | **DELETE** /rubricComments/{id}/            |             |
| [**feedbackScoreRetrieve**](RubricCommentsApi.md#feedbackscoreretrieve) | **GET** /rubricComments/{id}/feedbackScore/ |             |
| [**list**](RubricCommentsApi.md#list)                                   | **GET** /rubricComments/                    |             |
| [**partialUpdate**](RubricCommentsApi.md#partialupdate)                 | **PATCH** /rubricComments/{id}/             |             |
| [**retrieve**](RubricCommentsApi.md#retrieve)                           | **GET** /rubricComments/{id}/               |             |
| [**update**](RubricCommentsApi.md#update)                               | **PUT** /rubricComments/{id}/               |             |

## commentsRetrieve

> RubricComment commentsRetrieve(id)

list: Return a list of all the rubric comments. create: Create a new rubric comment. retrieve: Return the given rubric comment. update: Update a rubric comment. partial_update: Update a rubric comment. delete: Delete a rubric comment.

### Example

```ts
import { Configuration, RubricCommentsApi } from '';
import type { CommentsRetrieveRequest } from '';

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
  const api = new RubricCommentsApi(config);

  const body = {
    // number | A unique integer value identifying this rubric comment.
    id: 56,
  } satisfies CommentsRetrieveRequest;

  try {
    const data = await api.commentsRetrieve(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name   | Type     | Description                                             | Notes                     |
| ------ | -------- | ------------------------------------------------------- | ------------------------- |
| **id** | `number` | A unique integer value identifying this rubric comment. | [Defaults to `undefined`] |

### Return type

[**RubricComment**](RubricComment.md)

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

## create

> RubricComment create(rubricComment)

list: Return a list of all the rubric comments. create: Create a new rubric comment. retrieve: Return the given rubric comment. update: Update a rubric comment. partial_update: Update a rubric comment. delete: Delete a rubric comment.

### Example

```ts
import {
  Configuration,
  RubricCommentsApi,
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
  const api = new RubricCommentsApi(config);

  const body = {
    // RubricComment
    rubricComment: ...,
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

| Name              | Type                              | Description | Notes |
| ----------------- | --------------------------------- | ----------- | ----- |
| **rubricComment** | [RubricComment](RubricComment.md) |             |       |

### Return type

[**RubricComment**](RubricComment.md)

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

list: Return a list of all the rubric comments. create: Create a new rubric comment. retrieve: Return the given rubric comment. update: Update a rubric comment. partial_update: Update a rubric comment. delete: Delete a rubric comment.

### Example

```ts
import { Configuration, RubricCommentsApi } from '';
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
  const api = new RubricCommentsApi(config);

  const body = {
    // number | A unique integer value identifying this rubric comment.
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

| Name   | Type     | Description                                             | Notes                     |
| ------ | -------- | ------------------------------------------------------- | ------------------------- |
| **id** | `number` | A unique integer value identifying this rubric comment. | [Defaults to `undefined`] |

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

## feedbackScoreRetrieve

> RubricComment feedbackScoreRetrieve(id)

list: Return a list of all the rubric comments. create: Create a new rubric comment. retrieve: Return the given rubric comment. update: Update a rubric comment. partial_update: Update a rubric comment. delete: Delete a rubric comment.

### Example

```ts
import { Configuration, RubricCommentsApi } from '';
import type { FeedbackScoreRetrieveRequest } from '';

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
  const api = new RubricCommentsApi(config);

  const body = {
    // number | A unique integer value identifying this rubric comment.
    id: 56,
  } satisfies FeedbackScoreRetrieveRequest;

  try {
    const data = await api.feedbackScoreRetrieve(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name   | Type     | Description                                             | Notes                     |
| ------ | -------- | ------------------------------------------------------- | ------------------------- |
| **id** | `number` | A unique integer value identifying this rubric comment. | [Defaults to `undefined`] |

### Return type

[**RubricComment**](RubricComment.md)

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

## list

> Array&lt;RubricComment&gt; list()

list: Return a list of all the rubric comments. create: Create a new rubric comment. retrieve: Return the given rubric comment. update: Update a rubric comment. partial_update: Update a rubric comment. delete: Delete a rubric comment.

### Example

```ts
import { Configuration, RubricCommentsApi } from '';
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
  const api = new RubricCommentsApi(config);

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

[**Array&lt;RubricComment&gt;**](RubricComment.md)

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

> RubricComment partialUpdate(id, patchedRubricComment)

list: Return a list of all the rubric comments. create: Create a new rubric comment. retrieve: Return the given rubric comment. update: Update a rubric comment. partial_update: Update a rubric comment. delete: Delete a rubric comment.

### Example

```ts
import {
  Configuration,
  RubricCommentsApi,
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
  const api = new RubricCommentsApi(config);

  const body = {
    // number | A unique integer value identifying this rubric comment.
    id: 56,
    // PatchedRubricComment (optional)
    patchedRubricComment: ...,
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

| Name                     | Type                                            | Description                                             | Notes                     |
| ------------------------ | ----------------------------------------------- | ------------------------------------------------------- | ------------------------- |
| **id**                   | `number`                                        | A unique integer value identifying this rubric comment. | [Defaults to `undefined`] |
| **patchedRubricComment** | [PatchedRubricComment](PatchedRubricComment.md) |                                                         | [Optional]                |

### Return type

[**RubricComment**](RubricComment.md)

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

> RubricComment retrieve(id)

list: Return a list of all the rubric comments. create: Create a new rubric comment. retrieve: Return the given rubric comment. update: Update a rubric comment. partial_update: Update a rubric comment. delete: Delete a rubric comment.

### Example

```ts
import { Configuration, RubricCommentsApi } from '';
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
  const api = new RubricCommentsApi(config);

  const body = {
    // number | A unique integer value identifying this rubric comment.
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

| Name   | Type     | Description                                             | Notes                     |
| ------ | -------- | ------------------------------------------------------- | ------------------------- |
| **id** | `number` | A unique integer value identifying this rubric comment. | [Defaults to `undefined`] |

### Return type

[**RubricComment**](RubricComment.md)

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

> RubricComment update(id, rubricComment)

list: Return a list of all the rubric comments. create: Create a new rubric comment. retrieve: Return the given rubric comment. update: Update a rubric comment. partial_update: Update a rubric comment. delete: Delete a rubric comment.

### Example

```ts
import {
  Configuration,
  RubricCommentsApi,
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
  const api = new RubricCommentsApi(config);

  const body = {
    // number | A unique integer value identifying this rubric comment.
    id: 56,
    // RubricComment
    rubricComment: ...,
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

| Name              | Type                              | Description                                             | Notes                     |
| ----------------- | --------------------------------- | ------------------------------------------------------- | ------------------------- |
| **id**            | `number`                          | A unique integer value identifying this rubric comment. | [Defaults to `undefined`] |
| **rubricComment** | [RubricComment](RubricComment.md) |                                                         |                           |

### Return type

[**RubricComment**](RubricComment.md)

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
