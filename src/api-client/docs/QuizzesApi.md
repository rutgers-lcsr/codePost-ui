# QuizzesApi

All URIs are relative to *http://localhost*

| Method                                           | HTTP request                     | Description |
| ------------------------------------------------ | -------------------------------- | ----------- |
| [**attemptsList**](QuizzesApi.md#attemptslist)   | **GET** /quizzes/{id}/attempts/  |             |
| [**create**](QuizzesApi.md#create)               | **POST** /quizzes/               |             |
| [**destroy**](QuizzesApi.md#destroy)             | **DELETE** /quizzes/{id}/        |             |
| [**list**](QuizzesApi.md#list)                   | **GET** /quizzes/                |             |
| [**partialUpdate**](QuizzesApi.md#partialupdate) | **PATCH** /quizzes/{id}/         |             |
| [**questionsList**](QuizzesApi.md#questionslist) | **GET** /quizzes/{id}/questions/ |             |
| [**retrieve**](QuizzesApi.md#retrieve)           | **GET** /quizzes/{id}/           |             |
| [**update**](QuizzesApi.md#update)               | **PUT** /quizzes/{id}/           |             |

## attemptsList

> Array&lt;StaffQuizAttempt&gt; attemptsList(id, needsGrading)

Submitted attempts on this quiz, for grading — quiz graders and course admins only.

### Example

```ts
import { Configuration, QuizzesApi } from '';
import type { AttemptsListRequest } from '';

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
  const api = new QuizzesApi(config);

  const body = {
    // number | A unique integer value identifying this quiz.
    id: 56,
    // boolean | Only attempts awaiting manual grading. (optional)
    needsGrading: true,
  } satisfies AttemptsListRequest;

  try {
    const data = await api.attemptsList(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name             | Type      | Description                                   | Notes                                |
| ---------------- | --------- | --------------------------------------------- | ------------------------------------ |
| **id**           | `number`  | A unique integer value identifying this quiz. | [Defaults to `undefined`]            |
| **needsGrading** | `boolean` | Only attempts awaiting manual grading.        | [Optional] [Defaults to `undefined`] |

### Return type

[**Array&lt;StaffQuizAttempt&gt;**](StaffQuizAttempt.md)

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

> Quiz create(quiz)

Quizzes: authoring containers of questions, optionally attached to an assignment. Attach a quiz to an existing assignment by PATCHing its &#x60;&#x60;assignment&#x60;&#x60; field.

### Example

```ts
import {
  Configuration,
  QuizzesApi,
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
  const api = new QuizzesApi(config);

  const body = {
    // Quiz
    quiz: ...,
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

| Name     | Type            | Description | Notes |
| -------- | --------------- | ----------- | ----- |
| **quiz** | [Quiz](Quiz.md) |             |       |

### Return type

[**Quiz**](Quiz.md)

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

Quizzes: authoring containers of questions, optionally attached to an assignment. Attach a quiz to an existing assignment by PATCHing its &#x60;&#x60;assignment&#x60;&#x60; field.

### Example

```ts
import { Configuration, QuizzesApi } from '';
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
  const api = new QuizzesApi(config);

  const body = {
    // number | A unique integer value identifying this quiz.
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

| Name   | Type     | Description                                   | Notes                     |
| ------ | -------- | --------------------------------------------- | ------------------------- |
| **id** | `number` | A unique integer value identifying this quiz. | [Defaults to `undefined`] |

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

> Array&lt;Quiz&gt; list()

Quizzes: authoring containers of questions, optionally attached to an assignment. Attach a quiz to an existing assignment by PATCHing its &#x60;&#x60;assignment&#x60;&#x60; field.

### Example

```ts
import { Configuration, QuizzesApi } from '';
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
  const api = new QuizzesApi(config);

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

[**Array&lt;Quiz&gt;**](Quiz.md)

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

> Quiz partialUpdate(id, patchedQuiz)

Quizzes: authoring containers of questions, optionally attached to an assignment. Attach a quiz to an existing assignment by PATCHing its &#x60;&#x60;assignment&#x60;&#x60; field.

### Example

```ts
import {
  Configuration,
  QuizzesApi,
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
  const api = new QuizzesApi(config);

  const body = {
    // number | A unique integer value identifying this quiz.
    id: 56,
    // PatchedQuiz (optional)
    patchedQuiz: ...,
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

| Name            | Type                          | Description                                   | Notes                     |
| --------------- | ----------------------------- | --------------------------------------------- | ------------------------- |
| **id**          | `number`                      | A unique integer value identifying this quiz. | [Defaults to `undefined`] |
| **patchedQuiz** | [PatchedQuiz](PatchedQuiz.md) |                                               | [Optional]                |

### Return type

[**Quiz**](Quiz.md)

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

> Array&lt;QuizQuestion&gt; questionsList(id)

List this quiz\&#39;s question memberships, in order.

### Example

```ts
import { Configuration, QuizzesApi } from '';
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
  const api = new QuizzesApi(config);

  const body = {
    // number | A unique integer value identifying this quiz.
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

| Name   | Type     | Description                                   | Notes                     |
| ------ | -------- | --------------------------------------------- | ------------------------- |
| **id** | `number` | A unique integer value identifying this quiz. | [Defaults to `undefined`] |

### Return type

[**Array&lt;QuizQuestion&gt;**](QuizQuestion.md)

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

> Quiz retrieve(id)

Quizzes: authoring containers of questions, optionally attached to an assignment. Attach a quiz to an existing assignment by PATCHing its &#x60;&#x60;assignment&#x60;&#x60; field.

### Example

```ts
import { Configuration, QuizzesApi } from '';
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
  const api = new QuizzesApi(config);

  const body = {
    // number | A unique integer value identifying this quiz.
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

| Name   | Type     | Description                                   | Notes                     |
| ------ | -------- | --------------------------------------------- | ------------------------- |
| **id** | `number` | A unique integer value identifying this quiz. | [Defaults to `undefined`] |

### Return type

[**Quiz**](Quiz.md)

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

> Quiz update(id, quiz)

Quizzes: authoring containers of questions, optionally attached to an assignment. Attach a quiz to an existing assignment by PATCHing its &#x60;&#x60;assignment&#x60;&#x60; field.

### Example

```ts
import {
  Configuration,
  QuizzesApi,
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
  const api = new QuizzesApi(config);

  const body = {
    // number | A unique integer value identifying this quiz.
    id: 56,
    // Quiz
    quiz: ...,
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

| Name     | Type            | Description                                   | Notes                     |
| -------- | --------------- | --------------------------------------------- | ------------------------- |
| **id**   | `number`        | A unique integer value identifying this quiz. | [Defaults to `undefined`] |
| **quiz** | [Quiz](Quiz.md) |                                               |                           |

### Return type

[**Quiz**](Quiz.md)

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
