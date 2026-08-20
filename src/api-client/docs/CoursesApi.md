# CoursesApi

All URIs are relative to *http://localhost*

| Method                                                                                   | HTTP request                                  | Description |
| ---------------------------------------------------------------------------------------- | --------------------------------------------- | ----------- |
| [**addToRosterPartialUpdate**](CoursesApi.md#addtorosterpartialupdate)                   | **PATCH** /courses/{id}/addToRoster/          |             |
| [**aiModelsRetrieve**](CoursesApi.md#aimodelsretrieve)                                   | **GET** /courses/{id}/aiModels/               |             |
| [**aiSettingsPartialUpdate**](CoursesApi.md#aisettingspartialupdate)                     | **PATCH** /courses/{id}/aiSettings/           |             |
| [**aiSettingsRetrieve**](CoursesApi.md#aisettingsretrieve)                               | **GET** /courses/{id}/aiSettings/             |             |
| [**aiTestCreate**](CoursesApi.md#aitestcreate)                                           | **POST** /courses/{id}/aiTest/                |             |
| [**aiUsageRetrieve**](CoursesApi.md#aiusageretrieve)                                     | **GET** /courses/{id}/aiUsage/                |             |
| [**apiKeysCreate**](CoursesApi.md#apikeyscreate)                                         | **POST** /courses/{id}/apiKeys/               |             |
| [**apiKeysDestroy**](CoursesApi.md#apikeysdestroy)                                       | **DELETE** /courses/{id}/apiKeys/{keyId}/     |             |
| [**apiKeysPartialUpdate**](CoursesApi.md#apikeyspartialupdate)                           | **PATCH** /courses/{id}/apiKeys/{keyId}/      |             |
| [**apiKeysRetrieve**](CoursesApi.md#apikeysretrieve)                                     | **GET** /courses/{id}/apiKeys/                |             |
| [**auditLogExportRetrieve**](CoursesApi.md#auditlogexportretrieve)                       | **GET** /courses/{id}/auditLogExport/         |             |
| [**auditLogList**](CoursesApi.md#auditloglist)                                           | **GET** /courses/{id}/auditLog/               |             |
| [**capabilitiesRetrieve**](CoursesApi.md#capabilitiesretrieve)                           | **GET** /courses/{id}/capabilities/           |             |
| [**changeInviteCodePartialUpdate**](CoursesApi.md#changeinvitecodepartialupdate)         | **PATCH** /courses/{id}/changeInviteCode/     |             |
| [**courseSettingsPartialUpdate**](CoursesApi.md#coursesettingspartialupdate)             | **PATCH** /courses/{id}/courseSettings/       |             |
| [**courseSettingsRetrieve**](CoursesApi.md#coursesettingsretrieve)                       | **GET** /courses/{id}/courseSettings/         |             |
| [**create**](CoursesApi.md#create)                                                       | **POST** /courses/                            |             |
| [**deleteRubricCategoryPartialUpdate**](CoursesApi.md#deleterubriccategorypartialupdate) | **PATCH** /courses/{id}/deleteRubricCategory/ |             |
| [**destroy**](CoursesApi.md#destroy)                                                     | **DELETE** /courses/{id}/                     |             |
| [**gradebookExportRetrieve**](CoursesApi.md#gradebookexportretrieve)                     | **GET** /courses/{id}/gradebookExport/        |             |
| [**gradebookRetrieve**](CoursesApi.md#gradebookretrieve)                                 | **GET** /courses/{id}/gradebook/              |             |
| [**list**](CoursesApi.md#list)                                                           | **GET** /courses/                             |             |
| [**partialUpdate**](CoursesApi.md#partialupdate)                                         | **PATCH** /courses/{id}/                      |             |
| [**questionBanksList**](CoursesApi.md#questionbankslist)                                 | **GET** /courses/{id}/questionBanks/          |             |
| [**questionsList**](CoursesApi.md#questionslist)                                         | **GET** /courses/{id}/questions/              |             |
| [**quizAccommodationsList**](CoursesApi.md#quizaccommodationslist)                       | **GET** /courses/{id}/quizAccommodations/     |             |
| [**quizGradingProgressRetrieve**](CoursesApi.md#quizgradingprogressretrieve)             | **GET** /courses/{id}/quizGradingProgress/    |             |
| [**quizzesList**](CoursesApi.md#quizzeslist)                                             | **GET** /courses/{id}/quizzes/                |             |
| [**removeFromRosterPartialUpdate**](CoursesApi.md#removefromrosterpartialupdate)         | **PATCH** /courses/{id}/removeFromRoster/     |             |
| [**retrieve**](CoursesApi.md#retrieve)                                                   | **GET** /courses/{id}/                        |             |
| [**rosterMapPartialUpdate**](CoursesApi.md#rostermappartialupdate)                       | **PATCH** /courses/{id}/rosterMap/            |             |
| [**rosterMapRetrieve**](CoursesApi.md#rostermapretrieve)                                 | **GET** /courses/{id}/rosterMap/              |             |
| [**rosterPartialUpdate**](CoursesApi.md#rosterpartialupdate)                             | **PATCH** /courses/{id}/roster/               |             |
| [**rosterRetrieve**](CoursesApi.md#rosterretrieve)                                       | **GET** /courses/{id}/roster/                 |             |
| [**sectionsList**](CoursesApi.md#sectionslist)                                           | **GET** /courses/{id}/sections/               |             |
| [**setQuizAccommodationPartialUpdate**](CoursesApi.md#setquizaccommodationpartialupdate) | **PATCH** /courses/{id}/setQuizAccommodation/ |             |
| [**studentCaptionsPartialUpdate**](CoursesApi.md#studentcaptionspartialupdate)           | **PATCH** /courses/{id}/studentCaptions/      |             |
| [**studentCaptionsRetrieve**](CoursesApi.md#studentcaptionsretrieve)                     | **GET** /courses/{id}/studentCaptions/        |             |
| [**update**](CoursesApi.md#update)                                                       | **PUT** /courses/{id}/                        |             |

## addToRosterPartialUpdate

> CourseRoster addToRosterPartialUpdate(id, patchedCourse)

get: Show the roster for a course. patch: Update the roster for a course.

### Example

```ts
import {
  Configuration,
  CoursesApi,
} from '';
import type { AddToRosterPartialUpdateRequest } from '';

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
  const api = new CoursesApi(config);

  const body = {
    // number | A unique integer value identifying this course.
    id: 56,
    // PatchedCourse (optional)
    patchedCourse: ...,
  } satisfies AddToRosterPartialUpdateRequest;

  try {
    const data = await api.addToRosterPartialUpdate(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name              | Type                              | Description                                     | Notes                     |
| ----------------- | --------------------------------- | ----------------------------------------------- | ------------------------- |
| **id**            | `number`                          | A unique integer value identifying this course. | [Defaults to `undefined`] |
| **patchedCourse** | [PatchedCourse](PatchedCourse.md) |                                                 | [Optional]                |

### Return type

[**CourseRoster**](CourseRoster.md)

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

## aiModelsRetrieve

> AIProviderModelsList aiModelsRetrieve(id)

GET: Return curated AI models for the course\&#39;s effective provider. Also queries the provider\&#39;s API for live model listings using the course\&#39;s own credentials or inherited org credentials. Only accessible by course admins.

### Example

```ts
import { Configuration, CoursesApi } from '';
import type { AiModelsRetrieveRequest } from '';

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
  const api = new CoursesApi(config);

  const body = {
    // number | A unique integer value identifying this course.
    id: 56,
  } satisfies AiModelsRetrieveRequest;

  try {
    const data = await api.aiModelsRetrieve(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name   | Type     | Description                                     | Notes                     |
| ------ | -------- | ----------------------------------------------- | ------------------------- |
| **id** | `number` | A unique integer value identifying this course. | [Defaults to `undefined`] |

### Return type

[**AIProviderModelsList**](AIProviderModelsList.md)

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

## aiSettingsPartialUpdate

> CourseAISettings aiSettingsPartialUpdate(id, patchedCourseAISettings)

get: Get AI configuration for the course. patch: Update AI configuration for the course. Admin-only.

### Example

```ts
import {
  Configuration,
  CoursesApi,
} from '';
import type { AiSettingsPartialUpdateRequest } from '';

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
  const api = new CoursesApi(config);

  const body = {
    // number | A unique integer value identifying this course.
    id: 56,
    // PatchedCourseAISettings (optional)
    patchedCourseAISettings: ...,
  } satisfies AiSettingsPartialUpdateRequest;

  try {
    const data = await api.aiSettingsPartialUpdate(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                        | Type                                                  | Description                                     | Notes                     |
| --------------------------- | ----------------------------------------------------- | ----------------------------------------------- | ------------------------- |
| **id**                      | `number`                                              | A unique integer value identifying this course. | [Defaults to `undefined`] |
| **patchedCourseAISettings** | [PatchedCourseAISettings](PatchedCourseAISettings.md) |                                                 | [Optional]                |

### Return type

[**CourseAISettings**](CourseAISettings.md)

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

## aiSettingsRetrieve

> CourseAISettings aiSettingsRetrieve(id)

get: Get AI configuration for the course. patch: Update AI configuration for the course. Admin-only.

### Example

```ts
import { Configuration, CoursesApi } from '';
import type { AiSettingsRetrieveRequest } from '';

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
  const api = new CoursesApi(config);

  const body = {
    // number | A unique integer value identifying this course.
    id: 56,
  } satisfies AiSettingsRetrieveRequest;

  try {
    const data = await api.aiSettingsRetrieve(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name   | Type     | Description                                     | Notes                     |
| ------ | -------- | ----------------------------------------------- | ------------------------- |
| **id** | `number` | A unique integer value identifying this course. | [Defaults to `undefined`] |

### Return type

[**CourseAISettings**](CourseAISettings.md)

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

## aiTestCreate

> AIProviderTestResult aiTestCreate(id, aIProviderTestRequest)

POST: Fire a small completion through the course\&#39;s effective AI config (own settings or inherited org settings) and report success, latency, and any error. Accepts an optional custom prompt and a one-off model override. Recorded in AI usage as \&#39;provider_test\&#39;. Only accessible by course admins.

### Example

```ts
import {
  Configuration,
  CoursesApi,
} from '';
import type { AiTestCreateRequest } from '';

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
  const api = new CoursesApi(config);

  const body = {
    // number | A unique integer value identifying this course.
    id: 56,
    // AIProviderTestRequest (optional)
    aIProviderTestRequest: ...,
  } satisfies AiTestCreateRequest;

  try {
    const data = await api.aiTestCreate(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                      | Type                                              | Description                                     | Notes                     |
| ------------------------- | ------------------------------------------------- | ----------------------------------------------- | ------------------------- |
| **id**                    | `number`                                          | A unique integer value identifying this course. | [Defaults to `undefined`] |
| **aIProviderTestRequest** | [AIProviderTestRequest](AIProviderTestRequest.md) |                                                 | [Optional]                |

### Return type

[**AIProviderTestResult**](AIProviderTestResult.md)

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

## aiUsageRetrieve

> AIUsageSummary aiUsageRetrieve(id, endDate, granularity, startDate)

Returns AI usage analytics for the course. Includes time-series data and per-assignment breakdown. Only accessible by course admins.

### Example

```ts
import { Configuration, CoursesApi } from '';
import type { AiUsageRetrieveRequest } from '';

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
  const api = new CoursesApi(config);

  const body = {
    // number | A unique integer value identifying this course.
    id: 56,
    // string | End date (ISO 8601) (optional)
    endDate: endDate_example,
    // 'daily' | 'hourly' | 'monthly' | Time bucket granularity: \'hourly\', \'daily\', or \'monthly\' (optional)
    granularity: granularity_example,
    // string | Start date (ISO 8601) (optional)
    startDate: startDate_example,
  } satisfies AiUsageRetrieveRequest;

  try {
    const data = await api.aiUsageRetrieve(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name            | Type                         | Description                                                                            | Notes                                                               |
| --------------- | ---------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| **id**          | `number`                     | A unique integer value identifying this course.                                        | [Defaults to `undefined`]                                           |
| **endDate**     | `string`                     | End date (ISO 8601)                                                                    | [Optional] [Defaults to `undefined`]                                |
| **granularity** | `daily`, `hourly`, `monthly` | Time bucket granularity: \&#39;hourly\&#39;, \&#39;daily\&#39;, or \&#39;monthly\&#39; | [Optional] [Defaults to `undefined`] [Enum: daily, hourly, monthly] |
| **startDate**   | `string`                     | Start date (ISO 8601)                                                                  | [Optional] [Defaults to `undefined`]                                |

### Return type

[**AIUsageSummary**](AIUsageSummary.md)

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

## apiKeysCreate

> CourseAPIKeyCreateResponse apiKeysCreate(id, courseAPIKeyCreate)

List or create course-scoped API keys.

### Example

```ts
import {
  Configuration,
  CoursesApi,
} from '';
import type { ApiKeysCreateRequest } from '';

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
  const api = new CoursesApi(config);

  const body = {
    // number | A unique integer value identifying this course.
    id: 56,
    // CourseAPIKeyCreate
    courseAPIKeyCreate: ...,
  } satisfies ApiKeysCreateRequest;

  try {
    const data = await api.apiKeysCreate(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                   | Type                                        | Description                                     | Notes                     |
| ---------------------- | ------------------------------------------- | ----------------------------------------------- | ------------------------- |
| **id**                 | `number`                                    | A unique integer value identifying this course. | [Defaults to `undefined`] |
| **courseAPIKeyCreate** | [CourseAPIKeyCreate](CourseAPIKeyCreate.md) |                                                 |                           |

### Return type

[**CourseAPIKeyCreateResponse**](CourseAPIKeyCreateResponse.md)

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

## apiKeysDestroy

> CourseAPIKeyRead apiKeysDestroy(id, keyId)

Update or revoke a single course API key.

### Example

```ts
import { Configuration, CoursesApi } from '';
import type { ApiKeysDestroyRequest } from '';

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
  const api = new CoursesApi(config);

  const body = {
    // number | A unique integer value identifying this course.
    id: 56,
    // string
    keyId: keyId_example,
  } satisfies ApiKeysDestroyRequest;

  try {
    const data = await api.apiKeysDestroy(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name      | Type     | Description                                     | Notes                     |
| --------- | -------- | ----------------------------------------------- | ------------------------- |
| **id**    | `number` | A unique integer value identifying this course. | [Defaults to `undefined`] |
| **keyId** | `string` |                                                 | [Defaults to `undefined`] |

### Return type

[**CourseAPIKeyRead**](CourseAPIKeyRead.md)

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

## apiKeysPartialUpdate

> CourseAPIKeyRead apiKeysPartialUpdate(id, keyId, patchedCourse)

Update or revoke a single course API key.

### Example

```ts
import {
  Configuration,
  CoursesApi,
} from '';
import type { ApiKeysPartialUpdateRequest } from '';

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
  const api = new CoursesApi(config);

  const body = {
    // number | A unique integer value identifying this course.
    id: 56,
    // string
    keyId: keyId_example,
    // PatchedCourse (optional)
    patchedCourse: ...,
  } satisfies ApiKeysPartialUpdateRequest;

  try {
    const data = await api.apiKeysPartialUpdate(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name              | Type                              | Description                                     | Notes                     |
| ----------------- | --------------------------------- | ----------------------------------------------- | ------------------------- |
| **id**            | `number`                          | A unique integer value identifying this course. | [Defaults to `undefined`] |
| **keyId**         | `string`                          |                                                 | [Defaults to `undefined`] |
| **patchedCourse** | [PatchedCourse](PatchedCourse.md) |                                                 | [Optional]                |

### Return type

[**CourseAPIKeyRead**](CourseAPIKeyRead.md)

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

## apiKeysRetrieve

> CourseAPIKeyCreateResponse apiKeysRetrieve(id)

List or create course-scoped API keys.

### Example

```ts
import { Configuration, CoursesApi } from '';
import type { ApiKeysRetrieveRequest } from '';

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
  const api = new CoursesApi(config);

  const body = {
    // number | A unique integer value identifying this course.
    id: 56,
  } satisfies ApiKeysRetrieveRequest;

  try {
    const data = await api.apiKeysRetrieve(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name   | Type     | Description                                     | Notes                     |
| ------ | -------- | ----------------------------------------------- | ------------------------- |
| **id** | `number` | A unique integer value identifying this course. | [Defaults to `undefined`] |

### Return type

[**CourseAPIKeyCreateResponse**](CourseAPIKeyCreateResponse.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [courseKeyAuth](../README.md#courseKeyAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **201**     |             | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## auditLogExportRetrieve

> string auditLogExportRetrieve(id, assignment, dateFrom, dateTo, eventType, student)

Export audit events for a course as CSV.

### Example

```ts
import {
  Configuration,
  CoursesApi,
} from '';
import type { AuditLogExportRetrieveRequest } from '';

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
  const api = new CoursesApi(config);

  const body = {
    // number | A unique integer value identifying this course.
    id: 56,
    // number (optional)
    assignment: 56,
    // string (optional)
    dateFrom: 2013-10-20T19:20:30+01:00,
    // string (optional)
    dateTo: 2013-10-20T19:20:30+01:00,
    // string (optional)
    eventType: eventType_example,
    // string (optional)
    student: student_example,
  } satisfies AuditLogExportRetrieveRequest;

  try {
    const data = await api.auditLogExportRetrieve(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name           | Type     | Description                                     | Notes                                |
| -------------- | -------- | ----------------------------------------------- | ------------------------------------ |
| **id**         | `number` | A unique integer value identifying this course. | [Defaults to `undefined`]            |
| **assignment** | `number` |                                                 | [Optional] [Defaults to `undefined`] |
| **dateFrom**   | `string` |                                                 | [Optional] [Defaults to `undefined`] |
| **dateTo**     | `string` |                                                 | [Optional] [Defaults to `undefined`] |
| **eventType**  | `string` |                                                 | [Optional] [Defaults to `undefined`] |
| **student**    | `string` |                                                 | [Optional] [Defaults to `undefined`] |

### Return type

**string**

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [courseKeyAuth](../README.md#courseKeyAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `text/csv`

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **200**     |             | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## auditLogList

> PaginatedCourseAuditEventList auditLogList(id, assignment, dateFrom, dateTo, eventType, page, pageSize, student)

Return paginated audit events for a course, filterable by student, assignment, event type, and date range.

### Example

```ts
import {
  Configuration,
  CoursesApi,
} from '';
import type { AuditLogListRequest } from '';

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
  const api = new CoursesApi(config);

  const body = {
    // number | A unique integer value identifying this course.
    id: 56,
    // number | Filter by assignment ID (optional)
    assignment: 56,
    // string | Filter events after this datetime (optional)
    dateFrom: 2013-10-20T19:20:30+01:00,
    // string | Filter events before this datetime (optional)
    dateTo: 2013-10-20T19:20:30+01:00,
    // string | Filter by event type (optional)
    eventType: eventType_example,
    // number | A page number within the paginated result set. (optional)
    page: 56,
    // number | Number of results to return per page. (optional)
    pageSize: 56,
    // string | Filter by student email (optional)
    student: student_example,
  } satisfies AuditLogListRequest;

  try {
    const data = await api.auditLogList(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name           | Type     | Description                                     | Notes                                |
| -------------- | -------- | ----------------------------------------------- | ------------------------------------ |
| **id**         | `number` | A unique integer value identifying this course. | [Defaults to `undefined`]            |
| **assignment** | `number` | Filter by assignment ID                         | [Optional] [Defaults to `undefined`] |
| **dateFrom**   | `string` | Filter events after this datetime               | [Optional] [Defaults to `undefined`] |
| **dateTo**     | `string` | Filter events before this datetime              | [Optional] [Defaults to `undefined`] |
| **eventType**  | `string` | Filter by event type                            | [Optional] [Defaults to `undefined`] |
| **page**       | `number` | A page number within the paginated result set.  | [Optional] [Defaults to `undefined`] |
| **pageSize**   | `number` | Number of results to return per page.           | [Optional] [Defaults to `undefined`] |
| **student**    | `string` | Filter by student email                         | [Optional] [Defaults to `undefined`] |

### Return type

[**PaginatedCourseAuditEventList**](PaginatedCourseAuditEventList.md)

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

## capabilitiesRetrieve

> CapabilitiesResponse capabilitiesRetrieve(id, descriptions)

Return the requesting user\&#39;s capabilities for this course.

### Example

```ts
import { Configuration, CoursesApi } from '';
import type { CapabilitiesRetrieveRequest } from '';

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
  const api = new CoursesApi(config);

  const body = {
    // number | A unique integer value identifying this course.
    id: 56,
    // boolean | Include human-readable descriptions for each capability. (optional)
    descriptions: true,
  } satisfies CapabilitiesRetrieveRequest;

  try {
    const data = await api.capabilitiesRetrieve(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name             | Type      | Description                                              | Notes                                |
| ---------------- | --------- | -------------------------------------------------------- | ------------------------------------ |
| **id**           | `number`  | A unique integer value identifying this course.          | [Defaults to `undefined`]            |
| **descriptions** | `boolean` | Include human-readable descriptions for each capability. | [Optional] [Defaults to `undefined`] |

### Return type

[**CapabilitiesResponse**](CapabilitiesResponse.md)

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

## changeInviteCodePartialUpdate

> string changeInviteCodePartialUpdate(id, patchedCourse)

list: Return a list of all the courses. create: Create a new course. retrieve: Return the given course. update: Update a course. partial_update: Update a course. delete: Delete a course

### Example

```ts
import {
  Configuration,
  CoursesApi,
} from '';
import type { ChangeInviteCodePartialUpdateRequest } from '';

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
  const api = new CoursesApi(config);

  const body = {
    // number | A unique integer value identifying this course.
    id: 56,
    // PatchedCourse (optional)
    patchedCourse: ...,
  } satisfies ChangeInviteCodePartialUpdateRequest;

  try {
    const data = await api.changeInviteCodePartialUpdate(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name              | Type                              | Description                                     | Notes                     |
| ----------------- | --------------------------------- | ----------------------------------------------- | ------------------------- |
| **id**            | `number`                          | A unique integer value identifying this course. | [Defaults to `undefined`] |
| **patchedCourse** | [PatchedCourse](PatchedCourse.md) |                                                 | [Optional]                |

### Return type

**string**

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

## courseSettingsPartialUpdate

> CourseSettings courseSettingsPartialUpdate(id, patchedCourse)

list: Return a list of all the courses. create: Create a new course. retrieve: Return the given course. update: Update a course. partial_update: Update a course. delete: Delete a course

### Example

```ts
import {
  Configuration,
  CoursesApi,
} from '';
import type { CourseSettingsPartialUpdateRequest } from '';

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
  const api = new CoursesApi(config);

  const body = {
    // number | A unique integer value identifying this course.
    id: 56,
    // PatchedCourse (optional)
    patchedCourse: ...,
  } satisfies CourseSettingsPartialUpdateRequest;

  try {
    const data = await api.courseSettingsPartialUpdate(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name              | Type                              | Description                                     | Notes                     |
| ----------------- | --------------------------------- | ----------------------------------------------- | ------------------------- |
| **id**            | `number`                          | A unique integer value identifying this course. | [Defaults to `undefined`] |
| **patchedCourse** | [PatchedCourse](PatchedCourse.md) |                                                 | [Optional]                |

### Return type

[**CourseSettings**](CourseSettings.md)

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

## courseSettingsRetrieve

> CourseSettings courseSettingsRetrieve(id)

list: Return a list of all the courses. create: Create a new course. retrieve: Return the given course. update: Update a course. partial_update: Update a course. delete: Delete a course

### Example

```ts
import { Configuration, CoursesApi } from '';
import type { CourseSettingsRetrieveRequest } from '';

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
  const api = new CoursesApi(config);

  const body = {
    // number | A unique integer value identifying this course.
    id: 56,
  } satisfies CourseSettingsRetrieveRequest;

  try {
    const data = await api.courseSettingsRetrieve(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name   | Type     | Description                                     | Notes                     |
| ------ | -------- | ----------------------------------------------- | ------------------------- |
| **id** | `number` | A unique integer value identifying this course. | [Defaults to `undefined`] |

### Return type

[**CourseSettings**](CourseSettings.md)

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

> Course create(course)

list: Return a list of all the courses. create: Create a new course. retrieve: Return the given course. update: Update a course. partial_update: Update a course. delete: Delete a course

### Example

```ts
import {
  Configuration,
  CoursesApi,
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
  const api = new CoursesApi(config);

  const body = {
    // Course
    course: ...,
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

| Name       | Type                | Description | Notes |
| ---------- | ------------------- | ----------- | ----- |
| **course** | [Course](Course.md) |             |       |

### Return type

[**Course**](Course.md)

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

## deleteRubricCategoryPartialUpdate

> deleteRubricCategoryPartialUpdate(id, patchedCourse)

list: Return a list of all the courses. create: Create a new course. retrieve: Return the given course. update: Update a course. partial_update: Update a course. delete: Delete a course

### Example

```ts
import {
  Configuration,
  CoursesApi,
} from '';
import type { DeleteRubricCategoryPartialUpdateRequest } from '';

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
  const api = new CoursesApi(config);

  const body = {
    // number | A unique integer value identifying this course.
    id: 56,
    // PatchedCourse (optional)
    patchedCourse: ...,
  } satisfies DeleteRubricCategoryPartialUpdateRequest;

  try {
    const data = await api.deleteRubricCategoryPartialUpdate(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name              | Type                              | Description                                     | Notes                     |
| ----------------- | --------------------------------- | ----------------------------------------------- | ------------------------- |
| **id**            | `number`                          | A unique integer value identifying this course. | [Defaults to `undefined`] |
| **patchedCourse** | [PatchedCourse](PatchedCourse.md) |                                                 | [Optional]                |

### Return type

`void` (Empty response body)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [courseKeyAuth](../README.md#courseKeyAuth)

### HTTP request headers

- **Content-Type**: `application/json`, `application/x-www-form-urlencoded`, `multipart/form-data`
- **Accept**: Not defined

### HTTP response details

| Status code | Description      | Response headers |
| ----------- | ---------------- | ---------------- |
| **204**     | No response body | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## destroy

> destroy(id)

list: Return a list of all the courses. create: Create a new course. retrieve: Return the given course. update: Update a course. partial_update: Update a course. delete: Delete a course

### Example

```ts
import { Configuration, CoursesApi } from '';
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
  const api = new CoursesApi(config);

  const body = {
    // number | A unique integer value identifying this course.
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

| Name   | Type     | Description                                     | Notes                     |
| ------ | -------- | ----------------------------------------------- | ------------------------- |
| **id** | `number` | A unique integer value identifying this course. | [Defaults to `undefined`] |

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

## gradebookExportRetrieve

> string gradebookExportRetrieve(id, assignments, quizzes, section)

Export the course gradebook as CSV (course admins only). Same data as the gradebook endpoint: one row per active student, blank cells for pending/missing. Totals are computed over the included columns only.

### Example

```ts
import { Configuration, CoursesApi } from '';
import type { GradebookExportRetrieveRequest } from '';

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
  const api = new CoursesApi(config);

  const body = {
    // number | A unique integer value identifying this course.
    id: 56,
    // string | Comma-separated assignment ids to include; omit for all. (optional)
    assignments: assignments_example,
    // string | Comma-separated quiz ids to include; omit for all. (optional)
    quizzes: quizzes_example,
    // string | Restrict rows to students in this section. (optional)
    section: section_example,
  } satisfies GradebookExportRetrieveRequest;

  try {
    const data = await api.gradebookExportRetrieve(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name            | Type     | Description                                              | Notes                                |
| --------------- | -------- | -------------------------------------------------------- | ------------------------------------ |
| **id**          | `number` | A unique integer value identifying this course.          | [Defaults to `undefined`]            |
| **assignments** | `string` | Comma-separated assignment ids to include; omit for all. | [Optional] [Defaults to `undefined`] |
| **quizzes**     | `string` | Comma-separated quiz ids to include; omit for all.       | [Optional] [Defaults to `undefined`] |
| **section**     | `string` | Restrict rows to students in this section.               | [Optional] [Defaults to `undefined`] |

### Return type

**string**

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [courseKeyAuth](../README.md#courseKeyAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `text/csv`

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **200**     |             | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## gradebookRetrieve

> GradebookResponse gradebookRetrieve(id)

The course gradebook: every active student × every assignment and quiz, with totals over graded work (course admins only).

### Example

```ts
import { Configuration, CoursesApi } from '';
import type { GradebookRetrieveRequest } from '';

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
  const api = new CoursesApi(config);

  const body = {
    // number | A unique integer value identifying this course.
    id: 56,
  } satisfies GradebookRetrieveRequest;

  try {
    const data = await api.gradebookRetrieve(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name   | Type     | Description                                     | Notes                     |
| ------ | -------- | ----------------------------------------------- | ------------------------- |
| **id** | `number` | A unique integer value identifying this course. | [Defaults to `undefined`] |

### Return type

[**GradebookResponse**](GradebookResponse.md)

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

> Array&lt;Course&gt; list()

list: Return a list of all the courses. create: Create a new course. retrieve: Return the given course. update: Update a course. partial_update: Update a course. delete: Delete a course

### Example

```ts
import { Configuration, CoursesApi } from '';
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
  const api = new CoursesApi(config);

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

[**Array&lt;Course&gt;**](Course.md)

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

> Course partialUpdate(id, patchedCourse)

list: Return a list of all the courses. create: Create a new course. retrieve: Return the given course. update: Update a course. partial_update: Update a course. delete: Delete a course

### Example

```ts
import {
  Configuration,
  CoursesApi,
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
  const api = new CoursesApi(config);

  const body = {
    // number | A unique integer value identifying this course.
    id: 56,
    // PatchedCourse (optional)
    patchedCourse: ...,
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

| Name              | Type                              | Description                                     | Notes                     |
| ----------------- | --------------------------------- | ----------------------------------------------- | ------------------------- |
| **id**            | `number`                          | A unique integer value identifying this course. | [Defaults to `undefined`] |
| **patchedCourse** | [PatchedCourse](PatchedCourse.md) |                                                 | [Optional]                |

### Return type

[**Course**](Course.md)

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

## questionBanksList

> Array&lt;QuestionBank&gt; questionBanksList(id)

List the course\&#39;s quiz question banks (staff only).

### Example

```ts
import { Configuration, CoursesApi } from '';
import type { QuestionBanksListRequest } from '';

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
  const api = new CoursesApi(config);

  const body = {
    // number | A unique integer value identifying this course.
    id: 56,
  } satisfies QuestionBanksListRequest;

  try {
    const data = await api.questionBanksList(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name   | Type     | Description                                     | Notes                     |
| ------ | -------- | ----------------------------------------------- | ------------------------- |
| **id** | `number` | A unique integer value identifying this course. | [Defaults to `undefined`] |

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

## questionsList

> Array&lt;Question&gt; questionsList(id)

List the course\&#39;s quiz questions (staff only).

### Example

```ts
import { Configuration, CoursesApi } from '';
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
  const api = new CoursesApi(config);

  const body = {
    // number | A unique integer value identifying this course.
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

| Name   | Type     | Description                                     | Notes                     |
| ------ | -------- | ----------------------------------------------- | ------------------------- |
| **id** | `number` | A unique integer value identifying this course. | [Defaults to `undefined`] |

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

## quizAccommodationsList

> Array&lt;QuizAccommodationRow&gt; quizAccommodationsList(id)

List per-student quiz extra-time accommodations (course admins only).

### Example

```ts
import { Configuration, CoursesApi } from '';
import type { QuizAccommodationsListRequest } from '';

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
  const api = new CoursesApi(config);

  const body = {
    // number | A unique integer value identifying this course.
    id: 56,
  } satisfies QuizAccommodationsListRequest;

  try {
    const data = await api.quizAccommodationsList(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name   | Type     | Description                                     | Notes                     |
| ------ | -------- | ----------------------------------------------- | ------------------------- |
| **id** | `number` | A unique integer value identifying this course. | [Defaults to `undefined`] |

### Return type

[**Array&lt;QuizAccommodationRow&gt;**](QuizAccommodationRow.md)

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

## quizGradingProgressRetrieve

> QuizGradingProgress quizGradingProgressRetrieve(id)

Per-grader manual quiz-grading progress across the course\&#39;s published quizzes (submitted attempts only). perQuiz keys are quiz ids; graders who left the course keep their rows (accountability, not a roster).

### Example

```ts
import { Configuration, CoursesApi } from '';
import type { QuizGradingProgressRetrieveRequest } from '';

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
  const api = new CoursesApi(config);

  const body = {
    // number | A unique integer value identifying this course.
    id: 56,
  } satisfies QuizGradingProgressRetrieveRequest;

  try {
    const data = await api.quizGradingProgressRetrieve(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name   | Type     | Description                                     | Notes                     |
| ------ | -------- | ----------------------------------------------- | ------------------------- |
| **id** | `number` | A unique integer value identifying this course. | [Defaults to `undefined`] |

### Return type

[**QuizGradingProgress**](QuizGradingProgress.md)

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

## quizzesList

> Array&lt;Quiz&gt; quizzesList(id)

List the course\&#39;s quizzes (staff only).

### Example

```ts
import { Configuration, CoursesApi } from '';
import type { QuizzesListRequest } from '';

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
  const api = new CoursesApi(config);

  const body = {
    // number | A unique integer value identifying this course.
    id: 56,
  } satisfies QuizzesListRequest;

  try {
    const data = await api.quizzesList(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name   | Type     | Description                                     | Notes                     |
| ------ | -------- | ----------------------------------------------- | ------------------------- |
| **id** | `number` | A unique integer value identifying this course. | [Defaults to `undefined`] |

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

## removeFromRosterPartialUpdate

> CourseRoster removeFromRosterPartialUpdate(id, patchedCourse)

get: Show the roster for a course. patch: Update the roster for a course.

### Example

```ts
import {
  Configuration,
  CoursesApi,
} from '';
import type { RemoveFromRosterPartialUpdateRequest } from '';

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
  const api = new CoursesApi(config);

  const body = {
    // number | A unique integer value identifying this course.
    id: 56,
    // PatchedCourse (optional)
    patchedCourse: ...,
  } satisfies RemoveFromRosterPartialUpdateRequest;

  try {
    const data = await api.removeFromRosterPartialUpdate(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name              | Type                              | Description                                     | Notes                     |
| ----------------- | --------------------------------- | ----------------------------------------------- | ------------------------- |
| **id**            | `number`                          | A unique integer value identifying this course. | [Defaults to `undefined`] |
| **patchedCourse** | [PatchedCourse](PatchedCourse.md) |                                                 | [Optional]                |

### Return type

[**CourseRoster**](CourseRoster.md)

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

> Course retrieve(id)

list: Return a list of all the courses. create: Create a new course. retrieve: Return the given course. update: Update a course. partial_update: Update a course. delete: Delete a course

### Example

```ts
import { Configuration, CoursesApi } from '';
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
  const api = new CoursesApi(config);

  const body = {
    // number | A unique integer value identifying this course.
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

| Name   | Type     | Description                                     | Notes                     |
| ------ | -------- | ----------------------------------------------- | ------------------------- |
| **id** | `number` | A unique integer value identifying this course. | [Defaults to `undefined`] |

### Return type

[**Course**](Course.md)

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

## rosterMapPartialUpdate

> CourseRosterMap rosterMapPartialUpdate(id, patchedCourseRosterMap)

list: Return a list of all the courses. create: Create a new course. retrieve: Return the given course. update: Update a course. partial_update: Update a course. delete: Delete a course

### Example

```ts
import {
  Configuration,
  CoursesApi,
} from '';
import type { RosterMapPartialUpdateRequest } from '';

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
  const api = new CoursesApi(config);

  const body = {
    // number | A unique integer value identifying this course.
    id: 56,
    // PatchedCourseRosterMap (optional)
    patchedCourseRosterMap: ...,
  } satisfies RosterMapPartialUpdateRequest;

  try {
    const data = await api.rosterMapPartialUpdate(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                       | Type                                                | Description                                     | Notes                     |
| -------------------------- | --------------------------------------------------- | ----------------------------------------------- | ------------------------- |
| **id**                     | `number`                                            | A unique integer value identifying this course. | [Defaults to `undefined`] |
| **patchedCourseRosterMap** | [PatchedCourseRosterMap](PatchedCourseRosterMap.md) |                                                 | [Optional]                |

### Return type

[**CourseRosterMap**](CourseRosterMap.md)

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

## rosterMapRetrieve

> CourseRosterMap rosterMapRetrieve(id)

list: Return a list of all the courses. create: Create a new course. retrieve: Return the given course. update: Update a course. partial_update: Update a course. delete: Delete a course

### Example

```ts
import { Configuration, CoursesApi } from '';
import type { RosterMapRetrieveRequest } from '';

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
  const api = new CoursesApi(config);

  const body = {
    // number | A unique integer value identifying this course.
    id: 56,
  } satisfies RosterMapRetrieveRequest;

  try {
    const data = await api.rosterMapRetrieve(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name   | Type     | Description                                     | Notes                     |
| ------ | -------- | ----------------------------------------------- | ------------------------- |
| **id** | `number` | A unique integer value identifying this course. | [Defaults to `undefined`] |

### Return type

[**CourseRosterMap**](CourseRosterMap.md)

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

## rosterPartialUpdate

> CourseRoster rosterPartialUpdate(id, patchedCourse)

get: Show the roster for a course. patch: Update the roster for a course.

### Example

```ts
import {
  Configuration,
  CoursesApi,
} from '';
import type { RosterPartialUpdateRequest } from '';

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
  const api = new CoursesApi(config);

  const body = {
    // number | A unique integer value identifying this course.
    id: 56,
    // PatchedCourse (optional)
    patchedCourse: ...,
  } satisfies RosterPartialUpdateRequest;

  try {
    const data = await api.rosterPartialUpdate(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name              | Type                              | Description                                     | Notes                     |
| ----------------- | --------------------------------- | ----------------------------------------------- | ------------------------- |
| **id**            | `number`                          | A unique integer value identifying this course. | [Defaults to `undefined`] |
| **patchedCourse** | [PatchedCourse](PatchedCourse.md) |                                                 | [Optional]                |

### Return type

[**CourseRoster**](CourseRoster.md)

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

## rosterRetrieve

> CourseRoster rosterRetrieve(id)

get: Show the roster for a course. patch: Update the roster for a course.

### Example

```ts
import { Configuration, CoursesApi } from '';
import type { RosterRetrieveRequest } from '';

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
  const api = new CoursesApi(config);

  const body = {
    // number | A unique integer value identifying this course.
    id: 56,
  } satisfies RosterRetrieveRequest;

  try {
    const data = await api.rosterRetrieve(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name   | Type     | Description                                     | Notes                     |
| ------ | -------- | ----------------------------------------------- | ------------------------- |
| **id** | `number` | A unique integer value identifying this course. | [Defaults to `undefined`] |

### Return type

[**CourseRoster**](CourseRoster.md)

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

## sectionsList

> PaginatedSectionList sectionsList(id, page, pageSize)

Gets a paginated list of sections for a course. We use this for performance for large courses to fetch sections in bulk. They\&#39;re rarely used in admin console operations, so it\&#39;s a great candidate to paginate Returns a list of Section objects

### Example

```ts
import { Configuration, CoursesApi } from '';
import type { SectionsListRequest } from '';

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
  const api = new CoursesApi(config);

  const body = {
    // number | A unique integer value identifying this course.
    id: 56,
    // number | A page number within the paginated result set. (optional)
    page: 56,
    // number | Number of results to return per page. (optional)
    pageSize: 56,
  } satisfies SectionsListRequest;

  try {
    const data = await api.sectionsList(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name         | Type     | Description                                     | Notes                                |
| ------------ | -------- | ----------------------------------------------- | ------------------------------------ |
| **id**       | `number` | A unique integer value identifying this course. | [Defaults to `undefined`]            |
| **page**     | `number` | A page number within the paginated result set.  | [Optional] [Defaults to `undefined`] |
| **pageSize** | `number` | Number of results to return per page.           | [Optional] [Defaults to `undefined`] |

### Return type

[**PaginatedSectionList**](PaginatedSectionList.md)

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

## setQuizAccommodationPartialUpdate

> QuizAccommodationRow setQuizAccommodationPartialUpdate(id, patchedQuizAccommodationRow)

Set a student\&#39;s quiz time multiplier (course admins only). A multiplier of 1 removes the accommodation.

### Example

```ts
import {
  Configuration,
  CoursesApi,
} from '';
import type { SetQuizAccommodationPartialUpdateRequest } from '';

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
  const api = new CoursesApi(config);

  const body = {
    // number | A unique integer value identifying this course.
    id: 56,
    // PatchedQuizAccommodationRow (optional)
    patchedQuizAccommodationRow: ...,
  } satisfies SetQuizAccommodationPartialUpdateRequest;

  try {
    const data = await api.setQuizAccommodationPartialUpdate(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                            | Type                                                          | Description                                     | Notes                     |
| ------------------------------- | ------------------------------------------------------------- | ----------------------------------------------- | ------------------------- |
| **id**                          | `number`                                                      | A unique integer value identifying this course. | [Defaults to `undefined`] |
| **patchedQuizAccommodationRow** | [PatchedQuizAccommodationRow](PatchedQuizAccommodationRow.md) |                                                 | [Optional]                |

### Return type

[**QuizAccommodationRow**](QuizAccommodationRow.md)

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

## studentCaptionsPartialUpdate

> CourseStudentCaptions studentCaptionsPartialUpdate(id, patchedCourseStudentCaptions)

list: Return a list of all the courses. create: Create a new course. retrieve: Return the given course. update: Update a course. partial_update: Update a course. delete: Delete a course

### Example

```ts
import {
  Configuration,
  CoursesApi,
} from '';
import type { StudentCaptionsPartialUpdateRequest } from '';

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
  const api = new CoursesApi(config);

  const body = {
    // number | A unique integer value identifying this course.
    id: 56,
    // PatchedCourseStudentCaptions (optional)
    patchedCourseStudentCaptions: ...,
  } satisfies StudentCaptionsPartialUpdateRequest;

  try {
    const data = await api.studentCaptionsPartialUpdate(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                             | Type                                                            | Description                                     | Notes                     |
| -------------------------------- | --------------------------------------------------------------- | ----------------------------------------------- | ------------------------- |
| **id**                           | `number`                                                        | A unique integer value identifying this course. | [Defaults to `undefined`] |
| **patchedCourseStudentCaptions** | [PatchedCourseStudentCaptions](PatchedCourseStudentCaptions.md) |                                                 | [Optional]                |

### Return type

[**CourseStudentCaptions**](CourseStudentCaptions.md)

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

## studentCaptionsRetrieve

> CourseStudentCaptions studentCaptionsRetrieve(id)

list: Return a list of all the courses. create: Create a new course. retrieve: Return the given course. update: Update a course. partial_update: Update a course. delete: Delete a course

### Example

```ts
import { Configuration, CoursesApi } from '';
import type { StudentCaptionsRetrieveRequest } from '';

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
  const api = new CoursesApi(config);

  const body = {
    // number | A unique integer value identifying this course.
    id: 56,
  } satisfies StudentCaptionsRetrieveRequest;

  try {
    const data = await api.studentCaptionsRetrieve(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name   | Type     | Description                                     | Notes                     |
| ------ | -------- | ----------------------------------------------- | ------------------------- |
| **id** | `number` | A unique integer value identifying this course. | [Defaults to `undefined`] |

### Return type

[**CourseStudentCaptions**](CourseStudentCaptions.md)

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

> Course update(id, course)

list: Return a list of all the courses. create: Create a new course. retrieve: Return the given course. update: Update a course. partial_update: Update a course. delete: Delete a course

### Example

```ts
import {
  Configuration,
  CoursesApi,
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
  const api = new CoursesApi(config);

  const body = {
    // number | A unique integer value identifying this course.
    id: 56,
    // Course
    course: ...,
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

| Name       | Type                | Description                                     | Notes                     |
| ---------- | ------------------- | ----------------------------------------------- | ------------------------- |
| **id**     | `number`            | A unique integer value identifying this course. | [Defaults to `undefined`] |
| **course** | [Course](Course.md) |                                                 |                           |

### Return type

[**Course**](Course.md)

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
