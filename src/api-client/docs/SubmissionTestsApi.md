# SubmissionTestsApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**create**](SubmissionTestsApi.md#create) | **POST** /submissionTests/ |  |
| [**destroy**](SubmissionTestsApi.md#destroy) | **DELETE** /submissionTests/{id}/ |  |
| [**list**](SubmissionTestsApi.md#list) | **GET** /submissionTests/ |  |
| [**partialUpdate**](SubmissionTestsApi.md#partialupdate) | **PATCH** /submissionTests/{id}/ |  |
| [**retrieve**](SubmissionTestsApi.md#retrieve) | **GET** /submissionTests/{id}/ |  |
| [**update**](SubmissionTestsApi.md#update) | **PUT** /submissionTests/{id}/ |  |



## create

> SubmissionTest create(submissionTest)



list: Return a list of all the solutionFiles.  create: Create a new solutionFiles.  retrieve: Return the given solutionFiles.  update: Update a solutionFiles.  partial_update: Update a solutionFiles.  delete: Delete a solutionFiles.

### Example

```ts
import {
  Configuration,
  SubmissionTestsApi,
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
  const api = new SubmissionTestsApi(config);

  const body = {
    // SubmissionTest
    submissionTest: ...,
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


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **submissionTest** | [SubmissionTest](SubmissionTest.md) |  | |

### Return type

[**SubmissionTest**](SubmissionTest.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

### HTTP request headers

- **Content-Type**: `application/json`, `application/x-www-form-urlencoded`, `multipart/form-data`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **201** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## destroy

> destroy(id)



list: Return a list of all the solutionFiles.  create: Create a new solutionFiles.  retrieve: Return the given solutionFiles.  update: Update a solutionFiles.  partial_update: Update a solutionFiles.  delete: Delete a solutionFiles.

### Example

```ts
import {
  Configuration,
  SubmissionTestsApi,
} from '';
import type { DestroyRequest } from '';

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
  const api = new SubmissionTestsApi(config);

  const body = {
    // number | A unique integer value identifying this submission test.
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


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **id** | `number` | A unique integer value identifying this submission test. | [Defaults to `undefined`] |

### Return type

`void` (Empty response body)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **204** | No response body |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## list

> Array&lt;SubmissionTest&gt; list()



list: Return a list of all the solutionFiles.  create: Create a new solutionFiles.  retrieve: Return the given solutionFiles.  update: Update a solutionFiles.  partial_update: Update a solutionFiles.  delete: Delete a solutionFiles.

### Example

```ts
import {
  Configuration,
  SubmissionTestsApi,
} from '';
import type { ListRequest } from '';

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
  const api = new SubmissionTestsApi(config);

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

[**Array&lt;SubmissionTest&gt;**](SubmissionTest.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## partialUpdate

> SubmissionTest partialUpdate(id, patchedSubmissionTest)



list: Return a list of all the solutionFiles.  create: Create a new solutionFiles.  retrieve: Return the given solutionFiles.  update: Update a solutionFiles.  partial_update: Update a solutionFiles.  delete: Delete a solutionFiles.

### Example

```ts
import {
  Configuration,
  SubmissionTestsApi,
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
  const api = new SubmissionTestsApi(config);

  const body = {
    // number | A unique integer value identifying this submission test.
    id: 56,
    // PatchedSubmissionTest (optional)
    patchedSubmissionTest: ...,
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


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **id** | `number` | A unique integer value identifying this submission test. | [Defaults to `undefined`] |
| **patchedSubmissionTest** | [PatchedSubmissionTest](PatchedSubmissionTest.md) |  | [Optional] |

### Return type

[**SubmissionTest**](SubmissionTest.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

### HTTP request headers

- **Content-Type**: `application/json`, `application/x-www-form-urlencoded`, `multipart/form-data`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## retrieve

> SubmissionTest retrieve(id)



list: Return a list of all the solutionFiles.  create: Create a new solutionFiles.  retrieve: Return the given solutionFiles.  update: Update a solutionFiles.  partial_update: Update a solutionFiles.  delete: Delete a solutionFiles.

### Example

```ts
import {
  Configuration,
  SubmissionTestsApi,
} from '';
import type { RetrieveRequest } from '';

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
  const api = new SubmissionTestsApi(config);

  const body = {
    // number | A unique integer value identifying this submission test.
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


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **id** | `number` | A unique integer value identifying this submission test. | [Defaults to `undefined`] |

### Return type

[**SubmissionTest**](SubmissionTest.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## update

> SubmissionTest update(id, submissionTest)



list: Return a list of all the solutionFiles.  create: Create a new solutionFiles.  retrieve: Return the given solutionFiles.  update: Update a solutionFiles.  partial_update: Update a solutionFiles.  delete: Delete a solutionFiles.

### Example

```ts
import {
  Configuration,
  SubmissionTestsApi,
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
  const api = new SubmissionTestsApi(config);

  const body = {
    // number | A unique integer value identifying this submission test.
    id: 56,
    // SubmissionTest
    submissionTest: ...,
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


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **id** | `number` | A unique integer value identifying this submission test. | [Defaults to `undefined`] |
| **submissionTest** | [SubmissionTest](SubmissionTest.md) |  | |

### Return type

[**SubmissionTest**](SubmissionTest.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

### HTTP request headers

- **Content-Type**: `application/json`, `application/x-www-form-urlencoded`, `multipart/form-data`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

