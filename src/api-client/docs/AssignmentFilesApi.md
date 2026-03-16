# AssignmentFilesApi

All URIs are relative to _http://localhost_

| Method                                                   | HTTP request                      | Description |
| -------------------------------------------------------- | --------------------------------- | ----------- |
| [**create**](AssignmentFilesApi.md#create)               | **POST** /assignmentFiles/        |             |
| [**destroy**](AssignmentFilesApi.md#destroy)             | **DELETE** /assignmentFiles/{id}/ |             |
| [**list**](AssignmentFilesApi.md#list)                   | **GET** /assignmentFiles/         |             |
| [**partialUpdate**](AssignmentFilesApi.md#partialupdate) | **PATCH** /assignmentFiles/{id}/  |             |
| [**retrieve**](AssignmentFilesApi.md#retrieve)           | **GET** /assignmentFiles/{id}/    |             |
| [**update**](AssignmentFilesApi.md#update)               | **PUT** /assignmentFiles/{id}/    |             |

## create

> AssignmentFile create(assignmentFile)

ViewSet for AssignmentFile objects. AssignmentFiles are files that belong to assignments (e.g., starter code, instructions, templates, etc.). list: Return a list of all assignment files. create: Create a new assignment file. retrieve: Return the given assignment file. update: Update an assignment file. partial_update: Partially update an assignment file. delete: Delete an assignment file.

### Example

```ts
import {
  Configuration,
  AssignmentFilesApi,
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
  const api = new AssignmentFilesApi(config);

  const body = {
    // AssignmentFile
    assignmentFile: ...,
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
| **assignmentFile** | [AssignmentFile](AssignmentFile.md) |             |       |

### Return type

[**AssignmentFile**](AssignmentFile.md)

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

ViewSet for AssignmentFile objects. AssignmentFiles are files that belong to assignments (e.g., starter code, instructions, templates, etc.). list: Return a list of all assignment files. create: Create a new assignment file. retrieve: Return the given assignment file. update: Update an assignment file. partial_update: Partially update an assignment file. delete: Delete an assignment file.

### Example

```ts
import { Configuration, AssignmentFilesApi } from '';
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
  const api = new AssignmentFilesApi(config);

  const body = {
    // number | A unique integer value identifying this assignment file.
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
| **id** | `number` | A unique integer value identifying this assignment file. | [Defaults to `undefined`] |

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

> Array&lt;AssignmentFileSummary&gt; list()

ViewSet for AssignmentFile objects. AssignmentFiles are files that belong to assignments (e.g., starter code, instructions, templates, etc.). list: Return a list of all assignment files. create: Create a new assignment file. retrieve: Return the given assignment file. update: Update an assignment file. partial_update: Partially update an assignment file. delete: Delete an assignment file.

### Example

```ts
import { Configuration, AssignmentFilesApi } from '';
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
  const api = new AssignmentFilesApi(config);

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

[**Array&lt;AssignmentFileSummary&gt;**](AssignmentFileSummary.md)

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

> AssignmentFile partialUpdate(id, patchedAssignmentFile)

ViewSet for AssignmentFile objects. AssignmentFiles are files that belong to assignments (e.g., starter code, instructions, templates, etc.). list: Return a list of all assignment files. create: Create a new assignment file. retrieve: Return the given assignment file. update: Update an assignment file. partial_update: Partially update an assignment file. delete: Delete an assignment file.

### Example

```ts
import {
  Configuration,
  AssignmentFilesApi,
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
  const api = new AssignmentFilesApi(config);

  const body = {
    // number | A unique integer value identifying this assignment file.
    id: 56,
    // PatchedAssignmentFile (optional)
    patchedAssignmentFile: ...,
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
| **id**                    | `number`                                          | A unique integer value identifying this assignment file. | [Defaults to `undefined`] |
| **patchedAssignmentFile** | [PatchedAssignmentFile](PatchedAssignmentFile.md) |                                                          | [Optional]                |

### Return type

[**AssignmentFile**](AssignmentFile.md)

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

> AssignmentFile retrieve(id)

ViewSet for AssignmentFile objects. AssignmentFiles are files that belong to assignments (e.g., starter code, instructions, templates, etc.). list: Return a list of all assignment files. create: Create a new assignment file. retrieve: Return the given assignment file. update: Update an assignment file. partial_update: Partially update an assignment file. delete: Delete an assignment file.

### Example

```ts
import { Configuration, AssignmentFilesApi } from '';
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
  const api = new AssignmentFilesApi(config);

  const body = {
    // number | A unique integer value identifying this assignment file.
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
| **id** | `number` | A unique integer value identifying this assignment file. | [Defaults to `undefined`] |

### Return type

[**AssignmentFile**](AssignmentFile.md)

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

> AssignmentFile update(id, assignmentFile)

ViewSet for AssignmentFile objects. AssignmentFiles are files that belong to assignments (e.g., starter code, instructions, templates, etc.). list: Return a list of all assignment files. create: Create a new assignment file. retrieve: Return the given assignment file. update: Update an assignment file. partial_update: Partially update an assignment file. delete: Delete an assignment file.

### Example

```ts
import {
  Configuration,
  AssignmentFilesApi,
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
  const api = new AssignmentFilesApi(config);

  const body = {
    // number | A unique integer value identifying this assignment file.
    id: 56,
    // AssignmentFile
    assignmentFile: ...,
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
| **id**             | `number`                            | A unique integer value identifying this assignment file. | [Defaults to `undefined`] |
| **assignmentFile** | [AssignmentFile](AssignmentFile.md) |                                                          |                           |

### Return type

[**AssignmentFile**](AssignmentFile.md)

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
