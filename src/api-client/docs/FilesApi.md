# FilesApi

All URIs are relative to _http://localhost_

| Method                                         | HTTP request            | Description |
| ---------------------------------------------- | ----------------------- | ----------- |
| [**create**](FilesApi.md#create)               | **POST** /files/        |             |
| [**destroy**](FilesApi.md#destroy)             | **DELETE** /files/{id}/ |             |
| [**list**](FilesApi.md#list)                   | **GET** /files/         |             |
| [**partialUpdate**](FilesApi.md#partialupdate) | **PATCH** /files/{id}/  |             |
| [**retrieve**](FilesApi.md#retrieve)           | **GET** /files/{id}/    |             |
| [**update**](FilesApi.md#update)               | **PUT** /files/{id}/    |             |

## create

> any create(modelFile)

ViewSet for base File objects. This handles all file types polymorphically. For specific file types, use the dedicated endpoints: - /submissionFiles/ for SubmissionFile objects - /assignmentFiles/ for AssignmentFile objects - /courseFiles/ for CourseFile objects list: Return a list of all files (all types). create: Create a new file. retrieve: Return the given file. update: Update a file. partial_update: Partially update a file. delete: Delete a file.

### Example

```ts
import {
  Configuration,
  FilesApi,
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
  const api = new FilesApi(config);

  const body = {
    // ModelFile
    modelFile: ...,
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

| Name          | Type                      | Description | Notes |
| ------------- | ------------------------- | ----------- | ----- |
| **modelFile** | [ModelFile](ModelFile.md) |             |       |

### Return type

**any**

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

ViewSet for base File objects. This handles all file types polymorphically. For specific file types, use the dedicated endpoints: - /submissionFiles/ for SubmissionFile objects - /assignmentFiles/ for AssignmentFile objects - /courseFiles/ for CourseFile objects list: Return a list of all files (all types). create: Create a new file. retrieve: Return the given file. update: Update a file. partial_update: Partially update a file. delete: Delete a file.

### Example

```ts
import { Configuration, FilesApi } from '';
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
  const api = new FilesApi(config);

  const body = {
    // number | A unique integer value identifying this file.
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

| Name   | Type     | Description                                   | Notes                     |
| ------ | -------- | --------------------------------------------- | ------------------------- |
| **id** | `number` | A unique integer value identifying this file. | [Defaults to `undefined`] |

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

> Array&lt;any&gt; list()

ViewSet for base File objects. This handles all file types polymorphically. For specific file types, use the dedicated endpoints: - /submissionFiles/ for SubmissionFile objects - /assignmentFiles/ for AssignmentFile objects - /courseFiles/ for CourseFile objects list: Return a list of all files (all types). create: Create a new file. retrieve: Return the given file. update: Update a file. partial_update: Partially update a file. delete: Delete a file.

### Example

```ts
import { Configuration, FilesApi } from '';
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
  const api = new FilesApi(config);

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

**Array<any>**

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

> any partialUpdate(id, patchedFile)

ViewSet for base File objects. This handles all file types polymorphically. For specific file types, use the dedicated endpoints: - /submissionFiles/ for SubmissionFile objects - /assignmentFiles/ for AssignmentFile objects - /courseFiles/ for CourseFile objects list: Return a list of all files (all types). create: Create a new file. retrieve: Return the given file. update: Update a file. partial_update: Partially update a file. delete: Delete a file.

### Example

```ts
import {
  Configuration,
  FilesApi,
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
  const api = new FilesApi(config);

  const body = {
    // number | A unique integer value identifying this file.
    id: 56,
    // PatchedFile (optional)
    patchedFile: ...,
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

| Name            | Type                          | Description                                   | Notes                     |
| --------------- | ----------------------------- | --------------------------------------------- | ------------------------- |
| **id**          | `number`                      | A unique integer value identifying this file. | [Defaults to `undefined`] |
| **patchedFile** | [PatchedFile](PatchedFile.md) |                                               | [Optional]                |

### Return type

**any**

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

> any retrieve(id)

ViewSet for base File objects. This handles all file types polymorphically. For specific file types, use the dedicated endpoints: - /submissionFiles/ for SubmissionFile objects - /assignmentFiles/ for AssignmentFile objects - /courseFiles/ for CourseFile objects list: Return a list of all files (all types). create: Create a new file. retrieve: Return the given file. update: Update a file. partial_update: Partially update a file. delete: Delete a file.

### Example

```ts
import { Configuration, FilesApi } from '';
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
  const api = new FilesApi(config);

  const body = {
    // number | A unique integer value identifying this file.
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

| Name   | Type     | Description                                   | Notes                     |
| ------ | -------- | --------------------------------------------- | ------------------------- |
| **id** | `number` | A unique integer value identifying this file. | [Defaults to `undefined`] |

### Return type

**any**

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

> any update(id, modelFile)

ViewSet for base File objects. This handles all file types polymorphically. For specific file types, use the dedicated endpoints: - /submissionFiles/ for SubmissionFile objects - /assignmentFiles/ for AssignmentFile objects - /courseFiles/ for CourseFile objects list: Return a list of all files (all types). create: Create a new file. retrieve: Return the given file. update: Update a file. partial_update: Partially update a file. delete: Delete a file.

### Example

```ts
import {
  Configuration,
  FilesApi,
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
  const api = new FilesApi(config);

  const body = {
    // number | A unique integer value identifying this file.
    id: 56,
    // ModelFile
    modelFile: ...,
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

| Name          | Type                      | Description                                   | Notes                     |
| ------------- | ------------------------- | --------------------------------------------- | ------------------------- |
| **id**        | `number`                  | A unique integer value identifying this file. | [Defaults to `undefined`] |
| **modelFile** | [ModelFile](ModelFile.md) |                                               |                           |

### Return type

**any**

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
