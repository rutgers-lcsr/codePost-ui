# QuizGeneratedSectionsApi

All URIs are relative to *http://localhost*

| Method                                                         | HTTP request                            | Description |
| -------------------------------------------------------------- | --------------------------------------- | ----------- |
| [**create**](QuizGeneratedSectionsApi.md#create)               | **POST** /quizGeneratedSections/        |             |
| [**destroy**](QuizGeneratedSectionsApi.md#destroy)             | **DELETE** /quizGeneratedSections/{id}/ |             |
| [**list**](QuizGeneratedSectionsApi.md#list)                   | **GET** /quizGeneratedSections/         |             |
| [**partialUpdate**](QuizGeneratedSectionsApi.md#partialupdate) | **PATCH** /quizGeneratedSections/{id}/  |             |
| [**retrieve**](QuizGeneratedSectionsApi.md#retrieve)           | **GET** /quizGeneratedSections/{id}/    |             |
| [**update**](QuizGeneratedSectionsApi.md#update)               | **PUT** /quizGeneratedSections/{id}/    |             |

## create

> QuizGeneratedSection create(quizGeneratedSection)

Per-student generation configs on a quiz (authoring, course staff). A section\&#39;s &#x60;&#x60;systemPrompt&#x60;&#x60; template is validated on save; the variables it may use are listed by &#x60;&#x60;GET /quizzes/{id}/promptVariables/&#x60;&#x60;.

### Example

```ts
import {
  Configuration,
  QuizGeneratedSectionsApi,
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
  const api = new QuizGeneratedSectionsApi(config);

  const body = {
    // QuizGeneratedSection
    quizGeneratedSection: ...,
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

| Name                     | Type                                            | Description | Notes |
| ------------------------ | ----------------------------------------------- | ----------- | ----- |
| **quizGeneratedSection** | [QuizGeneratedSection](QuizGeneratedSection.md) |             |       |

### Return type

[**QuizGeneratedSection**](QuizGeneratedSection.md)

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

Per-student generation configs on a quiz (authoring, course staff). A section\&#39;s &#x60;&#x60;systemPrompt&#x60;&#x60; template is validated on save; the variables it may use are listed by &#x60;&#x60;GET /quizzes/{id}/promptVariables/&#x60;&#x60;.

### Example

```ts
import { Configuration, QuizGeneratedSectionsApi } from '';
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
  const api = new QuizGeneratedSectionsApi(config);

  const body = {
    // number | A unique integer value identifying this quiz generated section.
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

| Name   | Type     | Description                                                     | Notes                     |
| ------ | -------- | --------------------------------------------------------------- | ------------------------- |
| **id** | `number` | A unique integer value identifying this quiz generated section. | [Defaults to `undefined`] |

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

> Array&lt;QuizGeneratedSection&gt; list()

Per-student generation configs on a quiz (authoring, course staff). A section\&#39;s &#x60;&#x60;systemPrompt&#x60;&#x60; template is validated on save; the variables it may use are listed by &#x60;&#x60;GET /quizzes/{id}/promptVariables/&#x60;&#x60;.

### Example

```ts
import { Configuration, QuizGeneratedSectionsApi } from '';
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
  const api = new QuizGeneratedSectionsApi(config);

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

[**Array&lt;QuizGeneratedSection&gt;**](QuizGeneratedSection.md)

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

> QuizGeneratedSection partialUpdate(id, patchedQuizGeneratedSection)

Per-student generation configs on a quiz (authoring, course staff). A section\&#39;s &#x60;&#x60;systemPrompt&#x60;&#x60; template is validated on save; the variables it may use are listed by &#x60;&#x60;GET /quizzes/{id}/promptVariables/&#x60;&#x60;.

### Example

```ts
import {
  Configuration,
  QuizGeneratedSectionsApi,
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
  const api = new QuizGeneratedSectionsApi(config);

  const body = {
    // number | A unique integer value identifying this quiz generated section.
    id: 56,
    // PatchedQuizGeneratedSection (optional)
    patchedQuizGeneratedSection: ...,
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

| Name                            | Type                                                          | Description                                                     | Notes                     |
| ------------------------------- | ------------------------------------------------------------- | --------------------------------------------------------------- | ------------------------- |
| **id**                          | `number`                                                      | A unique integer value identifying this quiz generated section. | [Defaults to `undefined`] |
| **patchedQuizGeneratedSection** | [PatchedQuizGeneratedSection](PatchedQuizGeneratedSection.md) |                                                                 | [Optional]                |

### Return type

[**QuizGeneratedSection**](QuizGeneratedSection.md)

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

> QuizGeneratedSection retrieve(id)

Per-student generation configs on a quiz (authoring, course staff). A section\&#39;s &#x60;&#x60;systemPrompt&#x60;&#x60; template is validated on save; the variables it may use are listed by &#x60;&#x60;GET /quizzes/{id}/promptVariables/&#x60;&#x60;.

### Example

```ts
import { Configuration, QuizGeneratedSectionsApi } from '';
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
  const api = new QuizGeneratedSectionsApi(config);

  const body = {
    // number | A unique integer value identifying this quiz generated section.
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

| Name   | Type     | Description                                                     | Notes                     |
| ------ | -------- | --------------------------------------------------------------- | ------------------------- |
| **id** | `number` | A unique integer value identifying this quiz generated section. | [Defaults to `undefined`] |

### Return type

[**QuizGeneratedSection**](QuizGeneratedSection.md)

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

> QuizGeneratedSection update(id, quizGeneratedSection)

Per-student generation configs on a quiz (authoring, course staff). A section\&#39;s &#x60;&#x60;systemPrompt&#x60;&#x60; template is validated on save; the variables it may use are listed by &#x60;&#x60;GET /quizzes/{id}/promptVariables/&#x60;&#x60;.

### Example

```ts
import {
  Configuration,
  QuizGeneratedSectionsApi,
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
  const api = new QuizGeneratedSectionsApi(config);

  const body = {
    // number | A unique integer value identifying this quiz generated section.
    id: 56,
    // QuizGeneratedSection
    quizGeneratedSection: ...,
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

| Name                     | Type                                            | Description                                                     | Notes                     |
| ------------------------ | ----------------------------------------------- | --------------------------------------------------------------- | ------------------------- |
| **id**                   | `number`                                        | A unique integer value identifying this quiz generated section. | [Defaults to `undefined`] |
| **quizGeneratedSection** | [QuizGeneratedSection](QuizGeneratedSection.md) |                                                                 |                           |

### Return type

[**QuizGeneratedSection**](QuizGeneratedSection.md)

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
