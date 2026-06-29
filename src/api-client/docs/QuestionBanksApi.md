# QuestionBanksApi

All URIs are relative to *http://localhost*

| Method                                                 | HTTP request                           | Description |
| ------------------------------------------------------ | -------------------------------------- | ----------- |
| [**create**](QuestionBanksApi.md#create)               | **POST** /questionBanks/               |             |
| [**destroy**](QuestionBanksApi.md#destroy)             | **DELETE** /questionBanks/{id}/        |             |
| [**list**](QuestionBanksApi.md#list)                   | **GET** /questionBanks/                |             |
| [**partialUpdate**](QuestionBanksApi.md#partialupdate) | **PATCH** /questionBanks/{id}/         |             |
| [**questionsList**](QuestionBanksApi.md#questionslist) | **GET** /questionBanks/{id}/questions/ |             |
| [**retrieve**](QuestionBanksApi.md#retrieve)           | **GET** /questionBanks/{id}/           |             |
| [**update**](QuestionBanksApi.md#update)               | **PUT** /questionBanks/{id}/           |             |

## create

> QuestionBank create(questionBank)

Course-level pools of quiz questions; each question belongs to exactly one bank.

### Example

```ts
import {
  Configuration,
  QuestionBanksApi,
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
  const api = new QuestionBanksApi(config);

  const body = {
    // QuestionBank
    questionBank: ...,
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

| Name             | Type                            | Description | Notes |
| ---------------- | ------------------------------- | ----------- | ----- |
| **questionBank** | [QuestionBank](QuestionBank.md) |             |       |

### Return type

[**QuestionBank**](QuestionBank.md)

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

> destroy(id, force)

Delete a bank. Blocked (409) if it\&#39;s used by any quiz — either as a random-draw source or because one of its questions is in a quiz — unless &#x60;&#x60;force&#x3D;true&#x60;&#x60;. Deleting cascades: its questions (and their quiz memberships) and any random-draw groups go too.

### Example

```ts
import { Configuration, QuestionBanksApi } from '';
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
  const api = new QuestionBanksApi(config);

  const body = {
    // number | A unique integer value identifying this question bank.
    id: 56,
    // boolean | Delete even if the bank is used by a quiz (detaches its questions first). (optional)
    force: true,
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

| Name      | Type      | Description                                                               | Notes                                |
| --------- | --------- | ------------------------------------------------------------------------- | ------------------------------------ |
| **id**    | `number`  | A unique integer value identifying this question bank.                    | [Defaults to `undefined`]            |
| **force** | `boolean` | Delete even if the bank is used by a quiz (detaches its questions first). | [Optional] [Defaults to `undefined`] |

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

> Array&lt;QuestionBank&gt; list()

Course-level pools of quiz questions; each question belongs to exactly one bank.

### Example

```ts
import { Configuration, QuestionBanksApi } from '';
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
  const api = new QuestionBanksApi(config);

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

[**Array&lt;QuestionBank&gt;**](QuestionBank.md)

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

> QuestionBank partialUpdate(id, patchedQuestionBank)

Course-level pools of quiz questions; each question belongs to exactly one bank.

### Example

```ts
import {
  Configuration,
  QuestionBanksApi,
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
  const api = new QuestionBanksApi(config);

  const body = {
    // number | A unique integer value identifying this question bank.
    id: 56,
    // PatchedQuestionBank (optional)
    patchedQuestionBank: ...,
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

| Name                    | Type                                          | Description                                            | Notes                     |
| ----------------------- | --------------------------------------------- | ------------------------------------------------------ | ------------------------- |
| **id**                  | `number`                                      | A unique integer value identifying this question bank. | [Defaults to `undefined`] |
| **patchedQuestionBank** | [PatchedQuestionBank](PatchedQuestionBank.md) |                                                        | [Optional]                |

### Return type

[**QuestionBank**](QuestionBank.md)

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

## questionsList

> Array&lt;Question&gt; questionsList(id)

List the questions in this bank.

### Example

```ts
import { Configuration, QuestionBanksApi } from '';
import type { QuestionsListRequest } from '';

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
  const api = new QuestionBanksApi(config);

  const body = {
    // number | A unique integer value identifying this question bank.
    id: 56,
  } satisfies QuestionsListRequest;

  try {
    const data = await api.questionsList(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name   | Type     | Description                                            | Notes                     |
| ------ | -------- | ------------------------------------------------------ | ------------------------- |
| **id** | `number` | A unique integer value identifying this question bank. | [Defaults to `undefined`] |

### Return type

[**Array&lt;Question&gt;**](Question.md)

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

> QuestionBank retrieve(id)

Course-level pools of quiz questions; each question belongs to exactly one bank.

### Example

```ts
import { Configuration, QuestionBanksApi } from '';
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
  const api = new QuestionBanksApi(config);

  const body = {
    // number | A unique integer value identifying this question bank.
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

| Name   | Type     | Description                                            | Notes                     |
| ------ | -------- | ------------------------------------------------------ | ------------------------- |
| **id** | `number` | A unique integer value identifying this question bank. | [Defaults to `undefined`] |

### Return type

[**QuestionBank**](QuestionBank.md)

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

> QuestionBank update(id, questionBank)

Course-level pools of quiz questions; each question belongs to exactly one bank.

### Example

```ts
import {
  Configuration,
  QuestionBanksApi,
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
  const api = new QuestionBanksApi(config);

  const body = {
    // number | A unique integer value identifying this question bank.
    id: 56,
    // QuestionBank
    questionBank: ...,
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

| Name             | Type                            | Description                                            | Notes                     |
| ---------------- | ------------------------------- | ------------------------------------------------------ | ------------------------- |
| **id**           | `number`                        | A unique integer value identifying this question bank. | [Defaults to `undefined`] |
| **questionBank** | [QuestionBank](QuestionBank.md) |                                                        |                           |

### Return type

[**QuestionBank**](QuestionBank.md)

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
