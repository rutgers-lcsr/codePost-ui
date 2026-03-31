# SuggestedCommentsApi

All URIs are relative to _http://localhost_

| Method                                                     | HTTP request                             | Description |
| ---------------------------------------------------------- | ---------------------------------------- | ----------- |
| [**acceptCreate**](SuggestedCommentsApi.md#acceptcreate)   | **POST** /suggestedComments/{id}/accept/ |             |
| [**create**](SuggestedCommentsApi.md#create)               | **POST** /suggestedComments/             |             |
| [**destroy**](SuggestedCommentsApi.md#destroy)             | **DELETE** /suggestedComments/{id}/      |             |
| [**list**](SuggestedCommentsApi.md#list)                   | **GET** /suggestedComments/              |             |
| [**partialUpdate**](SuggestedCommentsApi.md#partialupdate) | **PATCH** /suggestedComments/{id}/       |             |
| [**rejectCreate**](SuggestedCommentsApi.md#rejectcreate)   | **POST** /suggestedComments/{id}/reject/ |             |
| [**retrieve**](SuggestedCommentsApi.md#retrieve)           | **GET** /suggestedComments/{id}/         |             |
| [**update**](SuggestedCommentsApi.md#update)               | **PUT** /suggestedComments/{id}/         |             |

## acceptCreate

> Comment acceptCreate(id, suggestedComment)

Accept this suggestion, creating a real Comment and marking the suggestion as accepted.

### Example

```ts
import {
  Configuration,
  SuggestedCommentsApi,
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
    // Configure HTTP bearer authorization: jwtAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new SuggestedCommentsApi(config);

  const body = {
    // number | A unique integer value identifying this suggested comment.
    id: 56,
    // SuggestedComment (optional)
    suggestedComment: ...,
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

| Name                 | Type                                    | Description                                                | Notes                     |
| -------------------- | --------------------------------------- | ---------------------------------------------------------- | ------------------------- |
| **id**               | `number`                                | A unique integer value identifying this suggested comment. | [Defaults to `undefined`] |
| **suggestedComment** | [SuggestedComment](SuggestedComment.md) |                                                            | [Optional]                |

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

## create

> SuggestedComment create(suggestedComment)

AI-suggested comments for graders. Not visible to students. retrieve: Return a suggested comment. delete: Delete a suggested comment.

### Example

```ts
import {
  Configuration,
  SuggestedCommentsApi,
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
  const api = new SuggestedCommentsApi(config);

  const body = {
    // SuggestedComment (optional)
    suggestedComment: ...,
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

| Name                 | Type                                    | Description | Notes      |
| -------------------- | --------------------------------------- | ----------- | ---------- |
| **suggestedComment** | [SuggestedComment](SuggestedComment.md) |             | [Optional] |

### Return type

[**SuggestedComment**](SuggestedComment.md)

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

AI-suggested comments for graders. Not visible to students. retrieve: Return a suggested comment. delete: Delete a suggested comment.

### Example

```ts
import { Configuration, SuggestedCommentsApi } from '';
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
  const api = new SuggestedCommentsApi(config);

  const body = {
    // number | A unique integer value identifying this suggested comment.
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

| Name   | Type     | Description                                                | Notes                     |
| ------ | -------- | ---------------------------------------------------------- | ------------------------- |
| **id** | `number` | A unique integer value identifying this suggested comment. | [Defaults to `undefined`] |

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

## list

> Array&lt;SuggestedComment&gt; list()

AI-suggested comments for graders. Not visible to students. retrieve: Return a suggested comment. delete: Delete a suggested comment.

### Example

```ts
import { Configuration, SuggestedCommentsApi } from '';
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
  const api = new SuggestedCommentsApi(config);

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

[**Array&lt;SuggestedComment&gt;**](SuggestedComment.md)

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

> SuggestedComment partialUpdate(id, patchedSuggestedComment)

AI-suggested comments for graders. Not visible to students. retrieve: Return a suggested comment. delete: Delete a suggested comment.

### Example

```ts
import {
  Configuration,
  SuggestedCommentsApi,
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
  const api = new SuggestedCommentsApi(config);

  const body = {
    // number | A unique integer value identifying this suggested comment.
    id: 56,
    // PatchedSuggestedComment (optional)
    patchedSuggestedComment: ...,
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

| Name                        | Type                                                  | Description                                                | Notes                     |
| --------------------------- | ----------------------------------------------------- | ---------------------------------------------------------- | ------------------------- |
| **id**                      | `number`                                              | A unique integer value identifying this suggested comment. | [Defaults to `undefined`] |
| **patchedSuggestedComment** | [PatchedSuggestedComment](PatchedSuggestedComment.md) |                                                            | [Optional]                |

### Return type

[**SuggestedComment**](SuggestedComment.md)

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

## rejectCreate

> SuggestedComment rejectCreate(id, suggestedComment)

Reject this suggestion.

### Example

```ts
import {
  Configuration,
  SuggestedCommentsApi,
} from '';
import type { RejectCreateRequest } from '';

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
  const api = new SuggestedCommentsApi(config);

  const body = {
    // number | A unique integer value identifying this suggested comment.
    id: 56,
    // SuggestedComment (optional)
    suggestedComment: ...,
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

| Name                 | Type                                    | Description                                                | Notes                     |
| -------------------- | --------------------------------------- | ---------------------------------------------------------- | ------------------------- |
| **id**               | `number`                                | A unique integer value identifying this suggested comment. | [Defaults to `undefined`] |
| **suggestedComment** | [SuggestedComment](SuggestedComment.md) |                                                            | [Optional]                |

### Return type

[**SuggestedComment**](SuggestedComment.md)

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

> SuggestedComment retrieve(id)

AI-suggested comments for graders. Not visible to students. retrieve: Return a suggested comment. delete: Delete a suggested comment.

### Example

```ts
import { Configuration, SuggestedCommentsApi } from '';
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
  const api = new SuggestedCommentsApi(config);

  const body = {
    // number | A unique integer value identifying this suggested comment.
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

| Name   | Type     | Description                                                | Notes                     |
| ------ | -------- | ---------------------------------------------------------- | ------------------------- |
| **id** | `number` | A unique integer value identifying this suggested comment. | [Defaults to `undefined`] |

### Return type

[**SuggestedComment**](SuggestedComment.md)

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

> SuggestedComment update(id, suggestedComment)

AI-suggested comments for graders. Not visible to students. retrieve: Return a suggested comment. delete: Delete a suggested comment.

### Example

```ts
import {
  Configuration,
  SuggestedCommentsApi,
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
  const api = new SuggestedCommentsApi(config);

  const body = {
    // number | A unique integer value identifying this suggested comment.
    id: 56,
    // SuggestedComment (optional)
    suggestedComment: ...,
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

| Name                 | Type                                    | Description                                                | Notes                     |
| -------------------- | --------------------------------------- | ---------------------------------------------------------- | ------------------------- |
| **id**               | `number`                                | A unique integer value identifying this suggested comment. | [Defaults to `undefined`] |
| **suggestedComment** | [SuggestedComment](SuggestedComment.md) |                                                            | [Optional]                |

### Return type

[**SuggestedComment**](SuggestedComment.md)

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
