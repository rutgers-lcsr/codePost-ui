# PromptFeedbackApi

All URIs are relative to _http://localhost_

| Method                                                  | HTTP request                     | Description |
| ------------------------------------------------------- | -------------------------------- | ----------- |
| [**create**](PromptFeedbackApi.md#create)               | **POST** /promptFeedback/        |             |
| [**destroy**](PromptFeedbackApi.md#destroy)             | **DELETE** /promptFeedback/{id}/ |             |
| [**list**](PromptFeedbackApi.md#list)                   | **GET** /promptFeedback/         |             |
| [**partialUpdate**](PromptFeedbackApi.md#partialupdate) | **PATCH** /promptFeedback/{id}/  |             |
| [**retrieve**](PromptFeedbackApi.md#retrieve)           | **GET** /promptFeedback/{id}/    |             |
| [**update**](PromptFeedbackApi.md#update)               | **PUT** /promptFeedback/{id}/    |             |

## create

> PromptFeedback create(promptFeedback)

Prompt feedback from graders/admins on AI-generated output. create: Submit feedback (any authenticated user). list / retrieve: Superuser-only. Supports ?promptType&#x3D;, ?experimentId&#x3D;, ?isCustomContext&#x3D; filters.

### Example

```ts
import {
  Configuration,
  PromptFeedbackApi,
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
  const api = new PromptFeedbackApi(config);

  const body = {
    // PromptFeedback
    promptFeedback: ...,
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

| Name               | Type                                | Description | Notes |
| ------------------ | ----------------------------------- | ----------- | ----- |
| **promptFeedback** | [PromptFeedback](PromptFeedback.md) |             |       |

### Return type

[**PromptFeedback**](PromptFeedback.md)

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

Prompt feedback from graders/admins on AI-generated output. create: Submit feedback (any authenticated user). list / retrieve: Superuser-only. Supports ?promptType&#x3D;, ?experimentId&#x3D;, ?isCustomContext&#x3D; filters.

### Example

```ts
import { Configuration, PromptFeedbackApi } from '';
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
  const api = new PromptFeedbackApi(config);

  const body = {
    // number | A unique integer value identifying this prompt feedback.
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

| Name   | Type     | Description                                              | Notes                     |
| ------ | -------- | -------------------------------------------------------- | ------------------------- |
| **id** | `number` | A unique integer value identifying this prompt feedback. | [Defaults to `undefined`] |

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

> PaginatedPromptFeedbackList list(page, pageSize)

Override to allow superuser listing (bypasses ListProtectedViewSet block).

### Example

```ts
import { Configuration, PromptFeedbackApi } from '';
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
  const api = new PromptFeedbackApi(config);

  const body = {
    // number | A page number within the paginated result set. (optional)
    page: 56,
    // number | Number of results to return per page. (optional)
    pageSize: 56,
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

| Name         | Type     | Description                                    | Notes                                |
| ------------ | -------- | ---------------------------------------------- | ------------------------------------ |
| **page**     | `number` | A page number within the paginated result set. | [Optional] [Defaults to `undefined`] |
| **pageSize** | `number` | Number of results to return per page.          | [Optional] [Defaults to `undefined`] |

### Return type

[**PaginatedPromptFeedbackList**](PaginatedPromptFeedbackList.md)

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

> PromptFeedback partialUpdate(id, patchedPromptFeedback)

Prompt feedback from graders/admins on AI-generated output. create: Submit feedback (any authenticated user). list / retrieve: Superuser-only. Supports ?promptType&#x3D;, ?experimentId&#x3D;, ?isCustomContext&#x3D; filters.

### Example

```ts
import {
  Configuration,
  PromptFeedbackApi,
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
  const api = new PromptFeedbackApi(config);

  const body = {
    // number | A unique integer value identifying this prompt feedback.
    id: 56,
    // PatchedPromptFeedback (optional)
    patchedPromptFeedback: ...,
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

| Name                      | Type                                              | Description                                              | Notes                     |
| ------------------------- | ------------------------------------------------- | -------------------------------------------------------- | ------------------------- |
| **id**                    | `number`                                          | A unique integer value identifying this prompt feedback. | [Defaults to `undefined`] |
| **patchedPromptFeedback** | [PatchedPromptFeedback](PatchedPromptFeedback.md) |                                                          | [Optional]                |

### Return type

[**PromptFeedback**](PromptFeedback.md)

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

> PromptFeedback retrieve(id)

Prompt feedback from graders/admins on AI-generated output. create: Submit feedback (any authenticated user). list / retrieve: Superuser-only. Supports ?promptType&#x3D;, ?experimentId&#x3D;, ?isCustomContext&#x3D; filters.

### Example

```ts
import { Configuration, PromptFeedbackApi } from '';
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
  const api = new PromptFeedbackApi(config);

  const body = {
    // number | A unique integer value identifying this prompt feedback.
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

| Name   | Type     | Description                                              | Notes                     |
| ------ | -------- | -------------------------------------------------------- | ------------------------- |
| **id** | `number` | A unique integer value identifying this prompt feedback. | [Defaults to `undefined`] |

### Return type

[**PromptFeedback**](PromptFeedback.md)

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

> PromptFeedback update(id, promptFeedback)

Prompt feedback from graders/admins on AI-generated output. create: Submit feedback (any authenticated user). list / retrieve: Superuser-only. Supports ?promptType&#x3D;, ?experimentId&#x3D;, ?isCustomContext&#x3D; filters.

### Example

```ts
import {
  Configuration,
  PromptFeedbackApi,
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
  const api = new PromptFeedbackApi(config);

  const body = {
    // number | A unique integer value identifying this prompt feedback.
    id: 56,
    // PromptFeedback
    promptFeedback: ...,
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

| Name               | Type                                | Description                                              | Notes                     |
| ------------------ | ----------------------------------- | -------------------------------------------------------- | ------------------------- |
| **id**             | `number`                            | A unique integer value identifying this prompt feedback. | [Defaults to `undefined`] |
| **promptFeedback** | [PromptFeedback](PromptFeedback.md) |                                                          |                           |

### Return type

[**PromptFeedback**](PromptFeedback.md)

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
