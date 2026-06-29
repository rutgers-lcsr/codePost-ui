# QuizImagesApi

All URIs are relative to *http://localhost*

| Method                                              | HTTP request                 | Description |
| --------------------------------------------------- | ---------------------------- | ----------- |
| [**create**](QuizImagesApi.md#create)               | **POST** /quizImages/        |             |
| [**destroy**](QuizImagesApi.md#destroy)             | **DELETE** /quizImages/{id}/ |             |
| [**list**](QuizImagesApi.md#list)                   | **GET** /quizImages/         |             |
| [**partialUpdate**](QuizImagesApi.md#partialupdate) | **PATCH** /quizImages/{id}/  |             |
| [**retrieve**](QuizImagesApi.md#retrieve)           | **GET** /quizImages/{id}/    |             |
| [**update**](QuizImagesApi.md#update)               | **PUT** /quizImages/{id}/    |             |

## create

> QuizImage create(id, course, token, url, originalName, contentType, created)

Instructor-uploaded images for quiz/question/bank Markdown descriptions.

### Example

```ts
import {
  Configuration,
  QuizImagesApi,
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
  const api = new QuizImagesApi(config);

  const body = {
    // number
    id: 56,
    // number | The related course_id.
    course: 56,
    // string | Unguessable public token used in the image URL.
    token: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
    // string
    url: url_example,
    // string | Original filename.
    originalName: originalName_example,
    // string | Image MIME type.
    contentType: contentType_example,
    // string
    created: 2013-10-20T19:20:30+01:00,
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

| Name             | Type     | Description                                     | Notes                     |
| ---------------- | -------- | ----------------------------------------------- | ------------------------- |
| **id**           | `number` |                                                 | [Defaults to `undefined`] |
| **course**       | `number` | The related course_id.                          | [Defaults to `undefined`] |
| **token**        | `string` | Unguessable public token used in the image URL. | [Defaults to `undefined`] |
| **url**          | `string` |                                                 | [Defaults to `undefined`] |
| **originalName** | `string` | Original filename.                              | [Defaults to `undefined`] |
| **contentType**  | `string` | Image MIME type.                                | [Defaults to `undefined`] |
| **created**      | `string` |                                                 | [Defaults to `undefined`] |

### Return type

[**QuizImage**](QuizImage.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [courseKeyAuth](../README.md#courseKeyAuth)

### HTTP request headers

- **Content-Type**: `multipart/form-data`, `application/x-www-form-urlencoded`
- **Accept**: `application/json`

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **201**     |             | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## destroy

> destroy(id)

Instructor-uploaded images for quiz/question/bank Markdown descriptions.

### Example

```ts
import { Configuration, QuizImagesApi } from '';
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
  const api = new QuizImagesApi(config);

  const body = {
    // number | A unique integer value identifying this quiz image.
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
| **id** | `number` | A unique integer value identifying this quiz image. | [Defaults to `undefined`] |

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

> Array&lt;QuizImage&gt; list()

Instructor-uploaded images for quiz/question/bank Markdown descriptions.

### Example

```ts
import { Configuration, QuizImagesApi } from '';
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
  const api = new QuizImagesApi(config);

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

[**Array&lt;QuizImage&gt;**](QuizImage.md)

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

> QuizImage partialUpdate(id, id2, course, token, url, originalName, contentType, created)

Instructor-uploaded images for quiz/question/bank Markdown descriptions.

### Example

```ts
import {
  Configuration,
  QuizImagesApi,
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
  const api = new QuizImagesApi(config);

  const body = {
    // number | A unique integer value identifying this quiz image.
    id: 56,
    // number (optional)
    id2: 56,
    // number | The related course_id. (optional)
    course: 56,
    // string | Unguessable public token used in the image URL. (optional)
    token: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
    // string (optional)
    url: url_example,
    // string | Original filename. (optional)
    originalName: originalName_example,
    // string | Image MIME type. (optional)
    contentType: contentType_example,
    // string (optional)
    created: 2013-10-20T19:20:30+01:00,
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

| Name             | Type     | Description                                         | Notes                                |
| ---------------- | -------- | --------------------------------------------------- | ------------------------------------ |
| **id**           | `number` | A unique integer value identifying this quiz image. | [Defaults to `undefined`]            |
| **id2**          | `number` |                                                     | [Optional] [Defaults to `undefined`] |
| **course**       | `number` | The related course_id.                              | [Optional] [Defaults to `undefined`] |
| **token**        | `string` | Unguessable public token used in the image URL.     | [Optional] [Defaults to `undefined`] |
| **url**          | `string` |                                                     | [Optional] [Defaults to `undefined`] |
| **originalName** | `string` | Original filename.                                  | [Optional] [Defaults to `undefined`] |
| **contentType**  | `string` | Image MIME type.                                    | [Optional] [Defaults to `undefined`] |
| **created**      | `string` |                                                     | [Optional] [Defaults to `undefined`] |

### Return type

[**QuizImage**](QuizImage.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [courseKeyAuth](../README.md#courseKeyAuth)

### HTTP request headers

- **Content-Type**: `multipart/form-data`, `application/x-www-form-urlencoded`
- **Accept**: `application/json`

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **200**     |             | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## retrieve

> QuizImage retrieve(id)

Instructor-uploaded images for quiz/question/bank Markdown descriptions.

### Example

```ts
import { Configuration, QuizImagesApi } from '';
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
  const api = new QuizImagesApi(config);

  const body = {
    // number | A unique integer value identifying this quiz image.
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
| **id** | `number` | A unique integer value identifying this quiz image. | [Defaults to `undefined`] |

### Return type

[**QuizImage**](QuizImage.md)

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

> QuizImage update(id, id2, course, token, url, originalName, contentType, created)

Instructor-uploaded images for quiz/question/bank Markdown descriptions.

### Example

```ts
import {
  Configuration,
  QuizImagesApi,
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
  const api = new QuizImagesApi(config);

  const body = {
    // number | A unique integer value identifying this quiz image.
    id: 56,
    // number
    id2: 56,
    // number | The related course_id.
    course: 56,
    // string | Unguessable public token used in the image URL.
    token: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
    // string
    url: url_example,
    // string | Original filename.
    originalName: originalName_example,
    // string | Image MIME type.
    contentType: contentType_example,
    // string
    created: 2013-10-20T19:20:30+01:00,
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

| Name             | Type     | Description                                         | Notes                     |
| ---------------- | -------- | --------------------------------------------------- | ------------------------- |
| **id**           | `number` | A unique integer value identifying this quiz image. | [Defaults to `undefined`] |
| **id2**          | `number` |                                                     | [Defaults to `undefined`] |
| **course**       | `number` | The related course_id.                              | [Defaults to `undefined`] |
| **token**        | `string` | Unguessable public token used in the image URL.     | [Defaults to `undefined`] |
| **url**          | `string` |                                                     | [Defaults to `undefined`] |
| **originalName** | `string` | Original filename.                                  | [Defaults to `undefined`] |
| **contentType**  | `string` | Image MIME type.                                    | [Defaults to `undefined`] |
| **created**      | `string` |                                                     | [Defaults to `undefined`] |

### Return type

[**QuizImage**](QuizImage.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [courseKeyAuth](../README.md#courseKeyAuth)

### HTTP request headers

- **Content-Type**: `multipart/form-data`, `application/x-www-form-urlencoded`
- **Accept**: `application/json`

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **200**     |             | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
