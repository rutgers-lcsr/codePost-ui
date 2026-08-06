# QuizzesApi

All URIs are relative to *http://localhost*

| Method                                                                               | HTTP request                                    | Description |
| ------------------------------------------------------------------------------------ | ----------------------------------------------- | ----------- |
| [**attemptsList**](QuizzesApi.md#attemptslist)                                       | **GET** /quizzes/{id}/attempts/                 |             |
| [**backfillPreviewRetrieve**](QuizzesApi.md#backfillpreviewretrieve)                 | **GET** /quizzes/{id}/backfillPreview/          |             |
| [**create**](QuizzesApi.md#create)                                                   | **POST** /quizzes/                              |             |
| [**destroy**](QuizzesApi.md#destroy)                                                 | **DELETE** /quizzes/{id}/                       |             |
| [**generateAccessCodePartialUpdate**](QuizzesApi.md#generateaccesscodepartialupdate) | **PATCH** /quizzes/{id}/generateAccessCode/     |             |
| [**generateForStudentCreate**](QuizzesApi.md#generateforstudentcreate)               | **POST** /quizzes/{id}/generateForStudent/      |             |
| [**generateMissingCreate**](QuizzesApi.md#generatemissingcreate)                     | **POST** /quizzes/{id}/generateMissing/         |             |
| [**generatedSetsList**](QuizzesApi.md#generatedsetslist)                             | **GET** /quizzes/{id}/generatedSets/            |             |
| [**list**](QuizzesApi.md#list)                                                       | **GET** /quizzes/                               |             |
| [**partialUpdate**](QuizzesApi.md#partialupdate)                                     | **PATCH** /quizzes/{id}/                        |             |
| [**previewGeneratedSectionCreate**](QuizzesApi.md#previewgeneratedsectioncreate)     | **POST** /quizzes/{id}/previewGeneratedSection/ |             |
| [**promptTemplatesList**](QuizzesApi.md#prompttemplateslist)                         | **GET** /quizzes/{id}/promptTemplates/          |             |
| [**promptVariablesList**](QuizzesApi.md#promptvariableslist)                         | **GET** /quizzes/{id}/promptVariables/          |             |
| [**publishAllGeneratedCreate**](QuizzesApi.md#publishallgeneratedcreate)             | **POST** /quizzes/{id}/publishAllGenerated/     |             |
| [**questionsList**](QuizzesApi.md#questionslist)                                     | **GET** /quizzes/{id}/questions/                |             |
| [**resetAttemptsCreate**](QuizzesApi.md#resetattemptscreate)                         | **POST** /quizzes/{id}/resetAttempts/           |             |
| [**resultsList**](QuizzesApi.md#resultslist)                                         | **GET** /quizzes/{id}/results/                  |             |
| [**retrieve**](QuizzesApi.md#retrieve)                                               | **GET** /quizzes/{id}/                          |             |
| [**sebConfigRetrieve**](QuizzesApi.md#sebconfigretrieve)                             | **GET** /quizzes/{id}/sebConfig/                |             |
| [**update**](QuizzesApi.md#update)                                                   | **PUT** /quizzes/{id}/                          |             |

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

## backfillPreviewRetrieve

> BackfillPreviewResponse backfillPreviewRetrieve(id)

How many students a backfill would touch — shown to the instructor before they save a new AI section (&#x60;&#x60;wouldGenerate&#x60;&#x60;: the section-create backfill) and on the review drawer\&#39;s Generate-missing button (&#x60;&#x60;missing&#x60;&#x60;: targets without any set). Submission-seeded quizzes count submitters; submission-free ones count every enrolled student (&#x60;&#x60;needsSubmission&#x60;&#x60; says which applies).

### Example

```ts
import { Configuration, QuizzesApi } from '';
import type { BackfillPreviewRetrieveRequest } from '';

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
  } satisfies BackfillPreviewRetrieveRequest;

  try {
    const data = await api.backfillPreviewRetrieve(body);
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

[**BackfillPreviewResponse**](BackfillPreviewResponse.md)

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

## generateAccessCodePartialUpdate

> QuizAccessCodeResponse generateAccessCodePartialUpdate(id, patchedGenerateQuizAccessCodeRequest)

Generate (or, with {clear: true}, remove) this quiz\&#39;s late-access code — the code an instructor hands to late students so they can start the quiz after it closes. Course admins only. Generating rotates any existing code.

### Example

```ts
import {
  Configuration,
  QuizzesApi,
} from '';
import type { GenerateAccessCodePartialUpdateRequest } from '';

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
    // PatchedGenerateQuizAccessCodeRequest (optional)
    patchedGenerateQuizAccessCodeRequest: ...,
  } satisfies GenerateAccessCodePartialUpdateRequest;

  try {
    const data = await api.generateAccessCodePartialUpdate(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                                     | Type                                                                            | Description                                   | Notes                     |
| ---------------------------------------- | ------------------------------------------------------------------------------- | --------------------------------------------- | ------------------------- |
| **id**                                   | `number`                                                                        | A unique integer value identifying this quiz. | [Defaults to `undefined`] |
| **patchedGenerateQuizAccessCodeRequest** | [PatchedGenerateQuizAccessCodeRequest](PatchedGenerateQuizAccessCodeRequest.md) |                                               | [Optional]                |

### Return type

[**QuizAccessCodeResponse**](QuizAccessCodeResponse.md)

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

## generateForStudentCreate

> GeneratedQuestionSet generateForStudentCreate(id, generateForStudentRequest)

Generate (or regenerate) this quiz\&#39;s AI questions for one student from their latest submission — useful for testing a prompt or backfilling after enabling the feature. An approved set is only regenerated with force&#x3D;true (it becomes un-published until re-approved).

### Example

```ts
import {
  Configuration,
  QuizzesApi,
} from '';
import type { GenerateForStudentCreateRequest } from '';

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
    // GenerateForStudentRequest
    generateForStudentRequest: ...,
  } satisfies GenerateForStudentCreateRequest;

  try {
    const data = await api.generateForStudentCreate(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                          | Type                                                      | Description                                   | Notes                     |
| ----------------------------- | --------------------------------------------------------- | --------------------------------------------- | ------------------------- |
| **id**                        | `number`                                                  | A unique integer value identifying this quiz. | [Defaults to `undefined`] |
| **generateForStudentRequest** | [GenerateForStudentRequest](GenerateForStudentRequest.md) |                                               |                           |

### Return type

[**GeneratedQuestionSet**](GeneratedQuestionSet.md)

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

## generateMissingCreate

> GenerateMissingResponse generateMissingCreate(id)

Queue question generation for every student who has a submission on the attached assignment but no question set yet — e.g. they submitted before the AI section existed, or the feature was off / generation failed at the time.

### Example

```ts
import { Configuration, QuizzesApi } from '';
import type { GenerateMissingCreateRequest } from '';

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
  } satisfies GenerateMissingCreateRequest;

  try {
    const data = await api.generateMissingCreate(body);
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

[**GenerateMissingResponse**](GenerateMissingResponse.md)

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

## generatedSetsList

> Array&lt;GeneratedQuestionSetList&gt; generatedSetsList(id)

Per-student generated question sets on this quiz, for review. Course admins always; other staff only when gradersCanReviewGenerated is on.

### Example

```ts
import { Configuration, QuizzesApi } from '';
import type { GeneratedSetsListRequest } from '';

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
  } satisfies GeneratedSetsListRequest;

  try {
    const data = await api.generatedSetsList(body);
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

[**Array&lt;GeneratedQuestionSetList&gt;**](GeneratedQuestionSetList.md)

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

## previewGeneratedSectionCreate

> QuizSuggestionJob previewGeneratedSectionCreate(id, previewGeneratedSectionRequest)

Test-generate example questions from an (unsaved) AI-section prompt without persisting anything to the quiz — the quiz builder\&#39;s Test button. Returns a generation job to poll via quizSuggestionJobs/{id}/; the completed job\&#39;s resultData holds the example questions. seed picks how per-student {variables} resolve: a random submitter\&#39;s latest submission, or instructor-uploaded demoFiles.

### Example

```ts
import {
  Configuration,
  QuizzesApi,
} from '';
import type { PreviewGeneratedSectionCreateRequest } from '';

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
    // PreviewGeneratedSectionRequest
    previewGeneratedSectionRequest: ...,
  } satisfies PreviewGeneratedSectionCreateRequest;

  try {
    const data = await api.previewGeneratedSectionCreate(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                               | Type                                                                | Description                                   | Notes                     |
| ---------------------------------- | ------------------------------------------------------------------- | --------------------------------------------- | ------------------------- |
| **id**                             | `number`                                                            | A unique integer value identifying this quiz. | [Defaults to `undefined`] |
| **previewGeneratedSectionRequest** | [PreviewGeneratedSectionRequest](PreviewGeneratedSectionRequest.md) |                                               |                           |

### Return type

[**QuizSuggestionJob**](QuizSuggestionJob.md)

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

## promptTemplatesList

> Array&lt;QuizSectionTemplate&gt; promptTemplatesList(id)

Starter templates for this quiz\&#39;s AI-generated section prompts (powers the prompt editor\&#39;s \&#39;start from a template\&#39; picker).

### Example

```ts
import { Configuration, QuizzesApi } from '';
import type { PromptTemplatesListRequest } from '';

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
  } satisfies PromptTemplatesListRequest;

  try {
    const data = await api.promptTemplatesList(body);
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

[**Array&lt;QuizSectionTemplate&gt;**](QuizSectionTemplate.md)

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

## promptVariablesList

> Array&lt;PromptVariable&gt; promptVariablesList(id)

The {variables} usable in this quiz\&#39;s AI-generated section prompts (powers the prompt editor\&#39;s autocomplete).

### Example

```ts
import { Configuration, QuizzesApi } from '';
import type { PromptVariablesListRequest } from '';

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
  } satisfies PromptVariablesListRequest;

  try {
    const data = await api.promptVariablesList(body);
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

[**Array&lt;PromptVariable&gt;**](PromptVariable.md)

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

## publishAllGeneratedCreate

> PublishAllGeneratedResponse publishAllGeneratedCreate(id)

Approve every generated set awaiting review on this quiz in one step (course admins only). Sets with no questions are skipped.

### Example

```ts
import { Configuration, QuizzesApi } from '';
import type { PublishAllGeneratedCreateRequest } from '';

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
  } satisfies PublishAllGeneratedCreateRequest;

  try {
    const data = await api.publishAllGeneratedCreate(body);
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

[**PublishAllGeneratedResponse**](PublishAllGeneratedResponse.md)

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

## resetAttemptsCreate

> ResetQuizAttemptsResponse resetAttemptsCreate(id)

Delete ALL student attempts for this quiz (course admins only). Use after a substantive edit so students retake from scratch. Irreversible; responses cascade.

### Example

```ts
import { Configuration, QuizzesApi } from '';
import type { ResetAttemptsCreateRequest } from '';

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
  } satisfies ResetAttemptsCreateRequest;

  try {
    const data = await api.resetAttemptsCreate(body);
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

[**ResetQuizAttemptsResponse**](ResetQuizAttemptsResponse.md)

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

## resultsList

> Array&lt;QuizResultRow&gt; resultsList(id)

Per-student official results (per this quiz\&#39;s scoringPolicy) — quiz graders and course admins only. Score is null until the student has a fully graded attempt.

### Example

```ts
import { Configuration, QuizzesApi } from '';
import type { ResultsListRequest } from '';

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
  } satisfies ResultsListRequest;

  try {
    const data = await api.resultsList(body);
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

[**Array&lt;QuizResultRow&gt;**](QuizResultRow.md)

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

## sebConfigRetrieve

> Blob sebConfigRetrieve(id, launch)

Download the generated .seb config for a one-click Safe Exam Browser launch. Unauthenticated by design: SEB fetches this URL (via the seb:// protocol handler) before any session exists — the unguessable launch token is the credential. The token is checked but not consumed here; it is spent at /ott/exchange/ inside SEB.

### Example

```ts
import { Configuration, QuizzesApi } from '';
import type { SebConfigRetrieveRequest } from '';

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
    // string | The launch token from sebLaunch.
    launch: launch_example,
  } satisfies SebConfigRetrieveRequest;

  try {
    const data = await api.sebConfigRetrieve(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name       | Type     | Description                                   | Notes                     |
| ---------- | -------- | --------------------------------------------- | ------------------------- |
| **id**     | `number` | A unique integer value identifying this quiz. | [Defaults to `undefined`] |
| **launch** | `string` | The launch token from sebLaunch.              | [Defaults to `undefined`] |

### Return type

**Blob**

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
