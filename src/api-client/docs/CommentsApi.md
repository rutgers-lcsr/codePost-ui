# CommentsApi

All URIs are relative to _http://localhost_

| Method                                                            | HTTP request                       | Description |
| ----------------------------------------------------------------- | ---------------------------------- | ----------- |
| [**create**](CommentsApi.md#create)                               | **POST** /comments/                |             |
| [**destroy**](CommentsApi.md#destroy)                             | **DELETE** /comments/{id}/         |             |
| [**feedbackPartialUpdate**](CommentsApi.md#feedbackpartialupdate) | **PATCH** /comments/{id}/feedback/ |             |
| [**generateCreate**](CommentsApi.md#generatecreate)               | **POST** /comments/generate/       |             |
| [**list**](CommentsApi.md#list)                                   | **GET** /comments/                 |             |
| [**partialUpdate**](CommentsApi.md#partialupdate)                 | **PATCH** /comments/{id}/          |             |
| [**retrieve**](CommentsApi.md#retrieve)                           | **GET** /comments/{id}/            |             |
| [**update**](CommentsApi.md#update)                               | **PUT** /comments/{id}/            |             |

## create

> Comment create(comment)

list: Return a list of all the comments. create: Create a new comment. retrieve: Return the given comment. update: Update a comment. partial_update: Update a comment. delete: Delete a comment.

### Example

```ts
import {
  Configuration,
  CommentsApi,
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
    // Configure HTTP bearer authorization: jwtAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new CommentsApi(config);

  const body = {
    // Comment
    comment: ...,
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

| Name        | Type                  | Description | Notes |
| ----------- | --------------------- | ----------- | ----- |
| **comment** | [Comment](Comment.md) |             |       |

### Return type

[**Comment**](Comment.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

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

list: Return a list of all the comments. create: Create a new comment. retrieve: Return the given comment. update: Update a comment. partial_update: Update a comment. delete: Delete a comment.

### Example

```ts
import { Configuration, CommentsApi } from '';
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
    // Configure HTTP bearer authorization: jwtAuth
    accessToken: 'YOUR BEARER TOKEN',
  });
  const api = new CommentsApi(config);

  const body = {
    // number | A unique integer value identifying this comment.
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

| Name   | Type     | Description                                      | Notes                     |
| ------ | -------- | ------------------------------------------------ | ------------------------- |
| **id** | `number` | A unique integer value identifying this comment. | [Defaults to `undefined`] |

### Return type

`void` (Empty response body)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: Not defined

### HTTP response details

| Status code | Description      | Response headers |
| ----------- | ---------------- | ---------------- |
| **204**     | No response body | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## feedbackPartialUpdate

> Comment feedbackPartialUpdate(id, patchedComment)

list: Return a list of all the comments. create: Create a new comment. retrieve: Return the given comment. update: Update a comment. partial_update: Update a comment. delete: Delete a comment.

### Example

```ts
import {
  Configuration,
  CommentsApi,
} from '';
import type { FeedbackPartialUpdateRequest } from '';

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
    // Configure HTTP bearer authorization: jwtAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new CommentsApi(config);

  const body = {
    // number | A unique integer value identifying this comment.
    id: 56,
    // PatchedComment (optional)
    patchedComment: ...,
  } satisfies FeedbackPartialUpdateRequest;

  try {
    const data = await api.feedbackPartialUpdate(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name               | Type                                | Description                                      | Notes                     |
| ------------------ | ----------------------------------- | ------------------------------------------------ | ------------------------- |
| **id**             | `number`                            | A unique integer value identifying this comment. | [Defaults to `undefined`] |
| **patchedComment** | [PatchedComment](PatchedComment.md) |                                                  | [Optional]                |

### Return type

[**Comment**](Comment.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

### HTTP request headers

- **Content-Type**: `application/json`, `application/x-www-form-urlencoded`, `multipart/form-data`
- **Accept**: `application/json`

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **200**     |             | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## generateCreate

> Comment generateCreate(comment)

Generate an AI-powered comment suggestion. Note: The system prompt determines what gets put into the comments context. This way the instructor can define what we add. If they want all the files they can add all the files. if they just want the current file we can. This way we can make the objective turth of the system prompt be from the instructor. The frontend should let the instructor know what varibles to use to enable what we put into the system prompt. Request body: - file_id: int (required) - ID of the SubmissionFile - start_line: int (required) - Start line of selection (0-indexed) - end_line: int (required) - End line of selection (0-indexed) - rubric_comment_id: int (optional) - ID of linked RubricComment - start_char: int (optional) - Start character offset for selection - end_char: int (optional) - End character offset for selection - existing_text: str (optional) - Grader\&#39;s draft text to improve - points: float (optional) - Points override for rubric comment (can be used without rubric_comment_id for manual adjustments)

### Example

```ts
import {
  Configuration,
  CommentsApi,
} from '';
import type { GenerateCreateRequest } from '';

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
    // Configure HTTP bearer authorization: jwtAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new CommentsApi(config);

  const body = {
    // Comment
    comment: ...,
  } satisfies GenerateCreateRequest;

  try {
    const data = await api.generateCreate(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name        | Type                  | Description | Notes |
| ----------- | --------------------- | ----------- | ----- |
| **comment** | [Comment](Comment.md) |             |       |

### Return type

[**Comment**](Comment.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

### HTTP request headers

- **Content-Type**: `application/json`, `application/x-www-form-urlencoded`, `multipart/form-data`
- **Accept**: `application/json`

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **200**     |             | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## list

> Array&lt;Comment&gt; list()

list: Return a list of all the comments. create: Create a new comment. retrieve: Return the given comment. update: Update a comment. partial_update: Update a comment. delete: Delete a comment.

### Example

```ts
import { Configuration, CommentsApi } from '';
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
    // Configure HTTP bearer authorization: jwtAuth
    accessToken: 'YOUR BEARER TOKEN',
  });
  const api = new CommentsApi(config);

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

[**Array&lt;Comment&gt;**](Comment.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **200**     |             | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## partialUpdate

> Comment partialUpdate(id, patchedComment)

list: Return a list of all the comments. create: Create a new comment. retrieve: Return the given comment. update: Update a comment. partial_update: Update a comment. delete: Delete a comment.

### Example

```ts
import {
  Configuration,
  CommentsApi,
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
    // Configure HTTP bearer authorization: jwtAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new CommentsApi(config);

  const body = {
    // number | A unique integer value identifying this comment.
    id: 56,
    // PatchedComment (optional)
    patchedComment: ...,
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

| Name               | Type                                | Description                                      | Notes                     |
| ------------------ | ----------------------------------- | ------------------------------------------------ | ------------------------- |
| **id**             | `number`                            | A unique integer value identifying this comment. | [Defaults to `undefined`] |
| **patchedComment** | [PatchedComment](PatchedComment.md) |                                                  | [Optional]                |

### Return type

[**Comment**](Comment.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

### HTTP request headers

- **Content-Type**: `application/json`, `application/x-www-form-urlencoded`, `multipart/form-data`
- **Accept**: `application/json`

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **200**     |             | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## retrieve

> Comment retrieve(id)

list: Return a list of all the comments. create: Create a new comment. retrieve: Return the given comment. update: Update a comment. partial_update: Update a comment. delete: Delete a comment.

### Example

```ts
import { Configuration, CommentsApi } from '';
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
    // Configure HTTP bearer authorization: jwtAuth
    accessToken: 'YOUR BEARER TOKEN',
  });
  const api = new CommentsApi(config);

  const body = {
    // number | A unique integer value identifying this comment.
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

| Name   | Type     | Description                                      | Notes                     |
| ------ | -------- | ------------------------------------------------ | ------------------------- |
| **id** | `number` | A unique integer value identifying this comment. | [Defaults to `undefined`] |

### Return type

[**Comment**](Comment.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **200**     |             | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## update

> Comment update(id, comment)

list: Return a list of all the comments. create: Create a new comment. retrieve: Return the given comment. update: Update a comment. partial_update: Update a comment. delete: Delete a comment.

### Example

```ts
import {
  Configuration,
  CommentsApi,
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
    // Configure HTTP bearer authorization: jwtAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new CommentsApi(config);

  const body = {
    // number | A unique integer value identifying this comment.
    id: 56,
    // Comment
    comment: ...,
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

| Name        | Type                  | Description                                      | Notes                     |
| ----------- | --------------------- | ------------------------------------------------ | ------------------------- |
| **id**      | `number`              | A unique integer value identifying this comment. | [Defaults to `undefined`] |
| **comment** | [Comment](Comment.md) |                                                  |                           |

### Return type

[**Comment**](Comment.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

### HTTP request headers

- **Content-Type**: `application/json`, `application/x-www-form-urlencoded`, `multipart/form-data`
- **Accept**: `application/json`

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **200**     |             | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
