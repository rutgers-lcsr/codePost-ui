# TestCategoryResourcesApi

All URIs are relative to _http://localhost_

| Method                                                         | HTTP request                            | Description |
| -------------------------------------------------------------- | --------------------------------------- | ----------- |
| [**create**](TestCategoryResourcesApi.md#create)               | **POST** /testCategoryResources/        |             |
| [**destroy**](TestCategoryResourcesApi.md#destroy)             | **DELETE** /testCategoryResources/{id}/ |             |
| [**list**](TestCategoryResourcesApi.md#list)                   | **GET** /testCategoryResources/         |             |
| [**partialUpdate**](TestCategoryResourcesApi.md#partialupdate) | **PATCH** /testCategoryResources/{id}/  |             |
| [**retrieve**](TestCategoryResourcesApi.md#retrieve)           | **GET** /testCategoryResources/{id}/    |             |
| [**update**](TestCategoryResourcesApi.md#update)               | **PUT** /testCategoryResources/{id}/    |             |

## create

> TestCategoryResource create(testCategoryResource)

list: Return a list of all the testCategoryResources. create: Create a new testCategoryResource. retrieve: Return the given testCategoryResource. update: Update a testCategoryResource. partial_update: Update a testCategoryResource. delete: Delete a testCategoryResource.

### Example

```ts
import {
  Configuration,
  TestCategoryResourcesApi,
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
  const api = new TestCategoryResourcesApi(config);

  const body = {
    // TestCategoryResource
    testCategoryResource: ...,
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

| Name                     | Type                                            | Description | Notes |
| ------------------------ | ----------------------------------------------- | ----------- | ----- |
| **testCategoryResource** | [TestCategoryResource](TestCategoryResource.md) |             |       |

### Return type

[**TestCategoryResource**](TestCategoryResource.md)

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

list: Return a list of all the testCategoryResources. create: Create a new testCategoryResource. retrieve: Return the given testCategoryResource. update: Update a testCategoryResource. partial_update: Update a testCategoryResource. delete: Delete a testCategoryResource.

### Example

```ts
import { Configuration, TestCategoryResourcesApi } from '';
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
  const api = new TestCategoryResourcesApi(config);

  const body = {
    // number | A unique integer value identifying this test category resource.
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

| Name   | Type     | Description                                                     | Notes                     |
| ------ | -------- | --------------------------------------------------------------- | ------------------------- |
| **id** | `number` | A unique integer value identifying this test category resource. | [Defaults to `undefined`] |

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

> Array&lt;TestCategoryResource&gt; list()

list: Return a list of all the testCategoryResources. create: Create a new testCategoryResource. retrieve: Return the given testCategoryResource. update: Update a testCategoryResource. partial_update: Update a testCategoryResource. delete: Delete a testCategoryResource.

### Example

```ts
import { Configuration, TestCategoryResourcesApi } from '';
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
  const api = new TestCategoryResourcesApi(config);

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

[**Array&lt;TestCategoryResource&gt;**](TestCategoryResource.md)

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

> TestCategoryResource partialUpdate(id, patchedTestCategoryResource)

list: Return a list of all the testCategoryResources. create: Create a new testCategoryResource. retrieve: Return the given testCategoryResource. update: Update a testCategoryResource. partial_update: Update a testCategoryResource. delete: Delete a testCategoryResource.

### Example

```ts
import {
  Configuration,
  TestCategoryResourcesApi,
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
  const api = new TestCategoryResourcesApi(config);

  const body = {
    // number | A unique integer value identifying this test category resource.
    id: 56,
    // PatchedTestCategoryResource (optional)
    patchedTestCategoryResource: ...,
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

| Name                            | Type                                                          | Description                                                     | Notes                     |
| ------------------------------- | ------------------------------------------------------------- | --------------------------------------------------------------- | ------------------------- |
| **id**                          | `number`                                                      | A unique integer value identifying this test category resource. | [Defaults to `undefined`] |
| **patchedTestCategoryResource** | [PatchedTestCategoryResource](PatchedTestCategoryResource.md) |                                                                 | [Optional]                |

### Return type

[**TestCategoryResource**](TestCategoryResource.md)

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

> TestCategoryResource retrieve(id)

list: Return a list of all the testCategoryResources. create: Create a new testCategoryResource. retrieve: Return the given testCategoryResource. update: Update a testCategoryResource. partial_update: Update a testCategoryResource. delete: Delete a testCategoryResource.

### Example

```ts
import { Configuration, TestCategoryResourcesApi } from '';
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
  const api = new TestCategoryResourcesApi(config);

  const body = {
    // number | A unique integer value identifying this test category resource.
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

| Name   | Type     | Description                                                     | Notes                     |
| ------ | -------- | --------------------------------------------------------------- | ------------------------- |
| **id** | `number` | A unique integer value identifying this test category resource. | [Defaults to `undefined`] |

### Return type

[**TestCategoryResource**](TestCategoryResource.md)

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

> TestCategoryResource update(id, testCategoryResource)

list: Return a list of all the testCategoryResources. create: Create a new testCategoryResource. retrieve: Return the given testCategoryResource. update: Update a testCategoryResource. partial_update: Update a testCategoryResource. delete: Delete a testCategoryResource.

### Example

```ts
import {
  Configuration,
  TestCategoryResourcesApi,
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
  const api = new TestCategoryResourcesApi(config);

  const body = {
    // number | A unique integer value identifying this test category resource.
    id: 56,
    // TestCategoryResource
    testCategoryResource: ...,
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

| Name                     | Type                                            | Description                                                     | Notes                     |
| ------------------------ | ----------------------------------------------- | --------------------------------------------------------------- | ------------------------- |
| **id**                   | `number`                                        | A unique integer value identifying this test category resource. | [Defaults to `undefined`] |
| **testCategoryResource** | [TestCategoryResource](TestCategoryResource.md) |                                                                 |                           |

### Return type

[**TestCategoryResource**](TestCategoryResource.md)

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
