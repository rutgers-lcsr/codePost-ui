# RubricCategoriesApi

All URIs are relative to _http://localhost_

| Method                                                    | HTTP request                       | Description |
| --------------------------------------------------------- | ---------------------------------- | ----------- |
| [**create**](RubricCategoriesApi.md#create)               | **POST** /rubricCategories/        |             |
| [**destroy**](RubricCategoriesApi.md#destroy)             | **DELETE** /rubricCategories/{id}/ |             |
| [**list**](RubricCategoriesApi.md#list)                   | **GET** /rubricCategories/         |             |
| [**partialUpdate**](RubricCategoriesApi.md#partialupdate) | **PATCH** /rubricCategories/{id}/  |             |
| [**retrieve**](RubricCategoriesApi.md#retrieve)           | **GET** /rubricCategories/{id}/    |             |
| [**update**](RubricCategoriesApi.md#update)               | **PUT** /rubricCategories/{id}/    |             |

## create

> RubricCategory create(rubricCategory)

list: Return a list of all the rubric categories. create: Create a new rubric category. retrieve: Return the given rubric category. update: Update a rubric category. partial_update: Update a rubric category. delete: Delete a rubric category.

### Example

```ts
import {
  Configuration,
  RubricCategoriesApi,
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
  const api = new RubricCategoriesApi(config);

  const body = {
    // RubricCategory
    rubricCategory: ...,
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
| **rubricCategory** | [RubricCategory](RubricCategory.md) |             |       |

### Return type

[**RubricCategory**](RubricCategory.md)

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

list: Return a list of all the rubric categories. create: Create a new rubric category. retrieve: Return the given rubric category. update: Update a rubric category. partial_update: Update a rubric category. delete: Delete a rubric category.

### Example

```ts
import { Configuration, RubricCategoriesApi } from '';
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
  const api = new RubricCategoriesApi(config);

  const body = {
    // number | A unique integer value identifying this rubric category.
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
| **id** | `number` | A unique integer value identifying this rubric category. | [Defaults to `undefined`] |

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

> Array&lt;RubricCategory&gt; list()

list: Return a list of all the rubric categories. create: Create a new rubric category. retrieve: Return the given rubric category. update: Update a rubric category. partial_update: Update a rubric category. delete: Delete a rubric category.

### Example

```ts
import { Configuration, RubricCategoriesApi } from '';
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
  const api = new RubricCategoriesApi(config);

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

[**Array&lt;RubricCategory&gt;**](RubricCategory.md)

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

> RubricCategory partialUpdate(id, patchedRubricCategory)

list: Return a list of all the rubric categories. create: Create a new rubric category. retrieve: Return the given rubric category. update: Update a rubric category. partial_update: Update a rubric category. delete: Delete a rubric category.

### Example

```ts
import {
  Configuration,
  RubricCategoriesApi,
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
  const api = new RubricCategoriesApi(config);

  const body = {
    // number | A unique integer value identifying this rubric category.
    id: 56,
    // PatchedRubricCategory (optional)
    patchedRubricCategory: ...,
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
| **id**                    | `number`                                          | A unique integer value identifying this rubric category. | [Defaults to `undefined`] |
| **patchedRubricCategory** | [PatchedRubricCategory](PatchedRubricCategory.md) |                                                          | [Optional]                |

### Return type

[**RubricCategory**](RubricCategory.md)

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

> RubricCategory retrieve(id)

list: Return a list of all the rubric categories. create: Create a new rubric category. retrieve: Return the given rubric category. update: Update a rubric category. partial_update: Update a rubric category. delete: Delete a rubric category.

### Example

```ts
import { Configuration, RubricCategoriesApi } from '';
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
  const api = new RubricCategoriesApi(config);

  const body = {
    // number | A unique integer value identifying this rubric category.
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
| **id** | `number` | A unique integer value identifying this rubric category. | [Defaults to `undefined`] |

### Return type

[**RubricCategory**](RubricCategory.md)

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

> RubricCategory update(id, rubricCategory)

list: Return a list of all the rubric categories. create: Create a new rubric category. retrieve: Return the given rubric category. update: Update a rubric category. partial_update: Update a rubric category. delete: Delete a rubric category.

### Example

```ts
import {
  Configuration,
  RubricCategoriesApi,
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
  const api = new RubricCategoriesApi(config);

  const body = {
    // number | A unique integer value identifying this rubric category.
    id: 56,
    // RubricCategory
    rubricCategory: ...,
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
| **id**             | `number`                            | A unique integer value identifying this rubric category. | [Defaults to `undefined`] |
| **rubricCategory** | [RubricCategory](RubricCategory.md) |                                                          |                           |

### Return type

[**RubricCategory**](RubricCategory.md)

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
