# TestCasesApi

All URIs are relative to _http://localhost_

| Method                                             | HTTP request                  | Description |
| -------------------------------------------------- | ----------------------------- | ----------- |
| [**create**](TestCasesApi.md#create)               | **POST** /testCases/          |             |
| [**destroy**](TestCasesApi.md#destroy)             | **DELETE** /testCases/{id}/   |             |
| [**list**](TestCasesApi.md#list)                   | **GET** /testCases/           |             |
| [**partialUpdate**](TestCasesApi.md#partialupdate) | **PATCH** /testCases/{id}/    |             |
| [**retrieve**](TestCasesApi.md#retrieve)           | **GET** /testCases/{id}/      |             |
| [**runCreate**](TestCasesApi.md#runcreate)         | **POST** /testCases/{id}/run/ |             |
| [**update**](TestCasesApi.md#update)               | **PUT** /testCases/{id}/      |             |

## create

> TestCase create(testCase)

list: Return a list of all the testcases. create: Create a new testcases. retrieve: Return the given testcases. update: Update a testcases. partial_update: Update a testcases. delete: Delete a testcases.

### Example

```ts
import {
  Configuration,
  TestCasesApi,
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
  const api = new TestCasesApi(config);

  const body = {
    // TestCase
    testCase: ...,
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

| Name         | Type                    | Description | Notes |
| ------------ | ----------------------- | ----------- | ----- |
| **testCase** | [TestCase](TestCase.md) |             |       |

### Return type

[**TestCase**](TestCase.md)

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

list: Return a list of all the testcases. create: Create a new testcases. retrieve: Return the given testcases. update: Update a testcases. partial_update: Update a testcases. delete: Delete a testcases.

### Example

```ts
import { Configuration, TestCasesApi } from '';
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
  const api = new TestCasesApi(config);

  const body = {
    // number | A unique integer value identifying this test case.
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

| Name   | Type     | Description                                        | Notes                     |
| ------ | -------- | -------------------------------------------------- | ------------------------- |
| **id** | `number` | A unique integer value identifying this test case. | [Defaults to `undefined`] |

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

> Array&lt;TestCase&gt; list()

list: Return a list of all the testcases. create: Create a new testcases. retrieve: Return the given testcases. update: Update a testcases. partial_update: Update a testcases. delete: Delete a testcases.

### Example

```ts
import { Configuration, TestCasesApi } from '';
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
  const api = new TestCasesApi(config);

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

[**Array&lt;TestCase&gt;**](TestCase.md)

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

> TestCase partialUpdate(id, patchedTestCase)

list: Return a list of all the testcases. create: Create a new testcases. retrieve: Return the given testcases. update: Update a testcases. partial_update: Update a testcases. delete: Delete a testcases.

### Example

```ts
import {
  Configuration,
  TestCasesApi,
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
  const api = new TestCasesApi(config);

  const body = {
    // number | A unique integer value identifying this test case.
    id: 56,
    // PatchedTestCase (optional)
    patchedTestCase: ...,
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

| Name                | Type                                  | Description                                        | Notes                     |
| ------------------- | ------------------------------------- | -------------------------------------------------- | ------------------------- |
| **id**              | `number`                              | A unique integer value identifying this test case. | [Defaults to `undefined`] |
| **patchedTestCase** | [PatchedTestCase](PatchedTestCase.md) |                                                    | [Optional]                |

### Return type

[**TestCase**](TestCase.md)

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

> TestCase retrieve(id)

list: Return a list of all the testcases. create: Create a new testcases. retrieve: Return the given testcases. update: Update a testcases. partial_update: Update a testcases. delete: Delete a testcases.

### Example

```ts
import { Configuration, TestCasesApi } from '';
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
  const api = new TestCasesApi(config);

  const body = {
    // number | A unique integer value identifying this test case.
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

| Name   | Type     | Description                                        | Notes                     |
| ------ | -------- | -------------------------------------------------- | ------------------------- |
| **id** | `number` | A unique integer value identifying this test case. | [Defaults to `undefined`] |

### Return type

[**TestCase**](TestCase.md)

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

## runCreate

> TestCaseRunResponse runCreate(id, testCaseRunRequest)

list: Return a list of all the testcases. create: Create a new testcases. retrieve: Return the given testcases. update: Update a testcases. partial_update: Update a testcases. delete: Delete a testcases.

### Example

```ts
import {
  Configuration,
  TestCasesApi,
} from '';
import type { RunCreateRequest } from '';

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
  const api = new TestCasesApi(config);

  const body = {
    // number | A unique integer value identifying this test case.
    id: 56,
    // TestCaseRunRequest (optional)
    testCaseRunRequest: ...,
  } satisfies RunCreateRequest;

  try {
    const data = await api.runCreate(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                   | Type                                        | Description                                        | Notes                     |
| ---------------------- | ------------------------------------------- | -------------------------------------------------- | ------------------------- |
| **id**                 | `number`                                    | A unique integer value identifying this test case. | [Defaults to `undefined`] |
| **testCaseRunRequest** | [TestCaseRunRequest](TestCaseRunRequest.md) |                                                    | [Optional]                |

### Return type

[**TestCaseRunResponse**](TestCaseRunResponse.md)

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

## update

> TestCase update(id, testCase)

list: Return a list of all the testcases. create: Create a new testcases. retrieve: Return the given testcases. update: Update a testcases. partial_update: Update a testcases. delete: Delete a testcases.

### Example

```ts
import {
  Configuration,
  TestCasesApi,
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
  const api = new TestCasesApi(config);

  const body = {
    // number | A unique integer value identifying this test case.
    id: 56,
    // TestCase
    testCase: ...,
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

| Name         | Type                    | Description                                        | Notes                     |
| ------------ | ----------------------- | -------------------------------------------------- | ------------------------- |
| **id**       | `number`                | A unique integer value identifying this test case. | [Defaults to `undefined`] |
| **testCase** | [TestCase](TestCase.md) |                                                    |                           |

### Return type

[**TestCase**](TestCase.md)

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
