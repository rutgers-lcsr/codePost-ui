# DashboardApi

All URIs are relative to *http://localhost*

| Method                                                                         | HTTP request                               | Description |
| ------------------------------------------------------------------------------ | ------------------------------------------ | ----------- |
| [**approvePendingAdminCreate**](DashboardApi.md#approvependingadmincreate)     | **POST** /dashboard/approve_pending_admin/ |             |
| [**autogradingFailuresRetrieve**](DashboardApi.md#autogradingfailuresretrieve) | **GET** /dashboard/autograding_failures/   |             |
| [**autogradingStatsRetrieve**](DashboardApi.md#autogradingstatsretrieve)       | **GET** /dashboard/autograding_stats/      |             |
| [**deadlinesList**](DashboardApi.md#deadlineslist)                             | **GET** /dashboard/deadlines/              |             |
| [**denyPendingAdminCreate**](DashboardApi.md#denypendingadmincreate)           | **POST** /dashboard/deny_pending_admin/    |             |
| [**pendingAdminsList**](DashboardApi.md#pendingadminslist)                     | **GET** /dashboard/pending_admins/         |             |
| [**statsRetrieve**](DashboardApi.md#statsretrieve)                             | **GET** /dashboard/stats/                  |             |

## approvePendingAdminCreate

> PendingAdminActionResponse approvePendingAdminCreate(pendingAdminActionRequest)

Approve a pending admin request (superuser only). Payload: { \&#39;user_email\&#39;: \&#39;...\&#39; }

### Example

```ts
import {
  Configuration,
  DashboardApi,
} from '';
import type { ApprovePendingAdminCreateRequest } from '';

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
  const api = new DashboardApi(config);

  const body = {
    // PendingAdminActionRequest
    pendingAdminActionRequest: ...,
  } satisfies ApprovePendingAdminCreateRequest;

  try {
    const data = await api.approvePendingAdminCreate(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                          | Type                                                      | Description | Notes |
| ----------------------------- | --------------------------------------------------------- | ----------- | ----- |
| **pendingAdminActionRequest** | [PendingAdminActionRequest](PendingAdminActionRequest.md) |             |       |

### Return type

[**PendingAdminActionResponse**](PendingAdminActionResponse.md)

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

## autogradingFailuresRetrieve

> AutogradingFailureList autogradingFailuresRetrieve(assignmentId, category, courseId, dateFrom, dateTo, language, page, pageSize, q, trigger)

Returns failed autograder executions, newest first, with the course, assignment, submission, file, image, Celery task id and full error output needed to isolate each failure.

### Example

```ts
import { Configuration, DashboardApi } from '';
import type { AutogradingFailuresRetrieveRequest } from '';

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
  const api = new DashboardApi(config);

  const body = {
    // number (optional)
    assignmentId: 56,
    // string | Error category (timeout, missing_dependency, compile_error, runtime_error, marker_extraction, infra, unknown). (optional)
    category: category_example,
    // number (optional)
    courseId: 56,
    // string | Start of range (ISO 8601 datetime or date). Defaults to 30 days ago. (optional)
    dateFrom: dateFrom_example,
    // string | End of range (ISO 8601 datetime or date, exclusive). Defaults to now. (optional)
    dateTo: dateTo_example,
    // string | Environment language snapshot; \'unknown\' matches events with no language. (optional)
    language: language_example,
    // number | 1-based page number. (optional)
    page: 56,
    // number | Rows per page (default 25, max 100). (optional)
    pageSize: 56,
    // string | Case-insensitive substring match on the error message/detail. (optional)
    q: q_example,
    // string | Execution path (file_run, submission_run, test_run). (optional)
    trigger: trigger_example,
  } satisfies AutogradingFailuresRetrieveRequest;

  try {
    const data = await api.autogradingFailuresRetrieve(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name             | Type     | Description                                                                                                    | Notes                                |
| ---------------- | -------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| **assignmentId** | `number` |                                                                                                                | [Optional] [Defaults to `undefined`] |
| **category**     | `string` | Error category (timeout, missing_dependency, compile_error, runtime_error, marker_extraction, infra, unknown). | [Optional] [Defaults to `undefined`] |
| **courseId**     | `number` |                                                                                                                | [Optional] [Defaults to `undefined`] |
| **dateFrom**     | `string` | Start of range (ISO 8601 datetime or date). Defaults to 30 days ago.                                           | [Optional] [Defaults to `undefined`] |
| **dateTo**       | `string` | End of range (ISO 8601 datetime or date, exclusive). Defaults to now.                                          | [Optional] [Defaults to `undefined`] |
| **language**     | `string` | Environment language snapshot; \&#39;unknown\&#39; matches events with no language.                            | [Optional] [Defaults to `undefined`] |
| **page**         | `number` | 1-based page number.                                                                                           | [Optional] [Defaults to `undefined`] |
| **pageSize**     | `number` | Rows per page (default 25, max 100).                                                                           | [Optional] [Defaults to `undefined`] |
| **q**            | `string` | Case-insensitive substring match on the error message/detail.                                                  | [Optional] [Defaults to `undefined`] |
| **trigger**      | `string` | Execution path (file_run, submission_run, test_run).                                                           | [Optional] [Defaults to `undefined`] |

### Return type

[**AutogradingFailureList**](AutogradingFailureList.md)

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

## autogradingStatsRetrieve

> AutogradingStats autogradingStatsRetrieve(dateFrom, dateTo)

Returns platform-wide autograder execution statistics: cache-hit rate, failure counts, language usage, failures per language, top errors, and the assignments with the most failures.

### Example

```ts
import { Configuration, DashboardApi } from '';
import type { AutogradingStatsRetrieveRequest } from '';

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
  const api = new DashboardApi(config);

  const body = {
    // string | Start of range (ISO 8601 datetime or date). Defaults to 30 days ago. (optional)
    dateFrom: dateFrom_example,
    // string | End of range (ISO 8601 datetime or date, exclusive). Defaults to now. (optional)
    dateTo: dateTo_example,
  } satisfies AutogradingStatsRetrieveRequest;

  try {
    const data = await api.autogradingStatsRetrieve(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name         | Type     | Description                                                           | Notes                                |
| ------------ | -------- | --------------------------------------------------------------------- | ------------------------------------ |
| **dateFrom** | `string` | Start of range (ISO 8601 datetime or date). Defaults to 30 days ago.  | [Optional] [Defaults to `undefined`] |
| **dateTo**   | `string` | End of range (ISO 8601 datetime or date, exclusive). Defaults to now. | [Optional] [Defaults to `undefined`] |

### Return type

[**AutogradingStats**](AutogradingStats.md)

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

## deadlinesList

> Array&lt;AssignmentDeadline&gt; deadlinesList()

Returns all assignments with their due dates and late upload deadlines. Useful for planning deployment windows.

### Example

```ts
import { Configuration, DashboardApi } from '';
import type { DeadlinesListRequest } from '';

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
  const api = new DashboardApi(config);

  try {
    const data = await api.deadlinesList();
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

[**Array&lt;AssignmentDeadline&gt;**](AssignmentDeadline.md)

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

## denyPendingAdminCreate

> PendingAdminActionResponse denyPendingAdminCreate(pendingAdminActionRequest)

Deny a pending admin request (superuser only). Payload: { \&#39;user_email\&#39;: \&#39;...\&#39; }

### Example

```ts
import {
  Configuration,
  DashboardApi,
} from '';
import type { DenyPendingAdminCreateRequest } from '';

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
  const api = new DashboardApi(config);

  const body = {
    // PendingAdminActionRequest
    pendingAdminActionRequest: ...,
  } satisfies DenyPendingAdminCreateRequest;

  try {
    const data = await api.denyPendingAdminCreate(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                          | Type                                                      | Description | Notes |
| ----------------------------- | --------------------------------------------------------- | ----------- | ----- |
| **pendingAdminActionRequest** | [PendingAdminActionRequest](PendingAdminActionRequest.md) |             |       |

### Return type

[**PendingAdminActionResponse**](PendingAdminActionResponse.md)

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

## pendingAdminsList

> Array&lt;User&gt; pendingAdminsList()

Returns all users with pendingValidation&#x3D;True across all organizations. Used by the SuperAdmin dashboard to manage pending admin requests.

### Example

```ts
import { Configuration, DashboardApi } from '';
import type { PendingAdminsListRequest } from '';

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
  const api = new DashboardApi(config);

  try {
    const data = await api.pendingAdminsList();
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

[**Array&lt;User&gt;**](User.md)

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

## statsRetrieve

> DashboardStats statsRetrieve()

Returns aggregated platform statistics.

### Example

```ts
import { Configuration, DashboardApi } from '';
import type { StatsRetrieveRequest } from '';

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
  const api = new DashboardApi(config);

  try {
    const data = await api.statsRetrieve();
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

[**DashboardStats**](DashboardStats.md)

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
