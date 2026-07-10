# QuizAttemptsApi

All URIs are relative to *http://localhost*

| Method                                                                    | HTTP request                                | Description |
| ------------------------------------------------------------------------- | ------------------------------------------- | ----------- |
| [**availableQuizzesList**](QuizAttemptsApi.md#availablequizzeslist)       | **GET** /quizAttempts/availableQuizzes/     |             |
| [**create**](QuizAttemptsApi.md#create)                                   | **POST** /quizAttempts/                     |             |
| [**gradeResponseCreate**](QuizAttemptsApi.md#graderesponsecreate)         | **POST** /quizAttempts/{id}/gradeResponse/  |             |
| [**myAttemptsList**](QuizAttemptsApi.md#myattemptslist)                   | **GET** /quizAttempts/myAttempts/           |             |
| [**reopenResponseCreate**](QuizAttemptsApi.md#reopenresponsecreate)       | **POST** /quizAttempts/{id}/reopenResponse/ |             |
| [**retrieve**](QuizAttemptsApi.md#retrieve)                               | **GET** /quizAttempts/{id}/                 |             |
| [**saveAnswerPartialUpdate**](QuizAttemptsApi.md#saveanswerpartialupdate) | **PATCH** /quizAttempts/{id}/saveAnswer/    |             |
| [**submitCreate**](QuizAttemptsApi.md#submitcreate)                       | **POST** /quizAttempts/{id}/submit/         |             |

## availableQuizzesList

> Array&lt;StudentQuiz&gt; availableQuizzesList(course)

Published quizzes in &#x60;&#x60;course&#x60;&#x60; the caller should see. Attached quizzes surface once their assignment is released — even while the quiz itself is still locked — so the assignment card can show them with a reason. Standalone quizzes surface only when open now or already attempted.

### Example

```ts
import { Configuration, QuizAttemptsApi } from '';
import type { AvailableQuizzesListRequest } from '';

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
  const api = new QuizAttemptsApi(config);

  const body = {
    // number
    course: 56,
  } satisfies AvailableQuizzesListRequest;

  try {
    const data = await api.availableQuizzesList(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name       | Type     | Description | Notes                     |
| ---------- | -------- | ----------- | ------------------------- |
| **course** | `number` |             | [Defaults to `undefined`] |

### Return type

[**Array&lt;StudentQuiz&gt;**](StudentQuiz.md)

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

> StudentQuizAttempt create(startQuizAttemptRequest)

Start a new attempt, or resume the student\&#39;s in-progress one, for &#x60;&#x60;quiz&#x60;&#x60;.

### Example

```ts
import {
  Configuration,
  QuizAttemptsApi,
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
  const api = new QuizAttemptsApi(config);

  const body = {
    // StartQuizAttemptRequest
    startQuizAttemptRequest: ...,
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

| Name                        | Type                                                  | Description | Notes |
| --------------------------- | ----------------------------------------------------- | ----------- | ----- |
| **startQuizAttemptRequest** | [StartQuizAttemptRequest](StartQuizAttemptRequest.md) |             |       |

### Return type

[**StudentQuizAttempt**](StudentQuizAttempt.md)

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

## gradeResponseCreate

> StaffQuizAttempt gradeResponseCreate(id, gradeQuizResponseRequest)

Manually grade one essay/code response (quiz graders and course admins only — gated by QuizAttemptPermissions). Recomputes the attempt\&#39;s score and pass state.

### Example

```ts
import {
  Configuration,
  QuizAttemptsApi,
} from '';
import type { GradeResponseCreateRequest } from '';

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
  const api = new QuizAttemptsApi(config);

  const body = {
    // number | A unique integer value identifying this quiz attempt.
    id: 56,
    // GradeQuizResponseRequest
    gradeQuizResponseRequest: ...,
  } satisfies GradeResponseCreateRequest;

  try {
    const data = await api.gradeResponseCreate(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                         | Type                                                    | Description                                           | Notes                     |
| ---------------------------- | ------------------------------------------------------- | ----------------------------------------------------- | ------------------------- |
| **id**                       | `number`                                                | A unique integer value identifying this quiz attempt. | [Defaults to `undefined`] |
| **gradeQuizResponseRequest** | [GradeQuizResponseRequest](GradeQuizResponseRequest.md) |                                                       |                           |

### Return type

[**StaffQuizAttempt**](StaffQuizAttempt.md)

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

## myAttemptsList

> Array&lt;StudentQuizAttempt&gt; myAttemptsList(quiz)

The calling student\&#39;s attempts for &#x60;&#x60;quiz&#x60;&#x60;.

### Example

```ts
import { Configuration, QuizAttemptsApi } from '';
import type { MyAttemptsListRequest } from '';

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
  const api = new QuizAttemptsApi(config);

  const body = {
    // number
    quiz: 56,
  } satisfies MyAttemptsListRequest;

  try {
    const data = await api.myAttemptsList(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name     | Type     | Description | Notes                     |
| -------- | -------- | ----------- | ------------------------- |
| **quiz** | `number` |             | [Defaults to `undefined`] |

### Return type

[**Array&lt;StudentQuizAttempt&gt;**](StudentQuizAttempt.md)

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

## reopenResponseCreate

> StaffQuizAttempt reopenResponseCreate(id, reopenQuizResponseRequest)

Send a manually graded essay/code response back to the grading queue (undo the grade). The feedback text is kept as a draft; the attempt\&#39;s totals are refreshed.

### Example

```ts
import {
  Configuration,
  QuizAttemptsApi,
} from '';
import type { ReopenResponseCreateRequest } from '';

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
  const api = new QuizAttemptsApi(config);

  const body = {
    // number | A unique integer value identifying this quiz attempt.
    id: 56,
    // ReopenQuizResponseRequest
    reopenQuizResponseRequest: ...,
  } satisfies ReopenResponseCreateRequest;

  try {
    const data = await api.reopenResponseCreate(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                          | Type                                                      | Description                                           | Notes                     |
| ----------------------------- | --------------------------------------------------------- | ----------------------------------------------------- | ------------------------- |
| **id**                        | `number`                                                  | A unique integer value identifying this quiz attempt. | [Defaults to `undefined`] |
| **reopenQuizResponseRequest** | [ReopenQuizResponseRequest](ReopenQuizResponseRequest.md) |                                                       |                           |

### Return type

[**StaffQuizAttempt**](StaffQuizAttempt.md)

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

> StaffQuizAttempt retrieve(id)

A student\&#39;s quiz attempts. Students operate only on their own; staff may read.

### Example

```ts
import { Configuration, QuizAttemptsApi } from '';
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
  const api = new QuizAttemptsApi(config);

  const body = {
    // number | A unique integer value identifying this quiz attempt.
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

| Name   | Type     | Description                                           | Notes                     |
| ------ | -------- | ----------------------------------------------------- | ------------------------- |
| **id** | `number` | A unique integer value identifying this quiz attempt. | [Defaults to `undefined`] |

### Return type

[**StaffQuizAttempt**](StaffQuizAttempt.md)

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

## saveAnswerPartialUpdate

> StudentQuizResponse saveAnswerPartialUpdate(id, patchedSaveQuizAnswerRequest)

Autosave a single response within an in-progress, not-yet-expired attempt.

### Example

```ts
import {
  Configuration,
  QuizAttemptsApi,
} from '';
import type { SaveAnswerPartialUpdateRequest } from '';

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
  const api = new QuizAttemptsApi(config);

  const body = {
    // number | A unique integer value identifying this quiz attempt.
    id: 56,
    // PatchedSaveQuizAnswerRequest (optional)
    patchedSaveQuizAnswerRequest: ...,
  } satisfies SaveAnswerPartialUpdateRequest;

  try {
    const data = await api.saveAnswerPartialUpdate(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                             | Type                                                            | Description                                           | Notes                     |
| -------------------------------- | --------------------------------------------------------------- | ----------------------------------------------------- | ------------------------- |
| **id**                           | `number`                                                        | A unique integer value identifying this quiz attempt. | [Defaults to `undefined`] |
| **patchedSaveQuizAnswerRequest** | [PatchedSaveQuizAnswerRequest](PatchedSaveQuizAnswerRequest.md) |                                                       | [Optional]                |

### Return type

[**StudentQuizResponse**](StudentQuizResponse.md)

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

## submitCreate

> StudentQuizAttempt submitCreate(id)

Finalize and auto-grade the attempt.

### Example

```ts
import { Configuration, QuizAttemptsApi } from '';
import type { SubmitCreateRequest } from '';

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
  const api = new QuizAttemptsApi(config);

  const body = {
    // number | A unique integer value identifying this quiz attempt.
    id: 56,
  } satisfies SubmitCreateRequest;

  try {
    const data = await api.submitCreate(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name   | Type     | Description                                           | Notes                     |
| ------ | -------- | ----------------------------------------------------- | ------------------------- |
| **id** | `number` | A unique integer value identifying this quiz attempt. | [Defaults to `undefined`] |

### Return type

[**StudentQuizAttempt**](StudentQuizAttempt.md)

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
