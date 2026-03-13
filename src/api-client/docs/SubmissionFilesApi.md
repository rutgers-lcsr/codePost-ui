# SubmissionFilesApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**create**](SubmissionFilesApi.md#create) | **POST** /submissionFiles/ |  |
| [**destroy**](SubmissionFilesApi.md#destroy) | **DELETE** /submissionFiles/{id}/ |  |
| [**list**](SubmissionFilesApi.md#list) | **GET** /submissionFiles/ |  |
| [**partialUpdate**](SubmissionFilesApi.md#partialupdate) | **PATCH** /submissionFiles/{id}/ |  |
| [**retrieve**](SubmissionFilesApi.md#retrieve) | **GET** /submissionFiles/{id}/ |  |
| [**update**](SubmissionFilesApi.md#update) | **PUT** /submissionFiles/{id}/ |  |



## create

> SubmissionFile create(submissionFile)



ViewSet for SubmissionFile objects.  SubmissionFiles are files that belong to student submissions. These were previously just called \&quot;File\&quot; objects.  list: Return a list of all submission files.  create: Create a new submission file.  retrieve: Return the given submission file.  update: Update a submission file.  partial_update: Partially update a submission file.  delete: Delete a submission file.

### Example

```ts
import {
  Configuration,
  SubmissionFilesApi,
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
  const api = new SubmissionFilesApi(config);

  const body = {
    // SubmissionFile
    submissionFile: ...,
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
| **submissionFile** | [SubmissionFile](SubmissionFile.md) |  | |

### Return type

[**SubmissionFile**](SubmissionFile.md)

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



ViewSet for SubmissionFile objects.  SubmissionFiles are files that belong to student submissions. These were previously just called \&quot;File\&quot; objects.  list: Return a list of all submission files.  create: Create a new submission file.  retrieve: Return the given submission file.  update: Update a submission file.  partial_update: Partially update a submission file.  delete: Delete a submission file.

### Example

```ts
import {
  Configuration,
  SubmissionFilesApi,
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
  const api = new SubmissionFilesApi(config);

  const body = {
    // number | A unique integer value identifying this submission file.
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
| **id** | `number` | A unique integer value identifying this submission file. | [Defaults to `undefined`] |

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

> Array&lt;SubmissionFile&gt; list()



ViewSet for SubmissionFile objects.  SubmissionFiles are files that belong to student submissions. These were previously just called \&quot;File\&quot; objects.  list: Return a list of all submission files.  create: Create a new submission file.  retrieve: Return the given submission file.  update: Update a submission file.  partial_update: Partially update a submission file.  delete: Delete a submission file.

### Example

```ts
import {
  Configuration,
  SubmissionFilesApi,
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
  const api = new SubmissionFilesApi(config);

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

[**Array&lt;SubmissionFile&gt;**](SubmissionFile.md)

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

> SubmissionFile partialUpdate(id, patchedSubmissionFile)



ViewSet for SubmissionFile objects.  SubmissionFiles are files that belong to student submissions. These were previously just called \&quot;File\&quot; objects.  list: Return a list of all submission files.  create: Create a new submission file.  retrieve: Return the given submission file.  update: Update a submission file.  partial_update: Partially update a submission file.  delete: Delete a submission file.

### Example

```ts
import {
  Configuration,
  SubmissionFilesApi,
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
  const api = new SubmissionFilesApi(config);

  const body = {
    // number | A unique integer value identifying this submission file.
    id: 56,
    // PatchedSubmissionFile (optional)
    patchedSubmissionFile: ...,
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
| **id** | `number` | A unique integer value identifying this submission file. | [Defaults to `undefined`] |
| **patchedSubmissionFile** | [PatchedSubmissionFile](PatchedSubmissionFile.md) |  | [Optional] |

### Return type

[**SubmissionFile**](SubmissionFile.md)

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

> SubmissionFile retrieve(id)



ViewSet for SubmissionFile objects.  SubmissionFiles are files that belong to student submissions. These were previously just called \&quot;File\&quot; objects.  list: Return a list of all submission files.  create: Create a new submission file.  retrieve: Return the given submission file.  update: Update a submission file.  partial_update: Partially update a submission file.  delete: Delete a submission file.

### Example

```ts
import {
  Configuration,
  SubmissionFilesApi,
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
  const api = new SubmissionFilesApi(config);

  const body = {
    // number | A unique integer value identifying this submission file.
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
| **id** | `number` | A unique integer value identifying this submission file. | [Defaults to `undefined`] |

### Return type

[**SubmissionFile**](SubmissionFile.md)

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

> SubmissionFile update(id, submissionFile)



ViewSet for SubmissionFile objects.  SubmissionFiles are files that belong to student submissions. These were previously just called \&quot;File\&quot; objects.  list: Return a list of all submission files.  create: Create a new submission file.  retrieve: Return the given submission file.  update: Update a submission file.  partial_update: Partially update a submission file.  delete: Delete a submission file.

### Example

```ts
import {
  Configuration,
  SubmissionFilesApi,
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
  const api = new SubmissionFilesApi(config);

  const body = {
    // number | A unique integer value identifying this submission file.
    id: 56,
    // SubmissionFile
    submissionFile: ...,
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
| **id** | `number` | A unique integer value identifying this submission file. | [Defaults to `undefined`] |
| **submissionFile** | [SubmissionFile](SubmissionFile.md) |  | |

### Return type

[**SubmissionFile**](SubmissionFile.md)

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

