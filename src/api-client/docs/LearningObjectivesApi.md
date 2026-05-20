# LearningObjectivesApi

All URIs are relative to _http://localhost_

| Method                                                      | HTTP request                         | Description |
| ----------------------------------------------------------- | ------------------------------------ | ----------- |
| [**create**](LearningObjectivesApi.md#create)               | **POST** /learningObjectives/        |             |
| [**destroy**](LearningObjectivesApi.md#destroy)             | **DELETE** /learningObjectives/{id}/ |             |
| [**list**](LearningObjectivesApi.md#list)                   | **GET** /learningObjectives/         |             |
| [**partialUpdate**](LearningObjectivesApi.md#partialupdate) | **PATCH** /learningObjectives/{id}/  |             |
| [**retrieve**](LearningObjectivesApi.md#retrieve)           | **GET** /learningObjectives/{id}/    |             |
| [**update**](LearningObjectivesApi.md#update)               | **PUT** /learningObjectives/{id}/    |             |

## create

> LearningObjective create(learningObjective)

list: Return a list of all the learningObjectives. create: Create a new learningObjective. retrieve: Return the given learningObjective. update: Update a learningObjective. partial_update: Update a learningObjective. delete: Delete a learningObjective.

### Example

```ts
import {
  Configuration,
  LearningObjectivesApi,
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
  const api = new LearningObjectivesApi(config);

  const body = {
    // LearningObjective
    learningObjective: ...,
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

| Name                  | Type                                      | Description | Notes |
| --------------------- | ----------------------------------------- | ----------- | ----- |
| **learningObjective** | [LearningObjective](LearningObjective.md) |             |       |

### Return type

[**LearningObjective**](LearningObjective.md)

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

list: Return a list of all the learningObjectives. create: Create a new learningObjective. retrieve: Return the given learningObjective. update: Update a learningObjective. partial_update: Update a learningObjective. delete: Delete a learningObjective.

### Example

```ts
import { Configuration, LearningObjectivesApi } from '';
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
  const api = new LearningObjectivesApi(config);

  const body = {
    // number | A unique integer value identifying this learning objective.
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

| Name   | Type     | Description                                                 | Notes                     |
| ------ | -------- | ----------------------------------------------------------- | ------------------------- |
| **id** | `number` | A unique integer value identifying this learning objective. | [Defaults to `undefined`] |

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

> Array&lt;LearningObjective&gt; list()

list: Return a list of all the learningObjectives. create: Create a new learningObjective. retrieve: Return the given learningObjective. update: Update a learningObjective. partial_update: Update a learningObjective. delete: Delete a learningObjective.

### Example

```ts
import { Configuration, LearningObjectivesApi } from '';
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
  const api = new LearningObjectivesApi(config);

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

[**Array&lt;LearningObjective&gt;**](LearningObjective.md)

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

> LearningObjective partialUpdate(id, patchedLearningObjective)

list: Return a list of all the learningObjectives. create: Create a new learningObjective. retrieve: Return the given learningObjective. update: Update a learningObjective. partial_update: Update a learningObjective. delete: Delete a learningObjective.

### Example

```ts
import {
  Configuration,
  LearningObjectivesApi,
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
  const api = new LearningObjectivesApi(config);

  const body = {
    // number | A unique integer value identifying this learning objective.
    id: 56,
    // PatchedLearningObjective (optional)
    patchedLearningObjective: ...,
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

| Name                         | Type                                                    | Description                                                 | Notes                     |
| ---------------------------- | ------------------------------------------------------- | ----------------------------------------------------------- | ------------------------- |
| **id**                       | `number`                                                | A unique integer value identifying this learning objective. | [Defaults to `undefined`] |
| **patchedLearningObjective** | [PatchedLearningObjective](PatchedLearningObjective.md) |                                                             | [Optional]                |

### Return type

[**LearningObjective**](LearningObjective.md)

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

> LearningObjective retrieve(id)

list: Return a list of all the learningObjectives. create: Create a new learningObjective. retrieve: Return the given learningObjective. update: Update a learningObjective. partial_update: Update a learningObjective. delete: Delete a learningObjective.

### Example

```ts
import { Configuration, LearningObjectivesApi } from '';
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
  const api = new LearningObjectivesApi(config);

  const body = {
    // number | A unique integer value identifying this learning objective.
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

| Name   | Type     | Description                                                 | Notes                     |
| ------ | -------- | ----------------------------------------------------------- | ------------------------- |
| **id** | `number` | A unique integer value identifying this learning objective. | [Defaults to `undefined`] |

### Return type

[**LearningObjective**](LearningObjective.md)

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

> LearningObjective update(id, learningObjective)

list: Return a list of all the learningObjectives. create: Create a new learningObjective. retrieve: Return the given learningObjective. update: Update a learningObjective. partial_update: Update a learningObjective. delete: Delete a learningObjective.

### Example

```ts
import {
  Configuration,
  LearningObjectivesApi,
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
  const api = new LearningObjectivesApi(config);

  const body = {
    // number | A unique integer value identifying this learning objective.
    id: 56,
    // LearningObjective
    learningObjective: ...,
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

| Name                  | Type                                      | Description                                                 | Notes                     |
| --------------------- | ----------------------------------------- | ----------------------------------------------------------- | ------------------------- |
| **id**                | `number`                                  | A unique integer value identifying this learning objective. | [Defaults to `undefined`] |
| **learningObjective** | [LearningObjective](LearningObjective.md) |                                                             |                           |

### Return type

[**LearningObjective**](LearningObjective.md)

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
