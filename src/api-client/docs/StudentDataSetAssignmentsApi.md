# StudentDataSetAssignmentsApi

All URIs are relative to *http://localhost*

| Method                                                             | HTTP request                               | Description |
| ------------------------------------------------------------------ | ------------------------------------------ | ----------- |
| [**list**](StudentDataSetAssignmentsApi.md#list)                   | **GET** /studentDataSetAssignments/        |             |
| [**partialUpdate**](StudentDataSetAssignmentsApi.md#partialupdate) | **PATCH** /studentDataSetAssignments/{id}/ |             |
| [**retrieve**](StudentDataSetAssignmentsApi.md#retrieve)           | **GET** /studentDataSetAssignments/{id}/   |             |

## list

> Array&lt;StudentDataSetAssignment&gt; list(assignment)

list: mappings for one assignment (?assignment&#x3D;&lt;id&gt;, required). partial_update: override a student\&#39;s assigned variant.

### Example

```ts
import { Configuration, StudentDataSetAssignmentsApi } from '';
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
  const api = new StudentDataSetAssignmentsApi(config);

  const body = {
    // number | The assignment whose dataset-variant mappings to list.
    assignment: 56,
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

| Name           | Type     | Description                                            | Notes                     |
| -------------- | -------- | ------------------------------------------------------ | ------------------------- |
| **assignment** | `number` | The assignment whose dataset-variant mappings to list. | [Defaults to `undefined`] |

### Return type

[**Array&lt;StudentDataSetAssignment&gt;**](StudentDataSetAssignment.md)

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

> StudentDataSetAssignment partialUpdate(id, patchedStudentDataSetAssignment)

list: mappings for one assignment (?assignment&#x3D;&lt;id&gt;, required). partial_update: override a student\&#39;s assigned variant.

### Example

```ts
import {
  Configuration,
  StudentDataSetAssignmentsApi,
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
  const api = new StudentDataSetAssignmentsApi(config);

  const body = {
    // number | A unique integer value identifying this student data set assignment.
    id: 56,
    // PatchedStudentDataSetAssignment (optional)
    patchedStudentDataSetAssignment: ...,
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

| Name                                | Type                                                                  | Description                                                          | Notes                     |
| ----------------------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------- |
| **id**                              | `number`                                                              | A unique integer value identifying this student data set assignment. | [Defaults to `undefined`] |
| **patchedStudentDataSetAssignment** | [PatchedStudentDataSetAssignment](PatchedStudentDataSetAssignment.md) |                                                                      | [Optional]                |

### Return type

[**StudentDataSetAssignment**](StudentDataSetAssignment.md)

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

> StudentDataSetAssignment retrieve(id)

list: mappings for one assignment (?assignment&#x3D;&lt;id&gt;, required). partial_update: override a student\&#39;s assigned variant.

### Example

```ts
import { Configuration, StudentDataSetAssignmentsApi } from '';
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
  const api = new StudentDataSetAssignmentsApi(config);

  const body = {
    // number | A unique integer value identifying this student data set assignment.
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

| Name   | Type     | Description                                                          | Notes                     |
| ------ | -------- | -------------------------------------------------------------------- | ------------------------- |
| **id** | `number` | A unique integer value identifying this student data set assignment. | [Defaults to `undefined`] |

### Return type

[**StudentDataSetAssignment**](StudentDataSetAssignment.md)

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
