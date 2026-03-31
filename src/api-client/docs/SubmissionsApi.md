# SubmissionsApi

All URIs are relative to _http://localhost_

| Method                                                                                             | HTTP request                                            | Description |
| -------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | ----------- |
| [**checkPermissionRetrieve**](SubmissionsApi.md#checkpermissionretrieve)                           | **GET** /submissions/{id}/checkPermission/              |             |
| [**create**](SubmissionsApi.md#create)                                                             | **POST** /submissions/                                  |             |
| [**deleteRegradePartialUpdate**](SubmissionsApi.md#deleteregradepartialupdate)                     | **PATCH** /submissions/{id}/deleteRegrade/              |             |
| [**destroy**](SubmissionsApi.md#destroy)                                                           | **DELETE** /submissions/{id}/                           |             |
| [**generateAIAssistanceCreate**](SubmissionsApi.md#generateaiassistancecreate)                     | **POST** /submissions/{id}/generateAIAssistance/        |             |
| [**generateFileSuggestionsCreate**](SubmissionsApi.md#generatefilesuggestionscreate)               | **POST** /submissions/{id}/generateFileSuggestions/     |             |
| [**generatePartnerLinkRetrieve**](SubmissionsApi.md#generatepartnerlinkretrieve)                   | **GET** /submissions/{id}/generatePartnerLink/          |             |
| [**generateSummaryCreate**](SubmissionsApi.md#generatesummarycreate)                               | **POST** /submissions/{id}/generateSummary/             |             |
| [**historyList**](SubmissionsApi.md#historylist)                                                   | **GET** /submissions/{id}/history/                      |             |
| [**historyPartialUpdate**](SubmissionsApi.md#historypartialupdate)                                 | **PATCH** /submissions/{id}/history/                    |             |
| [**list**](SubmissionsApi.md#list)                                                                 | **GET** /submissions/                                   |             |
| [**notifyStudentsCreate**](SubmissionsApi.md#notifystudentscreate)                                 | **POST** /submissions/{id}/notifyStudents/              |             |
| [**partialUpdate**](SubmissionsApi.md#partialupdate)                                               | **PATCH** /submissions/{id}/                            |             |
| [**removePartnerRetrieve**](SubmissionsApi.md#removepartnerretrieve)                               | **GET** /submissions/{id}/removePartner/                |             |
| [**retrieve**](SubmissionsApi.md#retrieve)                                                         | **GET** /submissions/{id}/                              |             |
| [**submissionTestsList**](SubmissionsApi.md#submissiontestslist)                                   | **GET** /submissions/{id}/submissionTests/              |             |
| [**submitRegradePartialUpdate**](SubmissionsApi.md#submitregradepartialupdate)                     | **PATCH** /submissions/{id}/submitRegrade/              |             |
| [**suggestedCommentsList**](SubmissionsApi.md#suggestedcommentslist)                               | **GET** /submissions/{id}/suggestedComments/            |             |
| [**summaryRetrieve**](SubmissionsApi.md#summaryretrieve)                                           | **GET** /submissions/{id}/summary/                      |             |
| [**testResultsRetrieve**](SubmissionsApi.md#testresultsretrieve)                                   | **GET** /submissions/{id}/testResults/                  |             |
| [**update**](SubmissionsApi.md#update)                                                             | **PUT** /submissions/{id}/                              |             |
| [**validatePartnerLinkAndReturnRetrieve**](SubmissionsApi.md#validatepartnerlinkandreturnretrieve) | **GET** /submissions/{id}/validatePartnerLinkAndReturn/ |             |
| [**validatePartnerLinkRetrieve**](SubmissionsApi.md#validatepartnerlinkretrieve)                   | **GET** /submissions/{id}/validatePartnerLink/          |             |

## checkPermissionRetrieve

> SubmissionCheckPermissionResponse checkPermissionRetrieve(id)

list: Return a list of all the submissions. create: Create a new submission. retrieve: Return the given submission. update: Update a submission. partial_update: Update a submission. delete: Delete a submission.

### Example

```ts
import { Configuration, SubmissionsApi } from '';
import type { CheckPermissionRetrieveRequest } from '';

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
    // Configure HTTP bearer authorization: jwtAuth
    accessToken: 'YOUR BEARER TOKEN',
  });
  const api = new SubmissionsApi(config);

  const body = {
    // number | A unique integer value identifying this submission.
    id: 56,
  } satisfies CheckPermissionRetrieveRequest;

  try {
    const data = await api.checkPermissionRetrieve(body);
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
| **id** | `number` | A unique integer value identifying this submission. | [Defaults to `undefined`] |

### Return type

[**SubmissionCheckPermissionResponse**](SubmissionCheckPermissionResponse.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **200**     |             | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## create

> Submission create(submission)

list: Return a list of all the submissions. create: Create a new submission. retrieve: Return the given submission. update: Update a submission. partial_update: Update a submission. delete: Delete a submission.

### Example

```ts
import {
  Configuration,
  SubmissionsApi,
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
    // Configure HTTP bearer authorization: jwtAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new SubmissionsApi(config);

  const body = {
    // Submission
    submission: ...,
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

| Name           | Type                        | Description | Notes |
| -------------- | --------------------------- | ----------- | ----- |
| **submission** | [Submission](Submission.md) |             |       |

### Return type

[**Submission**](Submission.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

### HTTP request headers

- **Content-Type**: `application/json`, `application/x-www-form-urlencoded`, `multipart/form-data`
- **Accept**: `application/json`

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **201**     |             | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## deleteRegradePartialUpdate

> StudentSubmission deleteRegradePartialUpdate(id, patchedSubmission)

list: Return a list of all the submissions. create: Create a new submission. retrieve: Return the given submission. update: Update a submission. partial_update: Update a submission. delete: Delete a submission.

### Example

```ts
import {
  Configuration,
  SubmissionsApi,
} from '';
import type { DeleteRegradePartialUpdateRequest } from '';

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
    // Configure HTTP bearer authorization: jwtAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new SubmissionsApi(config);

  const body = {
    // number | A unique integer value identifying this submission.
    id: 56,
    // PatchedSubmission (optional)
    patchedSubmission: ...,
  } satisfies DeleteRegradePartialUpdateRequest;

  try {
    const data = await api.deleteRegradePartialUpdate(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                  | Type                                      | Description                                         | Notes                     |
| --------------------- | ----------------------------------------- | --------------------------------------------------- | ------------------------- |
| **id**                | `number`                                  | A unique integer value identifying this submission. | [Defaults to `undefined`] |
| **patchedSubmission** | [PatchedSubmission](PatchedSubmission.md) |                                                     | [Optional]                |

### Return type

[**StudentSubmission**](StudentSubmission.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

### HTTP request headers

- **Content-Type**: `application/json`, `application/x-www-form-urlencoded`, `multipart/form-data`
- **Accept**: `application/json`

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **200**     |             | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## destroy

> destroy(id)

list: Return a list of all the submissions. create: Create a new submission. retrieve: Return the given submission. update: Update a submission. partial_update: Update a submission. delete: Delete a submission.

### Example

```ts
import { Configuration, SubmissionsApi } from '';
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
    // Configure HTTP bearer authorization: jwtAuth
    accessToken: 'YOUR BEARER TOKEN',
  });
  const api = new SubmissionsApi(config);

  const body = {
    // number | A unique integer value identifying this submission.
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
| **id** | `number` | A unique integer value identifying this submission. | [Defaults to `undefined`] |

### Return type

`void` (Empty response body)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: Not defined

### HTTP response details

| Status code | Description      | Response headers |
| ----------- | ---------------- | ---------------- |
| **204**     | No response body | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## generateAIAssistanceCreate

> GenerateAIAssistanceResponse generateAIAssistanceCreate(id, submission)

Manually trigger or regenerate AI summary and suggested comments. Staff only.

### Example

```ts
import {
  Configuration,
  SubmissionsApi,
} from '';
import type { GenerateAIAssistanceCreateRequest } from '';

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
    // Configure HTTP bearer authorization: jwtAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new SubmissionsApi(config);

  const body = {
    // number | A unique integer value identifying this submission.
    id: 56,
    // Submission
    submission: ...,
  } satisfies GenerateAIAssistanceCreateRequest;

  try {
    const data = await api.generateAIAssistanceCreate(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name           | Type                        | Description                                         | Notes                     |
| -------------- | --------------------------- | --------------------------------------------------- | ------------------------- |
| **id**         | `number`                    | A unique integer value identifying this submission. | [Defaults to `undefined`] |
| **submission** | [Submission](Submission.md) |                                                     |                           |

### Return type

[**GenerateAIAssistanceResponse**](GenerateAIAssistanceResponse.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

### HTTP request headers

- **Content-Type**: `application/json`, `application/x-www-form-urlencoded`, `multipart/form-data`
- **Accept**: `application/json`

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **202**     |             | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## generateFileSuggestionsCreate

> Array&lt;SuggestedComment&gt; generateFileSuggestionsCreate(id, generateFileSuggestionsRequest)

Generate AI-suggested comments for a specific file in this submission. Runs synchronously. Staff only.

### Example

```ts
import {
  Configuration,
  SubmissionsApi,
} from '';
import type { GenerateFileSuggestionsCreateRequest } from '';

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
    // Configure HTTP bearer authorization: jwtAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new SubmissionsApi(config);

  const body = {
    // number | A unique integer value identifying this submission.
    id: 56,
    // GenerateFileSuggestionsRequest
    generateFileSuggestionsRequest: ...,
  } satisfies GenerateFileSuggestionsCreateRequest;

  try {
    const data = await api.generateFileSuggestionsCreate(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                               | Type                                                                | Description                                         | Notes                     |
| ---------------------------------- | ------------------------------------------------------------------- | --------------------------------------------------- | ------------------------- |
| **id**                             | `number`                                                            | A unique integer value identifying this submission. | [Defaults to `undefined`] |
| **generateFileSuggestionsRequest** | [GenerateFileSuggestionsRequest](GenerateFileSuggestionsRequest.md) |                                                     |                           |

### Return type

[**Array&lt;SuggestedComment&gt;**](SuggestedComment.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

### HTTP request headers

- **Content-Type**: `application/json`, `application/x-www-form-urlencoded`, `multipart/form-data`
- **Accept**: `application/json`

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **200**     |             | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## generatePartnerLinkRetrieve

> SubmissionPartnerLinkResponse generatePartnerLinkRetrieve(id)

list: Return a list of all the submissions. create: Create a new submission. retrieve: Return the given submission. update: Update a submission. partial_update: Update a submission. delete: Delete a submission.

### Example

```ts
import { Configuration, SubmissionsApi } from '';
import type { GeneratePartnerLinkRetrieveRequest } from '';

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
    // Configure HTTP bearer authorization: jwtAuth
    accessToken: 'YOUR BEARER TOKEN',
  });
  const api = new SubmissionsApi(config);

  const body = {
    // number | A unique integer value identifying this submission.
    id: 56,
  } satisfies GeneratePartnerLinkRetrieveRequest;

  try {
    const data = await api.generatePartnerLinkRetrieve(body);
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
| **id** | `number` | A unique integer value identifying this submission. | [Defaults to `undefined`] |

### Return type

[**SubmissionPartnerLinkResponse**](SubmissionPartnerLinkResponse.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **200**     |             | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## generateSummaryCreate

> SubmissionSummary generateSummaryCreate(id)

Generate or regenerate the AI summary for this submission. Runs synchronously. Staff only.

### Example

```ts
import { Configuration, SubmissionsApi } from '';
import type { GenerateSummaryCreateRequest } from '';

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
    // Configure HTTP bearer authorization: jwtAuth
    accessToken: 'YOUR BEARER TOKEN',
  });
  const api = new SubmissionsApi(config);

  const body = {
    // number | A unique integer value identifying this submission.
    id: 56,
  } satisfies GenerateSummaryCreateRequest;

  try {
    const data = await api.generateSummaryCreate(body);
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
| **id** | `number` | A unique integer value identifying this submission. | [Defaults to `undefined`] |

### Return type

[**SubmissionSummary**](SubmissionSummary.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **200**     |             | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## historyList

> Array&lt;SubmissionHistory&gt; historyList(id)

list: Return a list of all the submissions. create: Create a new submission. retrieve: Return the given submission. update: Update a submission. partial_update: Update a submission. delete: Delete a submission.

### Example

```ts
import { Configuration, SubmissionsApi } from '';
import type { HistoryListRequest } from '';

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
    // Configure HTTP bearer authorization: jwtAuth
    accessToken: 'YOUR BEARER TOKEN',
  });
  const api = new SubmissionsApi(config);

  const body = {
    // number | A unique integer value identifying this submission.
    id: 56,
  } satisfies HistoryListRequest;

  try {
    const data = await api.historyList(body);
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
| **id** | `number` | A unique integer value identifying this submission. | [Defaults to `undefined`] |

### Return type

[**Array&lt;SubmissionHistory&gt;**](SubmissionHistory.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **200**     |             | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## historyPartialUpdate

> Array&lt;SubmissionHistory&gt; historyPartialUpdate(id, patchedSubmission)

list: Return a list of all the submissions. create: Create a new submission. retrieve: Return the given submission. update: Update a submission. partial_update: Update a submission. delete: Delete a submission.

### Example

```ts
import {
  Configuration,
  SubmissionsApi,
} from '';
import type { HistoryPartialUpdateRequest } from '';

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
    // Configure HTTP bearer authorization: jwtAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new SubmissionsApi(config);

  const body = {
    // number | A unique integer value identifying this submission.
    id: 56,
    // PatchedSubmission (optional)
    patchedSubmission: ...,
  } satisfies HistoryPartialUpdateRequest;

  try {
    const data = await api.historyPartialUpdate(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                  | Type                                      | Description                                         | Notes                     |
| --------------------- | ----------------------------------------- | --------------------------------------------------- | ------------------------- |
| **id**                | `number`                                  | A unique integer value identifying this submission. | [Defaults to `undefined`] |
| **patchedSubmission** | [PatchedSubmission](PatchedSubmission.md) |                                                     | [Optional]                |

### Return type

[**Array&lt;SubmissionHistory&gt;**](SubmissionHistory.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

### HTTP request headers

- **Content-Type**: `application/json`, `application/x-www-form-urlencoded`, `multipart/form-data`
- **Accept**: `application/json`

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **200**     |             | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## list

> Array&lt;Submission&gt; list()

list: Return a list of all the submissions. create: Create a new submission. retrieve: Return the given submission. update: Update a submission. partial_update: Update a submission. delete: Delete a submission.

### Example

```ts
import { Configuration, SubmissionsApi } from '';
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
    // Configure HTTP bearer authorization: jwtAuth
    accessToken: 'YOUR BEARER TOKEN',
  });
  const api = new SubmissionsApi(config);

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

[**Array&lt;Submission&gt;**](Submission.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **200**     |             | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## notifyStudentsCreate

> string notifyStudentsCreate(id, submission)

list: Return a list of all the submissions. create: Create a new submission. retrieve: Return the given submission. update: Update a submission. partial_update: Update a submission. delete: Delete a submission.

### Example

```ts
import {
  Configuration,
  SubmissionsApi,
} from '';
import type { NotifyStudentsCreateRequest } from '';

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
    // Configure HTTP bearer authorization: jwtAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new SubmissionsApi(config);

  const body = {
    // number | A unique integer value identifying this submission.
    id: 56,
    // Submission
    submission: ...,
  } satisfies NotifyStudentsCreateRequest;

  try {
    const data = await api.notifyStudentsCreate(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name           | Type                        | Description                                         | Notes                     |
| -------------- | --------------------------- | --------------------------------------------------- | ------------------------- |
| **id**         | `number`                    | A unique integer value identifying this submission. | [Defaults to `undefined`] |
| **submission** | [Submission](Submission.md) |                                                     |                           |

### Return type

**string**

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

### HTTP request headers

- **Content-Type**: `application/json`, `application/x-www-form-urlencoded`, `multipart/form-data`
- **Accept**: `application/json`

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **200**     |             | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## partialUpdate

> Submission partialUpdate(id, patchedSubmission)

list: Return a list of all the submissions. create: Create a new submission. retrieve: Return the given submission. update: Update a submission. partial_update: Update a submission. delete: Delete a submission.

### Example

```ts
import {
  Configuration,
  SubmissionsApi,
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
    // Configure HTTP bearer authorization: jwtAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new SubmissionsApi(config);

  const body = {
    // number | A unique integer value identifying this submission.
    id: 56,
    // PatchedSubmission (optional)
    patchedSubmission: ...,
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

| Name                  | Type                                      | Description                                         | Notes                     |
| --------------------- | ----------------------------------------- | --------------------------------------------------- | ------------------------- |
| **id**                | `number`                                  | A unique integer value identifying this submission. | [Defaults to `undefined`] |
| **patchedSubmission** | [PatchedSubmission](PatchedSubmission.md) |                                                     | [Optional]                |

### Return type

[**Submission**](Submission.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

### HTTP request headers

- **Content-Type**: `application/json`, `application/x-www-form-urlencoded`, `multipart/form-data`
- **Accept**: `application/json`

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **200**     |             | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## removePartnerRetrieve

> string removePartnerRetrieve(id)

list: Return a list of all the submissions. create: Create a new submission. retrieve: Return the given submission. update: Update a submission. partial_update: Update a submission. delete: Delete a submission.

### Example

```ts
import { Configuration, SubmissionsApi } from '';
import type { RemovePartnerRetrieveRequest } from '';

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
    // Configure HTTP bearer authorization: jwtAuth
    accessToken: 'YOUR BEARER TOKEN',
  });
  const api = new SubmissionsApi(config);

  const body = {
    // number | A unique integer value identifying this submission.
    id: 56,
  } satisfies RemovePartnerRetrieveRequest;

  try {
    const data = await api.removePartnerRetrieve(body);
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
| **id** | `number` | A unique integer value identifying this submission. | [Defaults to `undefined`] |

### Return type

**string**

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **200**     |             | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## retrieve

> Submission retrieve(id)

list: Return a list of all the submissions. create: Create a new submission. retrieve: Return the given submission. update: Update a submission. partial_update: Update a submission. delete: Delete a submission.

### Example

```ts
import { Configuration, SubmissionsApi } from '';
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
    // Configure HTTP bearer authorization: jwtAuth
    accessToken: 'YOUR BEARER TOKEN',
  });
  const api = new SubmissionsApi(config);

  const body = {
    // number | A unique integer value identifying this submission.
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
| **id** | `number` | A unique integer value identifying this submission. | [Defaults to `undefined`] |

### Return type

[**Submission**](Submission.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **200**     |             | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## submissionTestsList

> Array&lt;SubmissionTest&gt; submissionTestsList(id)

list: Return a list of all the submissions. create: Create a new submission. retrieve: Return the given submission. update: Update a submission. partial_update: Update a submission. delete: Delete a submission.

### Example

```ts
import { Configuration, SubmissionsApi } from '';
import type { SubmissionTestsListRequest } from '';

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
    // Configure HTTP bearer authorization: jwtAuth
    accessToken: 'YOUR BEARER TOKEN',
  });
  const api = new SubmissionsApi(config);

  const body = {
    // number | A unique integer value identifying this submission.
    id: 56,
  } satisfies SubmissionTestsListRequest;

  try {
    const data = await api.submissionTestsList(body);
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
| **id** | `number` | A unique integer value identifying this submission. | [Defaults to `undefined`] |

### Return type

[**Array&lt;SubmissionTest&gt;**](SubmissionTest.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **200**     |             | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## submitRegradePartialUpdate

> StudentSubmission submitRegradePartialUpdate(id, patchedSubmission)

list: Return a list of all the submissions. create: Create a new submission. retrieve: Return the given submission. update: Update a submission. partial_update: Update a submission. delete: Delete a submission.

### Example

```ts
import {
  Configuration,
  SubmissionsApi,
} from '';
import type { SubmitRegradePartialUpdateRequest } from '';

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
    // Configure HTTP bearer authorization: jwtAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new SubmissionsApi(config);

  const body = {
    // number | A unique integer value identifying this submission.
    id: 56,
    // PatchedSubmission (optional)
    patchedSubmission: ...,
  } satisfies SubmitRegradePartialUpdateRequest;

  try {
    const data = await api.submitRegradePartialUpdate(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                  | Type                                      | Description                                         | Notes                     |
| --------------------- | ----------------------------------------- | --------------------------------------------------- | ------------------------- |
| **id**                | `number`                                  | A unique integer value identifying this submission. | [Defaults to `undefined`] |
| **patchedSubmission** | [PatchedSubmission](PatchedSubmission.md) |                                                     | [Optional]                |

### Return type

[**StudentSubmission**](StudentSubmission.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

### HTTP request headers

- **Content-Type**: `application/json`, `application/x-www-form-urlencoded`, `multipart/form-data`
- **Accept**: `application/json`

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **200**     |             | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## suggestedCommentsList

> Array&lt;SuggestedComment&gt; suggestedCommentsList(id)

List all pending AI-suggested comments for this submission. Staff only.

### Example

```ts
import { Configuration, SubmissionsApi } from '';
import type { SuggestedCommentsListRequest } from '';

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
    // Configure HTTP bearer authorization: jwtAuth
    accessToken: 'YOUR BEARER TOKEN',
  });
  const api = new SubmissionsApi(config);

  const body = {
    // number | A unique integer value identifying this submission.
    id: 56,
  } satisfies SuggestedCommentsListRequest;

  try {
    const data = await api.suggestedCommentsList(body);
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
| **id** | `number` | A unique integer value identifying this submission. | [Defaults to `undefined`] |

### Return type

[**Array&lt;SuggestedComment&gt;**](SuggestedComment.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **200**     |             | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## summaryRetrieve

> SubmissionSummary summaryRetrieve(id)

Get the AI-generated summary for this submission. Staff only.

### Example

```ts
import { Configuration, SubmissionsApi } from '';
import type { SummaryRetrieveRequest } from '';

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
    // Configure HTTP bearer authorization: jwtAuth
    accessToken: 'YOUR BEARER TOKEN',
  });
  const api = new SubmissionsApi(config);

  const body = {
    // number | A unique integer value identifying this submission.
    id: 56,
  } satisfies SummaryRetrieveRequest;

  try {
    const data = await api.summaryRetrieve(body);
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
| **id** | `number` | A unique integer value identifying this submission. | [Defaults to `undefined`] |

### Return type

[**SubmissionSummary**](SubmissionSummary.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **200**     |             | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## testResultsRetrieve

> SubmissionTestResultsResponse testResultsRetrieve(id)

list: Return a list of all the submissions. create: Create a new submission. retrieve: Return the given submission. update: Update a submission. partial_update: Update a submission. delete: Delete a submission.

### Example

```ts
import { Configuration, SubmissionsApi } from '';
import type { TestResultsRetrieveRequest } from '';

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
    // Configure HTTP bearer authorization: jwtAuth
    accessToken: 'YOUR BEARER TOKEN',
  });
  const api = new SubmissionsApi(config);

  const body = {
    // number | A unique integer value identifying this submission.
    id: 56,
  } satisfies TestResultsRetrieveRequest;

  try {
    const data = await api.testResultsRetrieve(body);
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
| **id** | `number` | A unique integer value identifying this submission. | [Defaults to `undefined`] |

### Return type

[**SubmissionTestResultsResponse**](SubmissionTestResultsResponse.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **200**     |             | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## update

> Submission update(id, submission)

list: Return a list of all the submissions. create: Create a new submission. retrieve: Return the given submission. update: Update a submission. partial_update: Update a submission. delete: Delete a submission.

### Example

```ts
import {
  Configuration,
  SubmissionsApi,
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
    // Configure HTTP bearer authorization: jwtAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new SubmissionsApi(config);

  const body = {
    // number | A unique integer value identifying this submission.
    id: 56,
    // Submission
    submission: ...,
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

| Name           | Type                        | Description                                         | Notes                     |
| -------------- | --------------------------- | --------------------------------------------------- | ------------------------- |
| **id**         | `number`                    | A unique integer value identifying this submission. | [Defaults to `undefined`] |
| **submission** | [Submission](Submission.md) |                                                     |                           |

### Return type

[**Submission**](Submission.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

### HTTP request headers

- **Content-Type**: `application/json`, `application/x-www-form-urlencoded`, `multipart/form-data`
- **Accept**: `application/json`

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **200**     |             | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## validatePartnerLinkAndReturnRetrieve

> StudentSubmission validatePartnerLinkAndReturnRetrieve(id, token)

list: Return a list of all the submissions. create: Create a new submission. retrieve: Return the given submission. update: Update a submission. partial_update: Update a submission. delete: Delete a submission.

### Example

```ts
import { Configuration, SubmissionsApi } from '';
import type { ValidatePartnerLinkAndReturnRetrieveRequest } from '';

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
    // Configure HTTP bearer authorization: jwtAuth
    accessToken: 'YOUR BEARER TOKEN',
  });
  const api = new SubmissionsApi(config);

  const body = {
    // number | A unique integer value identifying this submission.
    id: 56,
    // string
    token: token_example,
  } satisfies ValidatePartnerLinkAndReturnRetrieveRequest;

  try {
    const data = await api.validatePartnerLinkAndReturnRetrieve(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name      | Type     | Description                                         | Notes                     |
| --------- | -------- | --------------------------------------------------- | ------------------------- |
| **id**    | `number` | A unique integer value identifying this submission. | [Defaults to `undefined`] |
| **token** | `string` |                                                     | [Defaults to `undefined`] |

### Return type

[**StudentSubmission**](StudentSubmission.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **200**     |             | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## validatePartnerLinkRetrieve

> string validatePartnerLinkRetrieve(id, token)

list: Return a list of all the submissions. create: Create a new submission. retrieve: Return the given submission. update: Update a submission. partial_update: Update a submission. delete: Delete a submission.

### Example

```ts
import { Configuration, SubmissionsApi } from '';
import type { ValidatePartnerLinkRetrieveRequest } from '';

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
    // Configure HTTP bearer authorization: jwtAuth
    accessToken: 'YOUR BEARER TOKEN',
  });
  const api = new SubmissionsApi(config);

  const body = {
    // number | A unique integer value identifying this submission.
    id: 56,
    // string
    token: token_example,
  } satisfies ValidatePartnerLinkRetrieveRequest;

  try {
    const data = await api.validatePartnerLinkRetrieve(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name      | Type     | Description                                         | Notes                     |
| --------- | -------- | --------------------------------------------------- | ------------------------- |
| **id**    | `number` | A unique integer value identifying this submission. | [Defaults to `undefined`] |
| **token** | `string` |                                                     | [Defaults to `undefined`] |

### Return type

**string**

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **200**     |             | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
