# CourseFilesApi

All URIs are relative to _http://localhost_

| Method                                               | HTTP request                  | Description |
| ---------------------------------------------------- | ----------------------------- | ----------- |
| [**create**](CourseFilesApi.md#create)               | **POST** /courseFiles/        |             |
| [**destroy**](CourseFilesApi.md#destroy)             | **DELETE** /courseFiles/{id}/ |             |
| [**list**](CourseFilesApi.md#list)                   | **GET** /courseFiles/         |             |
| [**partialUpdate**](CourseFilesApi.md#partialupdate) | **PATCH** /courseFiles/{id}/  |             |
| [**retrieve**](CourseFilesApi.md#retrieve)           | **GET** /courseFiles/{id}/    |             |
| [**update**](CourseFilesApi.md#update)               | **PUT** /courseFiles/{id}/    |             |

## create

> CourseFile create(courseFile)

ViewSet for CourseFile objects. CourseFiles are files that belong to courses (e.g., syllabi, course resources, etc.). list: Return a list of all course files for a given course (requires ?course&#x3D;&lt;id&gt; parameter). create: Create a new course file. retrieve: Return the given course file. update: Update a course file. partial_update: Partially update a course file. delete: Delete a course file.

### Example

```ts
import {
  Configuration,
  CourseFilesApi,
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
  const api = new CourseFilesApi(config);

  const body = {
    // CourseFile
    courseFile: ...,
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

| Name           | Type                        | Description | Notes |
| -------------- | --------------------------- | ----------- | ----- |
| **courseFile** | [CourseFile](CourseFile.md) |             |       |

### Return type

[**CourseFile**](CourseFile.md)

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

ViewSet for CourseFile objects. CourseFiles are files that belong to courses (e.g., syllabi, course resources, etc.). list: Return a list of all course files for a given course (requires ?course&#x3D;&lt;id&gt; parameter). create: Create a new course file. retrieve: Return the given course file. update: Update a course file. partial_update: Partially update a course file. delete: Delete a course file.

### Example

```ts
import { Configuration, CourseFilesApi } from '';
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
  const api = new CourseFilesApi(config);

  const body = {
    // number | A unique integer value identifying this course file.
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

| Name   | Type     | Description                                          | Notes                     |
| ------ | -------- | ---------------------------------------------------- | ------------------------- |
| **id** | `number` | A unique integer value identifying this course file. | [Defaults to `undefined`] |

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

> Array&lt;CourseFile&gt; list()

List course files. Requires ?course&#x3D;&lt;id&gt; query parameter. Returns files for courses where the user is a member.

### Example

```ts
import { Configuration, CourseFilesApi } from '';
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
  const api = new CourseFilesApi(config);

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

[**Array&lt;CourseFile&gt;**](CourseFile.md)

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

> CourseFile partialUpdate(id, patchedCourseFile)

ViewSet for CourseFile objects. CourseFiles are files that belong to courses (e.g., syllabi, course resources, etc.). list: Return a list of all course files for a given course (requires ?course&#x3D;&lt;id&gt; parameter). create: Create a new course file. retrieve: Return the given course file. update: Update a course file. partial_update: Partially update a course file. delete: Delete a course file.

### Example

```ts
import {
  Configuration,
  CourseFilesApi,
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
  const api = new CourseFilesApi(config);

  const body = {
    // number | A unique integer value identifying this course file.
    id: 56,
    // PatchedCourseFile (optional)
    patchedCourseFile: ...,
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

| Name                  | Type                                      | Description                                          | Notes                     |
| --------------------- | ----------------------------------------- | ---------------------------------------------------- | ------------------------- |
| **id**                | `number`                                  | A unique integer value identifying this course file. | [Defaults to `undefined`] |
| **patchedCourseFile** | [PatchedCourseFile](PatchedCourseFile.md) |                                                      | [Optional]                |

### Return type

[**CourseFile**](CourseFile.md)

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

> CourseFile retrieve(id)

ViewSet for CourseFile objects. CourseFiles are files that belong to courses (e.g., syllabi, course resources, etc.). list: Return a list of all course files for a given course (requires ?course&#x3D;&lt;id&gt; parameter). create: Create a new course file. retrieve: Return the given course file. update: Update a course file. partial_update: Partially update a course file. delete: Delete a course file.

### Example

```ts
import { Configuration, CourseFilesApi } from '';
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
  const api = new CourseFilesApi(config);

  const body = {
    // number | A unique integer value identifying this course file.
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

| Name   | Type     | Description                                          | Notes                     |
| ------ | -------- | ---------------------------------------------------- | ------------------------- |
| **id** | `number` | A unique integer value identifying this course file. | [Defaults to `undefined`] |

### Return type

[**CourseFile**](CourseFile.md)

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

> CourseFile update(id, courseFile)

ViewSet for CourseFile objects. CourseFiles are files that belong to courses (e.g., syllabi, course resources, etc.). list: Return a list of all course files for a given course (requires ?course&#x3D;&lt;id&gt; parameter). create: Create a new course file. retrieve: Return the given course file. update: Update a course file. partial_update: Partially update a course file. delete: Delete a course file.

### Example

```ts
import {
  Configuration,
  CourseFilesApi,
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
  const api = new CourseFilesApi(config);

  const body = {
    // number | A unique integer value identifying this course file.
    id: 56,
    // CourseFile
    courseFile: ...,
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

| Name           | Type                        | Description                                          | Notes                     |
| -------------- | --------------------------- | ---------------------------------------------------- | ------------------------- |
| **id**         | `number`                    | A unique integer value identifying this course file. | [Defaults to `undefined`] |
| **courseFile** | [CourseFile](CourseFile.md) |                                                      |                           |

### Return type

[**CourseFile**](CourseFile.md)

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
