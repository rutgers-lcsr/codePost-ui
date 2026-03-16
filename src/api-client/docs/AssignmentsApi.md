# AssignmentsApi

All URIs are relative to _http://localhost_

| Method                                                                           | HTTP request                                   | Description |
| -------------------------------------------------------------------------------- | ---------------------------------------------- | ----------- |
| [**beforeStudentUploadRetrieve**](AssignmentsApi.md#beforestudentuploadretrieve) | **GET** /assignments/{id}/beforeStudentUpload/ |             |
| [**cloneCreate**](AssignmentsApi.md#clonecreate)                                 | **POST** /assignments/{id}/clone/              |             |
| [**commentsList**](AssignmentsApi.md#commentslist)                               | **GET** /assignments/{id}/comments/            |             |
| [**create**](AssignmentsApi.md#create)                                           | **POST** /assignments/                         |             |
| [**datasetsList**](AssignmentsApi.md#datasetslist)                               | **GET** /assignments/{id}/datasets/            |             |
| [**destroy**](AssignmentsApi.md#destroy)                                         | **DELETE** /assignments/{id}/                  |             |
| [**downloadRetrieve**](AssignmentsApi.md#downloadretrieve)                       | **GET** /assignments/{id}/download/            |             |
| [**drawUnassignedList**](AssignmentsApi.md#drawunassignedlist)                   | **GET** /assignments/{id}/drawUnassigned/      |             |
| [**generateTestCreate**](AssignmentsApi.md#generatetestcreate)                   | **POST** /assignments/{id}/generateTest/       |             |
| [**list**](AssignmentsApi.md#list)                                               | **GET** /assignments/                          |             |
| [**partialUpdate**](AssignmentsApi.md#partialupdate)                             | **PATCH** /assignments/{id}/                   |             |
| [**queueLengthRetrieve**](AssignmentsApi.md#queuelengthretrieve)                 | **GET** /assignments/{id}/queueLength/         |             |
| [**retrieve**](AssignmentsApi.md#retrieve)                                       | **GET** /assignments/{id}/                     |             |
| [**rubricRetrieve**](AssignmentsApi.md#rubricretrieve)                           | **GET** /assignments/{id}/rubric/              |             |
| [**studentTestsRetrieve**](AssignmentsApi.md#studenttestsretrieve)               | **GET** /assignments/{id}/studentTests/        |             |
| [**studentUploadCreate**](AssignmentsApi.md#studentuploadcreate)                 | **POST** /assignments/{id}/studentUpload/      |             |
| [**studentUploadPartialUpdate**](AssignmentsApi.md#studentuploadpartialupdate)   | **PATCH** /assignments/{id}/studentUpload/     |             |
| [**studentUploadRetrieve**](AssignmentsApi.md#studentuploadretrieve)             | **GET** /assignments/{id}/studentUpload/       |             |
| [**submissionHistoriesList**](AssignmentsApi.md#submissionhistorieslist)         | **GET** /assignments/{id}/submissionHistories/ |             |
| [**submissionTestsList**](AssignmentsApi.md#submissiontestslist)                 | **GET** /assignments/{id}/submissionTests/     |             |
| [**submissionsList**](AssignmentsApi.md#submissionslist)                         | **GET** /assignments/{id}/submissions/         |             |
| [**update**](AssignmentsApi.md#update)                                           | **PUT** /assignments/{id}/                     |             |

## beforeStudentUploadRetrieve

> BeforeStudentUploadResponse beforeStudentUploadRetrieve(id)

Get submission upload information return { \&quot;daysLate\&quot;: 3, \&quot;pointsOff\&quot;: 0, \&quot;lateDayCreditsAvailable\&quot;: 2, \&quot;lateDayCreditsToUse\&quot;: 2, \&quot;adjustedDaysLate\&quot;: 0 }

### Example

```ts
import { Configuration, AssignmentsApi } from '';
import type { BeforeStudentUploadRetrieveRequest } from '';

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
  const api = new AssignmentsApi(config);

  const body = {
    // number | A unique integer value identifying this assignment.
    id: 56,
  } satisfies BeforeStudentUploadRetrieveRequest;

  try {
    const data = await api.beforeStudentUploadRetrieve(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name   | Type     | Description                                         | Notes                     |
| ------ | -------- | --------------------------------------------------- | ------------------------- |
| **id** | `number` | A unique integer value identifying this assignment. | [Defaults to `undefined`] |

### Return type

[**BeforeStudentUploadResponse**](BeforeStudentUploadResponse.md)

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

## cloneCreate

> Assignment cloneCreate(id, assignmentClone)

Clone an assignment to a course

### Example

```ts
import {
  Configuration,
  AssignmentsApi,
} from '';
import type { CloneCreateRequest } from '';

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
  const api = new AssignmentsApi(config);

  const body = {
    // number | A unique integer value identifying this assignment.
    id: 56,
    // AssignmentClone
    assignmentClone: ...,
  } satisfies CloneCreateRequest;

  try {
    const data = await api.cloneCreate(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                | Type                                  | Description                                         | Notes                     |
| ------------------- | ------------------------------------- | --------------------------------------------------- | ------------------------- |
| **id**              | `number`                              | A unique integer value identifying this assignment. | [Defaults to `undefined`] |
| **assignmentClone** | [AssignmentClone](AssignmentClone.md) |                                                     |                           |

### Return type

[**Assignment**](Assignment.md)

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

## commentsList

> Array&lt;Comment&gt; commentsList(id)

Grab all custom comments applied to submissions for this assignment, possibly filtered by author FIXME: we should make this endpoint more generic by optionally filtering based on .rubricComment, instead of filtering out comments s.t. rubricComment &#x3D; None by default.

### Example

```ts
import { Configuration, AssignmentsApi } from '';
import type { CommentsListRequest } from '';

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
  const api = new AssignmentsApi(config);

  const body = {
    // number | A unique integer value identifying this assignment.
    id: 56,
  } satisfies CommentsListRequest;

  try {
    const data = await api.commentsList(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name   | Type     | Description                                         | Notes                     |
| ------ | -------- | --------------------------------------------------- | ------------------------- |
| **id** | `number` | A unique integer value identifying this assignment. | [Defaults to `undefined`] |

### Return type

[**Array&lt;Comment&gt;**](Comment.md)

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

## create

> Assignment create(assignment)

list: Return a list of all the assignments. create: Create a new assignment instance. retrieve: Return the given assignment. update: Update an assignment. partial_update: Update an assignment. delete: Delete an assignment

### Example

```ts
import {
  Configuration,
  AssignmentsApi,
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
  const api = new AssignmentsApi(config);

  const body = {
    // Assignment
    assignment: ...,
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
| **assignment** | [Assignment](Assignment.md) |             |       |

### Return type

[**Assignment**](Assignment.md)

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

## datasetsList

> Array&lt;AssignmentDataSet&gt; datasetsList(id)

Return all datasets for this assignment GET /api/assignments/{id}/datasets/

### Example

```ts
import { Configuration, AssignmentsApi } from '';
import type { DatasetsListRequest } from '';

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
  const api = new AssignmentsApi(config);

  const body = {
    // number | A unique integer value identifying this assignment.
    id: 56,
  } satisfies DatasetsListRequest;

  try {
    const data = await api.datasetsList(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name   | Type     | Description                                         | Notes                     |
| ------ | -------- | --------------------------------------------------- | ------------------------- |
| **id** | `number` | A unique integer value identifying this assignment. | [Defaults to `undefined`] |

### Return type

[**Array&lt;AssignmentDataSet&gt;**](AssignmentDataSet.md)

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

## destroy

> destroy(id)

list: Return a list of all the assignments. create: Create a new assignment instance. retrieve: Return the given assignment. update: Update an assignment. partial_update: Update an assignment. delete: Delete an assignment

### Example

```ts
import { Configuration, AssignmentsApi } from '';
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
  const api = new AssignmentsApi(config);

  const body = {
    // number | A unique integer value identifying this assignment.
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

| Name   | Type     | Description                                         | Notes                     |
| ------ | -------- | --------------------------------------------------- | ------------------------- |
| **id** | `number` | A unique integer value identifying this assignment. | [Defaults to `undefined`] |

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

## downloadRetrieve

> AssignmentDownloadResponse downloadRetrieve(id)

download all files for an assignment files as a zip

### Example

```ts
import { Configuration, AssignmentsApi } from '';
import type { DownloadRetrieveRequest } from '';

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
  const api = new AssignmentsApi(config);

  const body = {
    // number | A unique integer value identifying this assignment.
    id: 56,
  } satisfies DownloadRetrieveRequest;

  try {
    const data = await api.downloadRetrieve(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name   | Type     | Description                                         | Notes                     |
| ------ | -------- | --------------------------------------------------- | ------------------------- |
| **id** | `number` | A unique integer value identifying this assignment. | [Defaults to `undefined`] |

### Return type

[**AssignmentDownloadResponse**](AssignmentDownloadResponse.md)

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

## drawUnassignedList

> Array&lt;Submission&gt; drawUnassignedList(id)

Get the next unassigned submission for this submission.

### Example

```ts
import { Configuration, AssignmentsApi } from '';
import type { DrawUnassignedListRequest } from '';

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
  const api = new AssignmentsApi(config);

  const body = {
    // number | A unique integer value identifying this assignment.
    id: 56,
  } satisfies DrawUnassignedListRequest;

  try {
    const data = await api.drawUnassignedList(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name   | Type     | Description                                         | Notes                     |
| ------ | -------- | --------------------------------------------------- | ------------------------- |
| **id** | `number` | A unique integer value identifying this assignment. | [Defaults to `undefined`] |

### Return type

[**Array&lt;Submission&gt;**](Submission.md)

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

## generateTestCreate

> AssignmentGenerateTestResponse generateTestCreate(id, assignmentGenerateTest)

Generate an AI-powered test script for a file in this assignment. Request body: - target_filename: str (required) - Name of the file to test (e.g., \&#39;main.py\&#39;) - context_file_id: int (optional) - ID of an AssignmentFile to use as context (Solution/Starter) - context_file_name: str (optional) - Name of an AssignmentFile (if ID not provided) - language: str (optional) - Target language (python, java, etc.)

### Example

```ts
import {
  Configuration,
  AssignmentsApi,
} from '';
import type { GenerateTestCreateRequest } from '';

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
  const api = new AssignmentsApi(config);

  const body = {
    // number | A unique integer value identifying this assignment.
    id: 56,
    // AssignmentGenerateTest
    assignmentGenerateTest: ...,
  } satisfies GenerateTestCreateRequest;

  try {
    const data = await api.generateTestCreate(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                       | Type                                                | Description                                         | Notes                     |
| -------------------------- | --------------------------------------------------- | --------------------------------------------------- | ------------------------- |
| **id**                     | `number`                                            | A unique integer value identifying this assignment. | [Defaults to `undefined`] |
| **assignmentGenerateTest** | [AssignmentGenerateTest](AssignmentGenerateTest.md) |                                                     |                           |

### Return type

[**AssignmentGenerateTestResponse**](AssignmentGenerateTestResponse.md)

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

## list

> Array&lt;Assignment&gt; list()

list: Return a list of all the assignments. create: Create a new assignment instance. retrieve: Return the given assignment. update: Update an assignment. partial_update: Update an assignment. delete: Delete an assignment

### Example

```ts
import { Configuration, AssignmentsApi } from '';
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
  const api = new AssignmentsApi(config);

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

[**Array&lt;Assignment&gt;**](Assignment.md)

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

> Assignment partialUpdate(id, patchedAssignment)

list: Return a list of all the assignments. create: Create a new assignment instance. retrieve: Return the given assignment. update: Update an assignment. partial_update: Update an assignment. delete: Delete an assignment

### Example

```ts
import {
  Configuration,
  AssignmentsApi,
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
  const api = new AssignmentsApi(config);

  const body = {
    // number | A unique integer value identifying this assignment.
    id: 56,
    // PatchedAssignment (optional)
    patchedAssignment: ...,
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

| Name                  | Type                                      | Description                                         | Notes                     |
| --------------------- | ----------------------------------------- | --------------------------------------------------- | ------------------------- |
| **id**                | `number`                                  | A unique integer value identifying this assignment. | [Defaults to `undefined`] |
| **patchedAssignment** | [PatchedAssignment](PatchedAssignment.md) |                                                     | [Optional]                |

### Return type

[**Assignment**](Assignment.md)

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

## queueLengthRetrieve

> AssignmentQueueLengthResponse queueLengthRetrieve(id)

Show the rubric for this assignment.

### Example

```ts
import { Configuration, AssignmentsApi } from '';
import type { QueueLengthRetrieveRequest } from '';

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
  const api = new AssignmentsApi(config);

  const body = {
    // number | A unique integer value identifying this assignment.
    id: 56,
  } satisfies QueueLengthRetrieveRequest;

  try {
    const data = await api.queueLengthRetrieve(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name   | Type     | Description                                         | Notes                     |
| ------ | -------- | --------------------------------------------------- | ------------------------- |
| **id** | `number` | A unique integer value identifying this assignment. | [Defaults to `undefined`] |

### Return type

[**AssignmentQueueLengthResponse**](AssignmentQueueLengthResponse.md)

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

## retrieve

> Assignment retrieve(id)

list: Return a list of all the assignments. create: Create a new assignment instance. retrieve: Return the given assignment. update: Update an assignment. partial_update: Update an assignment. delete: Delete an assignment

### Example

```ts
import { Configuration, AssignmentsApi } from '';
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
  const api = new AssignmentsApi(config);

  const body = {
    // number | A unique integer value identifying this assignment.
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

| Name   | Type     | Description                                         | Notes                     |
| ------ | -------- | --------------------------------------------------- | ------------------------- |
| **id** | `number` | A unique integer value identifying this assignment. | [Defaults to `undefined`] |

### Return type

[**Assignment**](Assignment.md)

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

## rubricRetrieve

> AssignmentRubricResponse rubricRetrieve(id)

Show the rubric for this assignment.

### Example

```ts
import { Configuration, AssignmentsApi } from '';
import type { RubricRetrieveRequest } from '';

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
  const api = new AssignmentsApi(config);

  const body = {
    // number | A unique integer value identifying this assignment.
    id: 56,
  } satisfies RubricRetrieveRequest;

  try {
    const data = await api.rubricRetrieve(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name   | Type     | Description                                         | Notes                     |
| ------ | -------- | --------------------------------------------------- | ------------------------- |
| **id** | `number` | A unique integer value identifying this assignment. | [Defaults to `undefined`] |

### Return type

[**AssignmentRubricResponse**](AssignmentRubricResponse.md)

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

## studentTestsRetrieve

> AssignmentStudentTestsResponse studentTestsRetrieve(id)

list: Return a list of all the assignments. create: Create a new assignment instance. retrieve: Return the given assignment. update: Update an assignment. partial_update: Update an assignment. delete: Delete an assignment

### Example

```ts
import { Configuration, AssignmentsApi } from '';
import type { StudentTestsRetrieveRequest } from '';

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
  const api = new AssignmentsApi(config);

  const body = {
    // number | A unique integer value identifying this assignment.
    id: 56,
  } satisfies StudentTestsRetrieveRequest;

  try {
    const data = await api.studentTestsRetrieve(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name   | Type     | Description                                         | Notes                     |
| ------ | -------- | --------------------------------------------------- | ------------------------- |
| **id** | `number` | A unique integer value identifying this assignment. | [Defaults to `undefined`] |

### Return type

[**AssignmentStudentTestsResponse**](AssignmentStudentTestsResponse.md)

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

## studentUploadCreate

> StudentSubmission studentUploadCreate(id, assignment)

Upload of submission to an assignment TODO: add file limits to 10mb

### Example

```ts
import {
  Configuration,
  AssignmentsApi,
} from '';
import type { StudentUploadCreateRequest } from '';

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
  const api = new AssignmentsApi(config);

  const body = {
    // number | A unique integer value identifying this assignment.
    id: 56,
    // Assignment
    assignment: ...,
  } satisfies StudentUploadCreateRequest;

  try {
    const data = await api.studentUploadCreate(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name           | Type                        | Description                                         | Notes                     |
| -------------- | --------------------------- | --------------------------------------------------- | ------------------------- |
| **id**         | `number`                    | A unique integer value identifying this assignment. | [Defaults to `undefined`] |
| **assignment** | [Assignment](Assignment.md) |                                                     |                           |

### Return type

[**StudentSubmission**](StudentSubmission.md)

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

## studentUploadPartialUpdate

> StudentSubmission studentUploadPartialUpdate(id, patchedAssignment)

Upload of submission to an assignment TODO: add file limits to 10mb

### Example

```ts
import {
  Configuration,
  AssignmentsApi,
} from '';
import type { StudentUploadPartialUpdateRequest } from '';

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
  const api = new AssignmentsApi(config);

  const body = {
    // number | A unique integer value identifying this assignment.
    id: 56,
    // PatchedAssignment (optional)
    patchedAssignment: ...,
  } satisfies StudentUploadPartialUpdateRequest;

  try {
    const data = await api.studentUploadPartialUpdate(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                  | Type                                      | Description                                         | Notes                     |
| --------------------- | ----------------------------------------- | --------------------------------------------------- | ------------------------- |
| **id**                | `number`                                  | A unique integer value identifying this assignment. | [Defaults to `undefined`] |
| **patchedAssignment** | [PatchedAssignment](PatchedAssignment.md) |                                                     | [Optional]                |

### Return type

[**StudentSubmission**](StudentSubmission.md)

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

## studentUploadRetrieve

> AssignmentStudentUploadGetResponse studentUploadRetrieve(id)

Upload of submission to an assignment TODO: add file limits to 10mb

### Example

```ts
import { Configuration, AssignmentsApi } from '';
import type { StudentUploadRetrieveRequest } from '';

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
  const api = new AssignmentsApi(config);

  const body = {
    // number | A unique integer value identifying this assignment.
    id: 56,
  } satisfies StudentUploadRetrieveRequest;

  try {
    const data = await api.studentUploadRetrieve(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name   | Type     | Description                                         | Notes                     |
| ------ | -------- | --------------------------------------------------- | ------------------------- |
| **id** | `number` | A unique integer value identifying this assignment. | [Defaults to `undefined`] |

### Return type

[**AssignmentStudentUploadGetResponse**](AssignmentStudentUploadGetResponse.md)

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

## submissionHistoriesList

> PaginatedSubmissionHistoryList submissionHistoriesList(id, page, pageSize)

list: Return a list of all the assignments. create: Create a new assignment instance. retrieve: Return the given assignment. update: Update an assignment. partial_update: Update an assignment. delete: Delete an assignment

### Example

```ts
import { Configuration, AssignmentsApi } from '';
import type { SubmissionHistoriesListRequest } from '';

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
  const api = new AssignmentsApi(config);

  const body = {
    // number | A unique integer value identifying this assignment.
    id: 56,
    // number | A page number within the paginated result set. (optional)
    page: 56,
    // number | Number of results to return per page. (optional)
    pageSize: 56,
  } satisfies SubmissionHistoriesListRequest;

  try {
    const data = await api.submissionHistoriesList(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name         | Type     | Description                                         | Notes                                |
| ------------ | -------- | --------------------------------------------------- | ------------------------------------ |
| **id**       | `number` | A unique integer value identifying this assignment. | [Defaults to `undefined`]            |
| **page**     | `number` | A page number within the paginated result set.      | [Optional] [Defaults to `undefined`] |
| **pageSize** | `number` | Number of results to return per page.               | [Optional] [Defaults to `undefined`] |

### Return type

[**PaginatedSubmissionHistoryList**](PaginatedSubmissionHistoryList.md)

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

## submissionTestsList

> PaginatedSubmissionWithTestsList submissionTestsList(id, page, pageSize)

Gets a paginated list of submission tests for an assignment. We use this for performance for large courses to fetch all submission tests. Fetching thousands of requests from the client can cause some to fail. Returns a list of {id: int, tests: SubmissionTest[]}

### Example

```ts
import { Configuration, AssignmentsApi } from '';
import type { SubmissionTestsListRequest } from '';

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
  const api = new AssignmentsApi(config);

  const body = {
    // number | A unique integer value identifying this assignment.
    id: 56,
    // number | A page number within the paginated result set. (optional)
    page: 56,
    // number | Number of results to return per page. (optional)
    pageSize: 56,
  } satisfies SubmissionTestsListRequest;

  try {
    const data = await api.submissionTestsList(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name         | Type     | Description                                         | Notes                                |
| ------------ | -------- | --------------------------------------------------- | ------------------------------------ |
| **id**       | `number` | A unique integer value identifying this assignment. | [Defaults to `undefined`]            |
| **page**     | `number` | A page number within the paginated result set.      | [Optional] [Defaults to `undefined`] |
| **pageSize** | `number` | Number of results to return per page.               | [Optional] [Defaults to `undefined`] |

### Return type

[**PaginatedSubmissionWithTestsList**](PaginatedSubmissionWithTestsList.md)

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

## submissionsList

> PaginatedSubmissionList submissionsList(id, compact, grader, page, pageSize, student)

Return a (optionally filtered) list of submissions whose parent is the requested assignment.

### Example

```ts
import { Configuration, AssignmentsApi } from '';
import type { SubmissionsListRequest } from '';

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
  const api = new AssignmentsApi(config);

  const body = {
    // number | A unique integer value identifying this assignment.
    id: 56,
    // string | If set to \'1\', return submissions without nested file data. (optional)
    compact: compact_example,
    // string | Filter submissions by grader email. (optional)
    grader: grader_example,
    // number | A page number within the paginated result set. (optional)
    page: 56,
    // number | Number of results to return per page. (optional)
    pageSize: 56,
    // string | Filter submissions by student email. (optional)
    student: student_example,
  } satisfies SubmissionsListRequest;

  try {
    const data = await api.submissionsList(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name         | Type     | Description                                                           | Notes                                |
| ------------ | -------- | --------------------------------------------------------------------- | ------------------------------------ |
| **id**       | `number` | A unique integer value identifying this assignment.                   | [Defaults to `undefined`]            |
| **compact**  | `string` | If set to \&#39;1\&#39;, return submissions without nested file data. | [Optional] [Defaults to `undefined`] |
| **grader**   | `string` | Filter submissions by grader email.                                   | [Optional] [Defaults to `undefined`] |
| **page**     | `number` | A page number within the paginated result set.                        | [Optional] [Defaults to `undefined`] |
| **pageSize** | `number` | Number of results to return per page.                                 | [Optional] [Defaults to `undefined`] |
| **student**  | `string` | Filter submissions by student email.                                  | [Optional] [Defaults to `undefined`] |

### Return type

[**PaginatedSubmissionList**](PaginatedSubmissionList.md)

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

> Assignment update(id, assignment)

list: Return a list of all the assignments. create: Create a new assignment instance. retrieve: Return the given assignment. update: Update an assignment. partial_update: Update an assignment. delete: Delete an assignment

### Example

```ts
import {
  Configuration,
  AssignmentsApi,
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
  const api = new AssignmentsApi(config);

  const body = {
    // number | A unique integer value identifying this assignment.
    id: 56,
    // Assignment
    assignment: ...,
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

| Name           | Type                        | Description                                         | Notes                     |
| -------------- | --------------------------- | --------------------------------------------------- | ------------------------- |
| **id**         | `number`                    | A unique integer value identifying this assignment. | [Defaults to `undefined`] |
| **assignment** | [Assignment](Assignment.md) |                                                     |                           |

### Return type

[**Assignment**](Assignment.md)

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
