# SectionsApi

All URIs are relative to _http://localhost_

| Method                                                | HTTP request                        | Description |
| ----------------------------------------------------- | ----------------------------------- | ----------- |
| [**create**](SectionsApi.md#create)                   | **POST** /sections/                 |             |
| [**destroy**](SectionsApi.md#destroy)                 | **DELETE** /sections/{id}/          |             |
| [**list**](SectionsApi.md#list)                       | **GET** /sections/                  |             |
| [**partialUpdate**](SectionsApi.md#partialupdate)     | **PATCH** /sections/{id}/           |             |
| [**retrieve**](SectionsApi.md#retrieve)               | **GET** /sections/{id}/             |             |
| [**submissionsList**](SectionsApi.md#submissionslist) | **GET** /sections/{id}/submissions/ |             |
| [**update**](SectionsApi.md#update)                   | **PUT** /sections/{id}/             |             |

## create

> Section create(section)

list: Return a list of all the sections. create: Create a new section. retrieve: Return the given section. update: Update a section. partial_update: Update a section. delete: Delete a section.

### Example

```ts
import {
  Configuration,
  SectionsApi,
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
  const api = new SectionsApi(config);

  const body = {
    // Section
    section: ...,
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

| Name        | Type                  | Description | Notes |
| ----------- | --------------------- | ----------- | ----- |
| **section** | [Section](Section.md) |             |       |

### Return type

[**Section**](Section.md)

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

list: Return a list of all the sections. create: Create a new section. retrieve: Return the given section. update: Update a section. partial_update: Update a section. delete: Delete a section.

### Example

```ts
import { Configuration, SectionsApi } from '';
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
  const api = new SectionsApi(config);

  const body = {
    // number | A unique integer value identifying this section.
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

| Name   | Type     | Description                                      | Notes                     |
| ------ | -------- | ------------------------------------------------ | ------------------------- |
| **id** | `number` | A unique integer value identifying this section. | [Defaults to `undefined`] |

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

> Array&lt;Section&gt; list()

list: Return a list of all the sections. create: Create a new section. retrieve: Return the given section. update: Update a section. partial_update: Update a section. delete: Delete a section.

### Example

```ts
import { Configuration, SectionsApi } from '';
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
  const api = new SectionsApi(config);

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

[**Array&lt;Section&gt;**](Section.md)

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

> Section partialUpdate(id, patchedSection)

list: Return a list of all the sections. create: Create a new section. retrieve: Return the given section. update: Update a section. partial_update: Update a section. delete: Delete a section.

### Example

```ts
import {
  Configuration,
  SectionsApi,
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
  const api = new SectionsApi(config);

  const body = {
    // number | A unique integer value identifying this section.
    id: 56,
    // PatchedSection (optional)
    patchedSection: ...,
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

| Name               | Type                                | Description                                      | Notes                     |
| ------------------ | ----------------------------------- | ------------------------------------------------ | ------------------------- |
| **id**             | `number`                            | A unique integer value identifying this section. | [Defaults to `undefined`] |
| **patchedSection** | [PatchedSection](PatchedSection.md) |                                                  | [Optional]                |

### Return type

[**Section**](Section.md)

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

> Section retrieve(id)

list: Return a list of all the sections. create: Create a new section. retrieve: Return the given section. update: Update a section. partial_update: Update a section. delete: Delete a section.

### Example

```ts
import { Configuration, SectionsApi } from '';
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
  const api = new SectionsApi(config);

  const body = {
    // number | A unique integer value identifying this section.
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

| Name   | Type     | Description                                      | Notes                     |
| ------ | -------- | ------------------------------------------------ | ------------------------- |
| **id** | `number` | A unique integer value identifying this section. | [Defaults to `undefined`] |

### Return type

[**Section**](Section.md)

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

## submissionsList

> Array&lt;Submission&gt; submissionsList(assignment, id)

Grab submissions corresponding to students in a section

### Example

```ts
import { Configuration, SectionsApi } from '';
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
    // To configure API key authorization: courseKeyAuth
    apiKey: 'YOUR API KEY',
  });
  const api = new SectionsApi(config);

  const body = {
    // number
    assignment: 56,
    // number | A unique integer value identifying this section.
    id: 56,
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

| Name           | Type     | Description                                      | Notes                     |
| -------------- | -------- | ------------------------------------------------ | ------------------------- |
| **assignment** | `number` |                                                  | [Defaults to `undefined`] |
| **id**         | `number` | A unique integer value identifying this section. | [Defaults to `undefined`] |

### Return type

[**Array&lt;Submission&gt;**](Submission.md)

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

> Section update(id, section)

list: Return a list of all the sections. create: Create a new section. retrieve: Return the given section. update: Update a section. partial_update: Update a section. delete: Delete a section.

### Example

```ts
import {
  Configuration,
  SectionsApi,
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
  const api = new SectionsApi(config);

  const body = {
    // number | A unique integer value identifying this section.
    id: 56,
    // Section
    section: ...,
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

| Name        | Type                  | Description                                      | Notes                     |
| ----------- | --------------------- | ------------------------------------------------ | ------------------------- |
| **id**      | `number`              | A unique integer value identifying this section. | [Defaults to `undefined`] |
| **section** | [Section](Section.md) |                                                  |                           |

### Return type

[**Section**](Section.md)

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
