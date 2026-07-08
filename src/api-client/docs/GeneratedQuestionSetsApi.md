# GeneratedQuestionSetsApi

All URIs are relative to *http://localhost*

| Method                                                               | HTTP request                                     | Description |
| -------------------------------------------------------------------- | ------------------------------------------------ | ----------- |
| [**approveCreate**](GeneratedQuestionSetsApi.md#approvecreate)       | **POST** /generatedQuestionSets/{id}/approve/    |             |
| [**regenerateCreate**](GeneratedQuestionSetsApi.md#regeneratecreate) | **POST** /generatedQuestionSets/{id}/regenerate/ |             |
| [**retrieve**](GeneratedQuestionSetsApi.md#retrieve)                 | **GET** /generatedQuestionSets/{id}/             |             |
| [**unapproveCreate**](GeneratedQuestionSetsApi.md#unapprovecreate)   | **POST** /generatedQuestionSets/{id}/unapprove/  |             |

## approveCreate

> GeneratedQuestionSet approveCreate(id)

Approve this student\&#39;s generated questions — their quiz opens once approved. The approving staff member takes authorship of the questions.

### Example

```ts
import { Configuration, GeneratedQuestionSetsApi } from '';
import type { ApproveCreateRequest } from '';

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
  const api = new GeneratedQuestionSetsApi(config);

  const body = {
    // number | A unique integer value identifying this generated question set.
    id: 56,
  } satisfies ApproveCreateRequest;

  try {
    const data = await api.approveCreate(body);
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
| **id** | `number` | A unique integer value identifying this generated question set. | [Defaults to `undefined`] |

### Return type

[**GeneratedQuestionSet**](GeneratedQuestionSet.md)

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

## regenerateCreate

> GeneratedQuestionSet regenerateCreate(id)

Discard this set\&#39;s questions and generate new ones from the student\&#39;s submission. An approved set becomes un-published until re-approved.

### Example

```ts
import { Configuration, GeneratedQuestionSetsApi } from '';
import type { RegenerateCreateRequest } from '';

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
  const api = new GeneratedQuestionSetsApi(config);

  const body = {
    // number | A unique integer value identifying this generated question set.
    id: 56,
  } satisfies RegenerateCreateRequest;

  try {
    const data = await api.regenerateCreate(body);
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
| **id** | `number` | A unique integer value identifying this generated question set. | [Defaults to `undefined`] |

### Return type

[**GeneratedQuestionSet**](GeneratedQuestionSet.md)

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

## retrieve

> GeneratedQuestionSet retrieve(id)

A student\&#39;s generated question set — the review unit. System-created by the generation task (never via POST); staff approve/unapprove/regenerate here and list them per quiz via &#x60;&#x60;GET /quizzes/{id}/generatedSets/&#x60;&#x60;. Staff-only.

### Example

```ts
import { Configuration, GeneratedQuestionSetsApi } from '';
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
  const api = new GeneratedQuestionSetsApi(config);

  const body = {
    // number | A unique integer value identifying this generated question set.
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
| **id** | `number` | A unique integer value identifying this generated question set. | [Defaults to `undefined`] |

### Return type

[**GeneratedQuestionSet**](GeneratedQuestionSet.md)

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

## unapproveCreate

> GeneratedQuestionSet unapproveCreate(id)

Take an approved set back to review (closing the quiz for that student). Blocked once the student has any attempt on the quiz.

### Example

```ts
import { Configuration, GeneratedQuestionSetsApi } from '';
import type { UnapproveCreateRequest } from '';

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
  const api = new GeneratedQuestionSetsApi(config);

  const body = {
    // number | A unique integer value identifying this generated question set.
    id: 56,
  } satisfies UnapproveCreateRequest;

  try {
    const data = await api.unapproveCreate(body);
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
| **id** | `number` | A unique integer value identifying this generated question set. | [Defaults to `undefined`] |

### Return type

[**GeneratedQuestionSet**](GeneratedQuestionSet.md)

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
