# PromptExperimentsApi

All URIs are relative to _http://localhost_

| Method                                                         | HTTP request                               | Description |
| -------------------------------------------------------------- | ------------------------------------------ | ----------- |
| [**completeCreate**](PromptExperimentsApi.md#completecreate)   | **POST** /promptExperiments/{id}/complete/ |             |
| [**create**](PromptExperimentsApi.md#create)                   | **POST** /promptExperiments/               |             |
| [**destroy**](PromptExperimentsApi.md#destroy)                 | **DELETE** /promptExperiments/{id}/        |             |
| [**list**](PromptExperimentsApi.md#list)                       | **GET** /promptExperiments/                |             |
| [**partialUpdate**](PromptExperimentsApi.md#partialupdate)     | **PATCH** /promptExperiments/{id}/         |             |
| [**pauseCreate**](PromptExperimentsApi.md#pausecreate)         | **POST** /promptExperiments/{id}/pause/    |             |
| [**resultsRetrieve**](PromptExperimentsApi.md#resultsretrieve) | **GET** /promptExperiments/{id}/results/   |             |
| [**resumeCreate**](PromptExperimentsApi.md#resumecreate)       | **POST** /promptExperiments/{id}/resume/   |             |
| [**retrieve**](PromptExperimentsApi.md#retrieve)               | **GET** /promptExperiments/{id}/           |             |
| [**update**](PromptExperimentsApi.md#update)                   | **PUT** /promptExperiments/{id}/           |             |

## completeCreate

> PromptExperiment completeCreate(id, promoteWinner)

Mark this experiment as completed. Optionally promote the winner.

### Example

```ts
import { Configuration, PromptExperimentsApi } from '';
import type { CompleteCreateRequest } from '';

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
  const api = new PromptExperimentsApi(config);

  const body = {
    // number | A unique integer value identifying this prompt experiment.
    id: 56,
    // boolean | If true, activate the winning variant. (optional)
    promoteWinner: true,
  } satisfies CompleteCreateRequest;

  try {
    const data = await api.completeCreate(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name              | Type      | Description                                                | Notes                                |
| ----------------- | --------- | ---------------------------------------------------------- | ------------------------------------ |
| **id**            | `number`  | A unique integer value identifying this prompt experiment. | [Defaults to `undefined`]            |
| **promoteWinner** | `boolean` | If true, activate the winning variant.                     | [Optional] [Defaults to `undefined`] |

### Return type

[**PromptExperiment**](PromptExperiment.md)

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

> PromptExperiment create(promptExperiment)

CRUD and lifecycle management for A/B prompt experiments. Superuser-only. Only one experiment per prompt_type may be \&#39;running\&#39; at a time (enforced at the DB level). list: List all experiments. Supports ?promptType&#x3D; and ?status&#x3D; filters. create: Create a new experiment (defaults to \&#39;paused\&#39;). retrieve / update / partial_update / delete: Standard CRUD.

### Example

```ts
import {
  Configuration,
  PromptExperimentsApi,
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
  const api = new PromptExperimentsApi(config);

  const body = {
    // PromptExperiment
    promptExperiment: ...,
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

| Name                 | Type                                    | Description | Notes |
| -------------------- | --------------------------------------- | ----------- | ----- |
| **promptExperiment** | [PromptExperiment](PromptExperiment.md) |             |       |

### Return type

[**PromptExperiment**](PromptExperiment.md)

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

CRUD and lifecycle management for A/B prompt experiments. Superuser-only. Only one experiment per prompt_type may be \&#39;running\&#39; at a time (enforced at the DB level). list: List all experiments. Supports ?promptType&#x3D; and ?status&#x3D; filters. create: Create a new experiment (defaults to \&#39;paused\&#39;). retrieve / update / partial_update / delete: Standard CRUD.

### Example

```ts
import { Configuration, PromptExperimentsApi } from '';
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
  const api = new PromptExperimentsApi(config);

  const body = {
    // number | A unique integer value identifying this prompt experiment.
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

| Name   | Type     | Description                                                | Notes                     |
| ------ | -------- | ---------------------------------------------------------- | ------------------------- |
| **id** | `number` | A unique integer value identifying this prompt experiment. | [Defaults to `undefined`] |

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

> PaginatedPromptExperimentList list(page, pageSize)

CRUD and lifecycle management for A/B prompt experiments. Superuser-only. Only one experiment per prompt_type may be \&#39;running\&#39; at a time (enforced at the DB level). list: List all experiments. Supports ?promptType&#x3D; and ?status&#x3D; filters. create: Create a new experiment (defaults to \&#39;paused\&#39;). retrieve / update / partial_update / delete: Standard CRUD.

### Example

```ts
import { Configuration, PromptExperimentsApi } from '';
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
  const api = new PromptExperimentsApi(config);

  const body = {
    // number | A page number within the paginated result set. (optional)
    page: 56,
    // number | Number of results to return per page. (optional)
    pageSize: 56,
  } satisfies ListRequest;

  try {
    const data = await api.list(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name         | Type     | Description                                    | Notes                                |
| ------------ | -------- | ---------------------------------------------- | ------------------------------------ |
| **page**     | `number` | A page number within the paginated result set. | [Optional] [Defaults to `undefined`] |
| **pageSize** | `number` | Number of results to return per page.          | [Optional] [Defaults to `undefined`] |

### Return type

[**PaginatedPromptExperimentList**](PaginatedPromptExperimentList.md)

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

> PromptExperiment partialUpdate(id, patchedPromptExperiment)

CRUD and lifecycle management for A/B prompt experiments. Superuser-only. Only one experiment per prompt_type may be \&#39;running\&#39; at a time (enforced at the DB level). list: List all experiments. Supports ?promptType&#x3D; and ?status&#x3D; filters. create: Create a new experiment (defaults to \&#39;paused\&#39;). retrieve / update / partial_update / delete: Standard CRUD.

### Example

```ts
import {
  Configuration,
  PromptExperimentsApi,
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
  const api = new PromptExperimentsApi(config);

  const body = {
    // number | A unique integer value identifying this prompt experiment.
    id: 56,
    // PatchedPromptExperiment (optional)
    patchedPromptExperiment: ...,
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

| Name                        | Type                                                  | Description                                                | Notes                     |
| --------------------------- | ----------------------------------------------------- | ---------------------------------------------------------- | ------------------------- |
| **id**                      | `number`                                              | A unique integer value identifying this prompt experiment. | [Defaults to `undefined`] |
| **patchedPromptExperiment** | [PatchedPromptExperiment](PatchedPromptExperiment.md) |                                                            | [Optional]                |

### Return type

[**PromptExperiment**](PromptExperiment.md)

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

## pauseCreate

> PromptExperiment pauseCreate(id)

Pause this experiment (no new A/B requests will be triggered).

### Example

```ts
import { Configuration, PromptExperimentsApi } from '';
import type { PauseCreateRequest } from '';

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
  const api = new PromptExperimentsApi(config);

  const body = {
    // number | A unique integer value identifying this prompt experiment.
    id: 56,
  } satisfies PauseCreateRequest;

  try {
    const data = await api.pauseCreate(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name   | Type     | Description                                                | Notes                     |
| ------ | -------- | ---------------------------------------------------------- | ------------------------- |
| **id** | `number` | A unique integer value identifying this prompt experiment. | [Defaults to `undefined`] |

### Return type

[**PromptExperiment**](PromptExperiment.md)

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

## resultsRetrieve

> PromptExperimentResults resultsRetrieve(id, minAssignments, minSamplesPerVariant, pool)

Get aggregated feedback results for this experiment, including behavioral metrics.

### Example

```ts
import { Configuration, PromptExperimentsApi } from '';
import type { ResultsRetrieveRequest } from '';

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
  const api = new PromptExperimentsApi(config);

  const body = {
    // number | A unique integer value identifying this prompt experiment.
    id: 56,
    // number | Minimum distinct assignments required for behavioral metrics (default: 1). (optional)
    minAssignments: 56,
    // number | Minimum suggestions per variant for confident metrics (default: 30). (optional)
    minSamplesPerVariant: 56,
    // 'all' | 'custom' | 'default' | Filter feedback pool: \'default\', \'custom\', or \'all\'. (optional)
    pool: pool_example,
  } satisfies ResultsRetrieveRequest;

  try {
    const data = await api.resultsRetrieve(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                     | Type                       | Description                                                                        | Notes                                                             |
| ------------------------ | -------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| **id**                   | `number`                   | A unique integer value identifying this prompt experiment.                         | [Defaults to `undefined`]                                         |
| **minAssignments**       | `number`                   | Minimum distinct assignments required for behavioral metrics (default: 1).         | [Optional] [Defaults to `undefined`]                              |
| **minSamplesPerVariant** | `number`                   | Minimum suggestions per variant for confident metrics (default: 30).               | [Optional] [Defaults to `undefined`]                              |
| **pool**                 | `all`, `custom`, `default` | Filter feedback pool: \&#39;default\&#39;, \&#39;custom\&#39;, or \&#39;all\&#39;. | [Optional] [Defaults to `undefined`] [Enum: all, custom, default] |

### Return type

[**PromptExperimentResults**](PromptExperimentResults.md)

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

## resumeCreate

> PromptExperiment resumeCreate(id)

Start (resume) this experiment so it begins sampling requests.

### Example

```ts
import { Configuration, PromptExperimentsApi } from '';
import type { ResumeCreateRequest } from '';

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
  const api = new PromptExperimentsApi(config);

  const body = {
    // number | A unique integer value identifying this prompt experiment.
    id: 56,
  } satisfies ResumeCreateRequest;

  try {
    const data = await api.resumeCreate(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name   | Type     | Description                                                | Notes                     |
| ------ | -------- | ---------------------------------------------------------- | ------------------------- |
| **id** | `number` | A unique integer value identifying this prompt experiment. | [Defaults to `undefined`] |

### Return type

[**PromptExperiment**](PromptExperiment.md)

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

> PromptExperiment retrieve(id)

CRUD and lifecycle management for A/B prompt experiments. Superuser-only. Only one experiment per prompt_type may be \&#39;running\&#39; at a time (enforced at the DB level). list: List all experiments. Supports ?promptType&#x3D; and ?status&#x3D; filters. create: Create a new experiment (defaults to \&#39;paused\&#39;). retrieve / update / partial_update / delete: Standard CRUD.

### Example

```ts
import { Configuration, PromptExperimentsApi } from '';
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
  const api = new PromptExperimentsApi(config);

  const body = {
    // number | A unique integer value identifying this prompt experiment.
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

| Name   | Type     | Description                                                | Notes                     |
| ------ | -------- | ---------------------------------------------------------- | ------------------------- |
| **id** | `number` | A unique integer value identifying this prompt experiment. | [Defaults to `undefined`] |

### Return type

[**PromptExperiment**](PromptExperiment.md)

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

> PromptExperiment update(id, promptExperiment)

CRUD and lifecycle management for A/B prompt experiments. Superuser-only. Only one experiment per prompt_type may be \&#39;running\&#39; at a time (enforced at the DB level). list: List all experiments. Supports ?promptType&#x3D; and ?status&#x3D; filters. create: Create a new experiment (defaults to \&#39;paused\&#39;). retrieve / update / partial_update / delete: Standard CRUD.

### Example

```ts
import {
  Configuration,
  PromptExperimentsApi,
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
  const api = new PromptExperimentsApi(config);

  const body = {
    // number | A unique integer value identifying this prompt experiment.
    id: 56,
    // PromptExperiment
    promptExperiment: ...,
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

| Name                 | Type                                    | Description                                                | Notes                     |
| -------------------- | --------------------------------------- | ---------------------------------------------------------- | ------------------------- |
| **id**               | `number`                                | A unique integer value identifying this prompt experiment. | [Defaults to `undefined`] |
| **promptExperiment** | [PromptExperiment](PromptExperiment.md) |                                                            |                           |

### Return type

[**PromptExperiment**](PromptExperiment.md)

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
