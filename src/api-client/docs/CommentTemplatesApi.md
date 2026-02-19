# CommentTemplatesApi

All URIs are relative to _http://localhost_

| Method                                                    | HTTP request                       | Description |
| --------------------------------------------------------- | ---------------------------------- | ----------- |
| [**create**](CommentTemplatesApi.md#create)               | **POST** /commentTemplates/        |             |
| [**destroy**](CommentTemplatesApi.md#destroy)             | **DELETE** /commentTemplates/{id}/ |             |
| [**list**](CommentTemplatesApi.md#list)                   | **GET** /commentTemplates/         |             |
| [**partialUpdate**](CommentTemplatesApi.md#partialupdate) | **PATCH** /commentTemplates/{id}/  |             |
| [**retrieve**](CommentTemplatesApi.md#retrieve)           | **GET** /commentTemplates/{id}/    |             |
| [**update**](CommentTemplatesApi.md#update)               | **PUT** /commentTemplates/{id}/    |             |

## create

> CommentTemplate create(commentTemplate)

### Example

```ts
import {
  Configuration,
  CommentTemplatesApi,
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
  const api = new CommentTemplatesApi(config);

  const body = {
    // CommentTemplate
    commentTemplate: ...,
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

| Name                | Type                                  | Description | Notes |
| ------------------- | ------------------------------------- | ----------- | ----- |
| **commentTemplate** | [CommentTemplate](CommentTemplate.md) |             |       |

### Return type

[**CommentTemplate**](CommentTemplate.md)

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

### Example

```ts
import { Configuration, CommentTemplatesApi } from '';
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
  const api = new CommentTemplatesApi(config);

  const body = {
    // number | A unique integer value identifying this comment template.
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

| Name   | Type     | Description                                               | Notes                     |
| ------ | -------- | --------------------------------------------------------- | ------------------------- |
| **id** | `number` | A unique integer value identifying this comment template. | [Defaults to `undefined`] |

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

> Array&lt;CommentTemplate&gt; list(assignment, filePath, search)

### Example

```ts
import { Configuration, CommentTemplatesApi } from '';
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
  const api = new CommentTemplatesApi(config);

  const body = {
    // number (optional)
    assignment: 56,
    // string (optional)
    filePath: filePath_example,
    // string | A search term. (optional)
    search: search_example,
  } satisfies ListRequest;

  try {
    const data = await api.list(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name           | Type     | Description    | Notes                                |
| -------------- | -------- | -------------- | ------------------------------------ |
| **assignment** | `number` |                | [Optional] [Defaults to `undefined`] |
| **filePath**   | `string` |                | [Optional] [Defaults to `undefined`] |
| **search**     | `string` | A search term. | [Optional] [Defaults to `undefined`] |

### Return type

[**Array&lt;CommentTemplate&gt;**](CommentTemplate.md)

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

> CommentTemplate partialUpdate(id, patchedCommentTemplate)

### Example

```ts
import {
  Configuration,
  CommentTemplatesApi,
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
  const api = new CommentTemplatesApi(config);

  const body = {
    // number | A unique integer value identifying this comment template.
    id: 56,
    // PatchedCommentTemplate (optional)
    patchedCommentTemplate: ...,
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

| Name                       | Type                                                | Description                                               | Notes                     |
| -------------------------- | --------------------------------------------------- | --------------------------------------------------------- | ------------------------- |
| **id**                     | `number`                                            | A unique integer value identifying this comment template. | [Defaults to `undefined`] |
| **patchedCommentTemplate** | [PatchedCommentTemplate](PatchedCommentTemplate.md) |                                                           | [Optional]                |

### Return type

[**CommentTemplate**](CommentTemplate.md)

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

> CommentTemplate retrieve(id)

### Example

```ts
import { Configuration, CommentTemplatesApi } from '';
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
  const api = new CommentTemplatesApi(config);

  const body = {
    // number | A unique integer value identifying this comment template.
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

| Name   | Type     | Description                                               | Notes                     |
| ------ | -------- | --------------------------------------------------------- | ------------------------- |
| **id** | `number` | A unique integer value identifying this comment template. | [Defaults to `undefined`] |

### Return type

[**CommentTemplate**](CommentTemplate.md)

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

> CommentTemplate update(id, commentTemplate)

### Example

```ts
import {
  Configuration,
  CommentTemplatesApi,
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
  const api = new CommentTemplatesApi(config);

  const body = {
    // number | A unique integer value identifying this comment template.
    id: 56,
    // CommentTemplate
    commentTemplate: ...,
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

| Name                | Type                                  | Description                                               | Notes                     |
| ------------------- | ------------------------------------- | --------------------------------------------------------- | ------------------------- |
| **id**              | `number`                              | A unique integer value identifying this comment template. | [Defaults to `undefined`] |
| **commentTemplate** | [CommentTemplate](CommentTemplate.md) |                                                           |                           |

### Return type

[**CommentTemplate**](CommentTemplate.md)

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
