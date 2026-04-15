# AssignmentDataSetsApi

All URIs are relative to _http://localhost_

| Method                                                                    | HTTP request                               | Description |
| ------------------------------------------------------------------------- | ------------------------------------------ | ----------- |
| [**byAssignmentRetrieve**](AssignmentDataSetsApi.md#byassignmentretrieve) | **GET** /assignmentDataSets/by_assignment/ |             |
| [**create**](AssignmentDataSetsApi.md#create)                             | **POST** /assignmentDataSets/              |             |
| [**destroy**](AssignmentDataSetsApi.md#destroy)                           | **DELETE** /assignmentDataSets/{id}/       |             |
| [**downloadRetrieve**](AssignmentDataSetsApi.md#downloadretrieve)         | **GET** /assignmentDataSets/{id}/download/ |             |
| [**list**](AssignmentDataSetsApi.md#list)                                 | **GET** /assignmentDataSets/               |             |
| [**partialUpdate**](AssignmentDataSetsApi.md#partialupdate)               | **PATCH** /assignmentDataSets/{id}/        |             |
| [**retrieve**](AssignmentDataSetsApi.md#retrieve)                         | **GET** /assignmentDataSets/{id}/          |             |
| [**update**](AssignmentDataSetsApi.md#update)                             | **PUT** /assignmentDataSets/{id}/          |             |

## byAssignmentRetrieve

> AssignmentDataSet byAssignmentRetrieve()

List datasets for a specific assignment GET /assignments/datasets/by_assignment/?assignment_id&#x3D;123

### Example

```ts
import { Configuration, AssignmentDataSetsApi } from '';
import type { ByAssignmentRetrieveRequest } from '';

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
  const api = new AssignmentDataSetsApi(config);

  try {
    const data = await api.byAssignmentRetrieve();
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

[**AssignmentDataSet**](AssignmentDataSet.md)

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

## create

> AssignmentDataSetCreate create(assignment, name, file, description, mountPath, isActive, hidden, isTestResource)

Create a new dataset

### Example

```ts
import { Configuration, AssignmentDataSetsApi } from '';
import type { CreateRequest } from '';

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
  const api = new AssignmentDataSetsApi(config);

  const body = {
    // number | The related assignment_id.
    assignment: 56,
    // string | The name of the data set.
    name: name_example,
    // string | The data set file
    file: file_example,
    // string | Optional description of the data set. (optional)
    description: description_example,
    // string (optional)
    mountPath: mountPath_example,
    // boolean (optional)
    isActive: true,
    // boolean | If True, this dataset will be hidden from students. (optional)
    hidden: true,
    // boolean (optional)
    isTestResource: true,
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

| Name               | Type      | Description                                         | Notes                                |
| ------------------ | --------- | --------------------------------------------------- | ------------------------------------ |
| **assignment**     | `number`  | The related assignment_id.                          | [Defaults to `undefined`]            |
| **name**           | `string`  | The name of the data set.                           | [Defaults to `undefined`]            |
| **file**           | `string`  | The data set file                                   | [Defaults to `undefined`]            |
| **description**    | `string`  | Optional description of the data set.               | [Optional] [Defaults to `undefined`] |
| **mountPath**      | `string`  |                                                     | [Optional] [Defaults to `undefined`] |
| **isActive**       | `boolean` |                                                     | [Optional] [Defaults to `undefined`] |
| **hidden**         | `boolean` | If True, this dataset will be hidden from students. | [Optional] [Defaults to `undefined`] |
| **isTestResource** | `boolean` |                                                     | [Optional] [Defaults to `undefined`] |

### Return type

[**AssignmentDataSetCreate**](AssignmentDataSetCreate.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [courseKeyAuth](../README.md#courseKeyAuth)

### HTTP request headers

- **Content-Type**: `multipart/form-data`, `application/x-www-form-urlencoded`, `application/json`
- **Accept**: `application/json`

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **201**     |             | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## destroy

> destroy(id)

Delete a dataset

### Example

```ts
import { Configuration, AssignmentDataSetsApi } from '';
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
  const api = new AssignmentDataSetsApi(config);

  const body = {
    // number | A unique integer value identifying this assignment data set.
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

| Name   | Type     | Description                                                  | Notes                     |
| ------ | -------- | ------------------------------------------------------------ | ------------------------- |
| **id** | `number` | A unique integer value identifying this assignment data set. | [Defaults to `undefined`] |

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

## downloadRetrieve

> AssignmentDataSet downloadRetrieve(id)

Download the dataset file GET /assignments/datasets/{id}/download/

### Example

```ts
import { Configuration, AssignmentDataSetsApi } from '';
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
    // To configure API key authorization: courseKeyAuth
    apiKey: 'YOUR API KEY',
  });
  const api = new AssignmentDataSetsApi(config);

  const body = {
    // number | A unique integer value identifying this assignment data set.
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

| Name   | Type     | Description                                                  | Notes                     |
| ------ | -------- | ------------------------------------------------------------ | ------------------------- |
| **id** | `number` | A unique integer value identifying this assignment data set. | [Defaults to `undefined`] |

### Return type

[**AssignmentDataSet**](AssignmentDataSet.md)

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

## list

> Array&lt;AssignmentDataSet&gt; list()

ViewSet for managing assignment datasets Datasets are files (compressed or raw) that are mounted into the execution environment when students submit code or when code is executed via the API. Typical use case: Large training datasets for ML assignments

### Example

```ts
import { Configuration, AssignmentDataSetsApi } from '';
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
  const api = new AssignmentDataSetsApi(config);

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

[**Array&lt;AssignmentDataSet&gt;**](AssignmentDataSet.md)

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

> AssignmentDataSetUpdate partialUpdate(id, name, description, mountPath, isActive, isTestResource)

ViewSet for managing assignment datasets Datasets are files (compressed or raw) that are mounted into the execution environment when students submit code or when code is executed via the API. Typical use case: Large training datasets for ML assignments

### Example

```ts
import { Configuration, AssignmentDataSetsApi } from '';
import type { PartialUpdateRequest } from '';

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
  const api = new AssignmentDataSetsApi(config);

  const body = {
    // number | A unique integer value identifying this assignment data set.
    id: 56,
    // string | The name of the data set. (optional)
    name: name_example,
    // string | Optional description of the data set. (optional)
    description: description_example,
    // string (optional)
    mountPath: mountPath_example,
    // boolean (optional)
    isActive: true,
    // boolean (optional)
    isTestResource: true,
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

| Name               | Type      | Description                                                  | Notes                                |
| ------------------ | --------- | ------------------------------------------------------------ | ------------------------------------ |
| **id**             | `number`  | A unique integer value identifying this assignment data set. | [Defaults to `undefined`]            |
| **name**           | `string`  | The name of the data set.                                    | [Optional] [Defaults to `undefined`] |
| **description**    | `string`  | Optional description of the data set.                        | [Optional] [Defaults to `undefined`] |
| **mountPath**      | `string`  |                                                              | [Optional] [Defaults to `undefined`] |
| **isActive**       | `boolean` |                                                              | [Optional] [Defaults to `undefined`] |
| **isTestResource** | `boolean` |                                                              | [Optional] [Defaults to `undefined`] |

### Return type

[**AssignmentDataSetUpdate**](AssignmentDataSetUpdate.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [courseKeyAuth](../README.md#courseKeyAuth)

### HTTP request headers

- **Content-Type**: `multipart/form-data`, `application/x-www-form-urlencoded`, `application/json`
- **Accept**: `application/json`

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **200**     |             | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## retrieve

> AssignmentDataSet retrieve(id)

Get a single dataset

### Example

```ts
import { Configuration, AssignmentDataSetsApi } from '';
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
  const api = new AssignmentDataSetsApi(config);

  const body = {
    // number | A unique integer value identifying this assignment data set.
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

| Name   | Type     | Description                                                  | Notes                     |
| ------ | -------- | ------------------------------------------------------------ | ------------------------- |
| **id** | `number` | A unique integer value identifying this assignment data set. | [Defaults to `undefined`] |

### Return type

[**AssignmentDataSet**](AssignmentDataSet.md)

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

> AssignmentDataSetUpdate update(id, name, description, mountPath, isActive, isTestResource)

Update a dataset (metadata only, not file)

### Example

```ts
import { Configuration, AssignmentDataSetsApi } from '';
import type { UpdateRequest } from '';

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
  const api = new AssignmentDataSetsApi(config);

  const body = {
    // number | A unique integer value identifying this assignment data set.
    id: 56,
    // string | The name of the data set.
    name: name_example,
    // string | Optional description of the data set. (optional)
    description: description_example,
    // string (optional)
    mountPath: mountPath_example,
    // boolean (optional)
    isActive: true,
    // boolean (optional)
    isTestResource: true,
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

| Name               | Type      | Description                                                  | Notes                                |
| ------------------ | --------- | ------------------------------------------------------------ | ------------------------------------ |
| **id**             | `number`  | A unique integer value identifying this assignment data set. | [Defaults to `undefined`]            |
| **name**           | `string`  | The name of the data set.                                    | [Defaults to `undefined`]            |
| **description**    | `string`  | Optional description of the data set.                        | [Optional] [Defaults to `undefined`] |
| **mountPath**      | `string`  |                                                              | [Optional] [Defaults to `undefined`] |
| **isActive**       | `boolean` |                                                              | [Optional] [Defaults to `undefined`] |
| **isTestResource** | `boolean` |                                                              | [Optional] [Defaults to `undefined`] |

### Return type

[**AssignmentDataSetUpdate**](AssignmentDataSetUpdate.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [courseKeyAuth](../README.md#courseKeyAuth)

### HTTP request headers

- **Content-Type**: `multipart/form-data`, `application/x-www-form-urlencoded`, `application/json`
- **Accept**: `application/json`

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **200**     |             | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
