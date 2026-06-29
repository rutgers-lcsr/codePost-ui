# QuizImportJobsApi

All URIs are relative to *http://localhost*

| Method                                                  | HTTP request                     | Description |
| ------------------------------------------------------- | -------------------------------- | ----------- |
| [**create**](QuizImportJobsApi.md#create)               | **POST** /quizImportJobs/        |             |
| [**destroy**](QuizImportJobsApi.md#destroy)             | **DELETE** /quizImportJobs/{id}/ |             |
| [**list**](QuizImportJobsApi.md#list)                   | **GET** /quizImportJobs/         |             |
| [**partialUpdate**](QuizImportJobsApi.md#partialupdate) | **PATCH** /quizImportJobs/{id}/  |             |
| [**retrieve**](QuizImportJobsApi.md#retrieve)           | **GET** /quizImportJobs/{id}/    |             |
| [**update**](QuizImportJobsApi.md#update)               | **PUT** /quizImportJobs/{id}/    |             |

## create

> QuizImportJob create(id, course, status, taskId, targetBank, createdQuizCount, createdQuestionCount, errorMessage, summary, created)

Import quizzes/question banks from a QTI / Common Cartridge export (e.g. exported from Canvas or another LMS). create: Upload a QTI / Common Cartridge export (multipart &#x60;&#x60;file&#x60;&#x60;) for a &#x60;&#x60;course&#x60;&#x60;. Optionally target an existing bank (&#x60;&#x60;targetBankId&#x60;&#x60;) or name a new one (&#x60;&#x60;bankName&#x60;&#x60;). Parsing runs asynchronously; poll the returned job via &#x60;&#x60;retrieve&#x60;&#x60;. retrieve: Return the import job\&#39;s current status, counts, and parse summary.

### Example

```ts
import {
  Configuration,
  QuizImportJobsApi,
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
  const api = new QuizImportJobsApi(config);

  const body = {
    // number
    id: 56,
    // number | The related course_id.
    course: 56,
    // QuizImportJobStatusEnum | Current status of the import job.  * `pending` - Pending * `running` - Running * `completed` - Completed * `failed` - Failed
    status: ...,
    // string | Celery task id for polling.
    taskId: taskId_example,
    // number | The bank imported questions land in. Created if absent.
    targetBank: 56,
    // number | Number of quizzes created.
    createdQuizCount: 56,
    // number | Number of questions created.
    createdQuestionCount: 56,
    // string | Error detail if the job failed.
    errorMessage: errorMessage_example,
    // string | Per-item parse report, including skipped/unsupported types.
    summary: summary_example,
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

| Name                     | Type                      | Description                                                                                                                                                         | Notes                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| **id**                   | `number`                  |                                                                                                                                                                     | [Defaults to `undefined`]                                             |
| **course**               | `number`                  | The related course_id.                                                                                                                                              | [Defaults to `undefined`]                                             |
| **status**               | `QuizImportJobStatusEnum` | Current status of the import job. * &#x60;pending&#x60; - Pending * &#x60;running&#x60; - Running * &#x60;completed&#x60; - Completed * &#x60;failed&#x60; - Failed | [Defaults to `undefined`] [Enum: pending, running, completed, failed] |
| **taskId**               | `string`                  | Celery task id for polling.                                                                                                                                         | [Defaults to `undefined`]                                             |
| **targetBank**           | `number`                  | The bank imported questions land in. Created if absent.                                                                                                             | [Defaults to `undefined`]                                             |
| **createdQuizCount**     | `number`                  | Number of quizzes created.                                                                                                                                          | [Defaults to `undefined`]                                             |
| **createdQuestionCount** | `number`                  | Number of questions created.                                                                                                                                        | [Defaults to `undefined`]                                             |
| **errorMessage**         | `string`                  | Error detail if the job failed.                                                                                                                                     | [Defaults to `undefined`]                                             |
| **summary**              | `string`                  | Per-item parse report, including skipped/unsupported types.                                                                                                         | [Defaults to `undefined`]                                             |
| **created**              | `string`                  |                                                                                                                                                                     | [Defaults to `undefined`]                                             |

### Return type

[**QuizImportJob**](QuizImportJob.md)

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

Import quizzes/question banks from a QTI / Common Cartridge export (e.g. exported from Canvas or another LMS). create: Upload a QTI / Common Cartridge export (multipart &#x60;&#x60;file&#x60;&#x60;) for a &#x60;&#x60;course&#x60;&#x60;. Optionally target an existing bank (&#x60;&#x60;targetBankId&#x60;&#x60;) or name a new one (&#x60;&#x60;bankName&#x60;&#x60;). Parsing runs asynchronously; poll the returned job via &#x60;&#x60;retrieve&#x60;&#x60;. retrieve: Return the import job\&#39;s current status, counts, and parse summary.

### Example

```ts
import { Configuration, QuizImportJobsApi } from '';
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
  const api = new QuizImportJobsApi(config);

  const body = {
    // number | A unique integer value identifying this quiz import job.
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

| Name   | Type     | Description                                              | Notes                     |
| ------ | -------- | -------------------------------------------------------- | ------------------------- |
| **id** | `number` | A unique integer value identifying this quiz import job. | [Defaults to `undefined`] |

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

> Array&lt;QuizImportJob&gt; list()

Import quizzes/question banks from a QTI / Common Cartridge export (e.g. exported from Canvas or another LMS). create: Upload a QTI / Common Cartridge export (multipart &#x60;&#x60;file&#x60;&#x60;) for a &#x60;&#x60;course&#x60;&#x60;. Optionally target an existing bank (&#x60;&#x60;targetBankId&#x60;&#x60;) or name a new one (&#x60;&#x60;bankName&#x60;&#x60;). Parsing runs asynchronously; poll the returned job via &#x60;&#x60;retrieve&#x60;&#x60;. retrieve: Return the import job\&#39;s current status, counts, and parse summary.

### Example

```ts
import { Configuration, QuizImportJobsApi } from '';
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
  const api = new QuizImportJobsApi(config);

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

[**Array&lt;QuizImportJob&gt;**](QuizImportJob.md)

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

> QuizImportJob partialUpdate(id, id2, course, status, taskId, targetBank, createdQuizCount, createdQuestionCount, errorMessage, summary, created)

Import quizzes/question banks from a QTI / Common Cartridge export (e.g. exported from Canvas or another LMS). create: Upload a QTI / Common Cartridge export (multipart &#x60;&#x60;file&#x60;&#x60;) for a &#x60;&#x60;course&#x60;&#x60;. Optionally target an existing bank (&#x60;&#x60;targetBankId&#x60;&#x60;) or name a new one (&#x60;&#x60;bankName&#x60;&#x60;). Parsing runs asynchronously; poll the returned job via &#x60;&#x60;retrieve&#x60;&#x60;. retrieve: Return the import job\&#39;s current status, counts, and parse summary.

### Example

```ts
import {
  Configuration,
  QuizImportJobsApi,
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
  const api = new QuizImportJobsApi(config);

  const body = {
    // number | A unique integer value identifying this quiz import job.
    id: 56,
    // number (optional)
    id2: 56,
    // number | The related course_id. (optional)
    course: 56,
    // QuizImportJobStatusEnum | Current status of the import job.  * `pending` - Pending * `running` - Running * `completed` - Completed * `failed` - Failed (optional)
    status: ...,
    // string | Celery task id for polling. (optional)
    taskId: taskId_example,
    // number | The bank imported questions land in. Created if absent. (optional)
    targetBank: 56,
    // number | Number of quizzes created. (optional)
    createdQuizCount: 56,
    // number | Number of questions created. (optional)
    createdQuestionCount: 56,
    // string | Error detail if the job failed. (optional)
    errorMessage: errorMessage_example,
    // string | Per-item parse report, including skipped/unsupported types. (optional)
    summary: summary_example,
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

| Name                     | Type                      | Description                                                                                                                                                         | Notes                                                                            |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| **id**                   | `number`                  | A unique integer value identifying this quiz import job.                                                                                                            | [Defaults to `undefined`]                                                        |
| **id2**                  | `number`                  |                                                                                                                                                                     | [Optional] [Defaults to `undefined`]                                             |
| **course**               | `number`                  | The related course_id.                                                                                                                                              | [Optional] [Defaults to `undefined`]                                             |
| **status**               | `QuizImportJobStatusEnum` | Current status of the import job. * &#x60;pending&#x60; - Pending * &#x60;running&#x60; - Running * &#x60;completed&#x60; - Completed * &#x60;failed&#x60; - Failed | [Optional] [Defaults to `undefined`] [Enum: pending, running, completed, failed] |
| **taskId**               | `string`                  | Celery task id for polling.                                                                                                                                         | [Optional] [Defaults to `undefined`]                                             |
| **targetBank**           | `number`                  | The bank imported questions land in. Created if absent.                                                                                                             | [Optional] [Defaults to `undefined`]                                             |
| **createdQuizCount**     | `number`                  | Number of quizzes created.                                                                                                                                          | [Optional] [Defaults to `undefined`]                                             |
| **createdQuestionCount** | `number`                  | Number of questions created.                                                                                                                                        | [Optional] [Defaults to `undefined`]                                             |
| **errorMessage**         | `string`                  | Error detail if the job failed.                                                                                                                                     | [Optional] [Defaults to `undefined`]                                             |
| **summary**              | `string`                  | Per-item parse report, including skipped/unsupported types.                                                                                                         | [Optional] [Defaults to `undefined`]                                             |
| **created**              | `string`                  |                                                                                                                                                                     | [Optional] [Defaults to `undefined`]                                             |

### Return type

[**QuizImportJob**](QuizImportJob.md)

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

> QuizImportJob retrieve(id)

Import quizzes/question banks from a QTI / Common Cartridge export (e.g. exported from Canvas or another LMS). create: Upload a QTI / Common Cartridge export (multipart &#x60;&#x60;file&#x60;&#x60;) for a &#x60;&#x60;course&#x60;&#x60;. Optionally target an existing bank (&#x60;&#x60;targetBankId&#x60;&#x60;) or name a new one (&#x60;&#x60;bankName&#x60;&#x60;). Parsing runs asynchronously; poll the returned job via &#x60;&#x60;retrieve&#x60;&#x60;. retrieve: Return the import job\&#39;s current status, counts, and parse summary.

### Example

```ts
import { Configuration, QuizImportJobsApi } from '';
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
  const api = new QuizImportJobsApi(config);

  const body = {
    // number | A unique integer value identifying this quiz import job.
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

| Name   | Type     | Description                                              | Notes                     |
| ------ | -------- | -------------------------------------------------------- | ------------------------- |
| **id** | `number` | A unique integer value identifying this quiz import job. | [Defaults to `undefined`] |

### Return type

[**QuizImportJob**](QuizImportJob.md)

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

> QuizImportJob update(id, id2, course, status, taskId, targetBank, createdQuizCount, createdQuestionCount, errorMessage, summary, created)

Import quizzes/question banks from a QTI / Common Cartridge export (e.g. exported from Canvas or another LMS). create: Upload a QTI / Common Cartridge export (multipart &#x60;&#x60;file&#x60;&#x60;) for a &#x60;&#x60;course&#x60;&#x60;. Optionally target an existing bank (&#x60;&#x60;targetBankId&#x60;&#x60;) or name a new one (&#x60;&#x60;bankName&#x60;&#x60;). Parsing runs asynchronously; poll the returned job via &#x60;&#x60;retrieve&#x60;&#x60;. retrieve: Return the import job\&#39;s current status, counts, and parse summary.

### Example

```ts
import {
  Configuration,
  QuizImportJobsApi,
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
  const api = new QuizImportJobsApi(config);

  const body = {
    // number | A unique integer value identifying this quiz import job.
    id: 56,
    // number
    id2: 56,
    // number | The related course_id.
    course: 56,
    // QuizImportJobStatusEnum | Current status of the import job.  * `pending` - Pending * `running` - Running * `completed` - Completed * `failed` - Failed
    status: ...,
    // string | Celery task id for polling.
    taskId: taskId_example,
    // number | The bank imported questions land in. Created if absent.
    targetBank: 56,
    // number | Number of quizzes created.
    createdQuizCount: 56,
    // number | Number of questions created.
    createdQuestionCount: 56,
    // string | Error detail if the job failed.
    errorMessage: errorMessage_example,
    // string | Per-item parse report, including skipped/unsupported types.
    summary: summary_example,
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

| Name                     | Type                      | Description                                                                                                                                                         | Notes                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| **id**                   | `number`                  | A unique integer value identifying this quiz import job.                                                                                                            | [Defaults to `undefined`]                                             |
| **id2**                  | `number`                  |                                                                                                                                                                     | [Defaults to `undefined`]                                             |
| **course**               | `number`                  | The related course_id.                                                                                                                                              | [Defaults to `undefined`]                                             |
| **status**               | `QuizImportJobStatusEnum` | Current status of the import job. * &#x60;pending&#x60; - Pending * &#x60;running&#x60; - Running * &#x60;completed&#x60; - Completed * &#x60;failed&#x60; - Failed | [Defaults to `undefined`] [Enum: pending, running, completed, failed] |
| **taskId**               | `string`                  | Celery task id for polling.                                                                                                                                         | [Defaults to `undefined`]                                             |
| **targetBank**           | `number`                  | The bank imported questions land in. Created if absent.                                                                                                             | [Defaults to `undefined`]                                             |
| **createdQuizCount**     | `number`                  | Number of quizzes created.                                                                                                                                          | [Defaults to `undefined`]                                             |
| **createdQuestionCount** | `number`                  | Number of questions created.                                                                                                                                        | [Defaults to `undefined`]                                             |
| **errorMessage**         | `string`                  | Error detail if the job failed.                                                                                                                                     | [Defaults to `undefined`]                                             |
| **summary**              | `string`                  | Per-item parse report, including skipped/unsupported types.                                                                                                         | [Defaults to `undefined`]                                             |
| **created**              | `string`                  |                                                                                                                                                                     | [Defaults to `undefined`]                                             |

### Return type

[**QuizImportJob**](QuizImportJob.md)

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
