# PromptVariantsApi

All URIs are relative to _http://localhost_

| Method                                                                | HTTP request                             | Description |
| --------------------------------------------------------------------- | ---------------------------------------- | ----------- |
| [**activateCreate**](PromptVariantsApi.md#activatecreate)             | **POST** /promptVariants/{id}/activate/  |             |
| [**autoImproveCreate**](PromptVariantsApi.md#autoimprovecreate)       | **POST** /promptVariants/auto-improve/   |             |
| [**cloneCreate**](PromptVariantsApi.md#clonecreate)                   | **POST** /promptVariants/{id}/clone/     |             |
| [**create**](PromptVariantsApi.md#create)                             | **POST** /promptVariants/                |             |
| [**destroy**](PromptVariantsApi.md#destroy)                           | **DELETE** /promptVariants/{id}/         |             |
| [**list**](PromptVariantsApi.md#list)                                 | **GET** /promptVariants/                 |             |
| [**partialUpdate**](PromptVariantsApi.md#partialupdate)               | **PATCH** /promptVariants/{id}/          |             |
| [**retrieve**](PromptVariantsApi.md#retrieve)                         | **GET** /promptVariants/{id}/            |             |
| [**settingsRetrieve**](PromptVariantsApi.md#settingsretrieve)         | **GET** /promptVariants/settings/        |             |
| [**settingsUpdateUpdate**](PromptVariantsApi.md#settingsupdateupdate) | **PUT** /promptVariants/settings/update/ |             |
| [**statsRetrieve**](PromptVariantsApi.md#statsretrieve)               | **GET** /promptVariants/{id}/stats/      |             |
| [**update**](PromptVariantsApi.md#update)                             | **PUT** /promptVariants/{id}/            |             |

## activateCreate

> SystemPromptVariant activateCreate(id)

Set this variant as the active prompt for its type. The previously active variant (if any) is moved to \&#39;retired\&#39;.

### Example

```ts
import { Configuration, PromptVariantsApi } from '';
import type { ActivateCreateRequest } from '';

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
  const api = new PromptVariantsApi(config);

  const body = {
    // number | A unique integer value identifying this system prompt variant.
    id: 56,
  } satisfies ActivateCreateRequest;

  try {
    const data = await api.activateCreate(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name   | Type     | Description                                                    | Notes                     |
| ------ | -------- | -------------------------------------------------------------- | ------------------------- |
| **id** | `number` | A unique integer value identifying this system prompt variant. | [Defaults to `undefined`] |

### Return type

[**SystemPromptVariant**](SystemPromptVariant.md)

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

## autoImproveCreate

> SystemPromptVariant autoImproveCreate(promptType)

Analyze feedback for a prompt type and use AI to generate an improved variant. Creates a new draft child of the current active variant.

### Example

```ts
import { Configuration, PromptVariantsApi } from '';
import type { AutoImproveCreateRequest } from '';

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
  const api = new PromptVariantsApi(config);

  const body = {
    // string | The prompt type to auto-improve.
    promptType: promptType_example,
  } satisfies AutoImproveCreateRequest;

  try {
    const data = await api.autoImproveCreate(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name           | Type     | Description                      | Notes                     |
| -------------- | -------- | -------------------------------- | ------------------------- |
| **promptType** | `string` | The prompt type to auto-improve. | [Defaults to `undefined`] |

### Return type

[**SystemPromptVariant**](SystemPromptVariant.md)

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

## cloneCreate

> SystemPromptVariant cloneCreate(id)

Clone this variant as a new draft for editing.

### Example

```ts
import { Configuration, PromptVariantsApi } from '';
import type { CloneCreateRequest } from '';

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
  const api = new PromptVariantsApi(config);

  const body = {
    // number | A unique integer value identifying this system prompt variant.
    id: 56,
  } satisfies CloneCreateRequest;

  try {
    const data = await api.cloneCreate(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name   | Type     | Description                                                    | Notes                     |
| ------ | -------- | -------------------------------------------------------------- | ------------------------- |
| **id** | `number` | A unique integer value identifying this system prompt variant. | [Defaults to `undefined`] |

### Return type

[**SystemPromptVariant**](SystemPromptVariant.md)

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

> SystemPromptVariant create(systemPromptVariant)

CRUD for platform-global AI system prompt variants. Superuser-only. Use the &#x60;&#x60;activate&#x60;&#x60; action to promote a variant as the active prompt for its type (retiring the previous active variant). list: List all prompt variants (superuser only). Supports ?promptType&#x3D; filter. retrieve: Return a single variant. create: Create a new variant (status defaults to \&#39;draft\&#39;). update / partial_update: Edit a variant. Cannot edit an \&#39;active\&#39; variant directly — clone it first, edit the clone, then activate the clone. delete: Delete a variant. Active variants cannot be deleted.

### Example

```ts
import {
  Configuration,
  PromptVariantsApi,
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
  const api = new PromptVariantsApi(config);

  const body = {
    // SystemPromptVariant
    systemPromptVariant: ...,
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

| Name                    | Type                                          | Description | Notes |
| ----------------------- | --------------------------------------------- | ----------- | ----- |
| **systemPromptVariant** | [SystemPromptVariant](SystemPromptVariant.md) |             |       |

### Return type

[**SystemPromptVariant**](SystemPromptVariant.md)

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

CRUD for platform-global AI system prompt variants. Superuser-only. Use the &#x60;&#x60;activate&#x60;&#x60; action to promote a variant as the active prompt for its type (retiring the previous active variant). list: List all prompt variants (superuser only). Supports ?promptType&#x3D; filter. retrieve: Return a single variant. create: Create a new variant (status defaults to \&#39;draft\&#39;). update / partial_update: Edit a variant. Cannot edit an \&#39;active\&#39; variant directly — clone it first, edit the clone, then activate the clone. delete: Delete a variant. Active variants cannot be deleted.

### Example

```ts
import { Configuration, PromptVariantsApi } from '';
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
  const api = new PromptVariantsApi(config);

  const body = {
    // number | A unique integer value identifying this system prompt variant.
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

| Name   | Type     | Description                                                    | Notes                     |
| ------ | -------- | -------------------------------------------------------------- | ------------------------- |
| **id** | `number` | A unique integer value identifying this system prompt variant. | [Defaults to `undefined`] |

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

> PaginatedSystemPromptVariantList list(page, pageSize)

CRUD for platform-global AI system prompt variants. Superuser-only. Use the &#x60;&#x60;activate&#x60;&#x60; action to promote a variant as the active prompt for its type (retiring the previous active variant). list: List all prompt variants (superuser only). Supports ?promptType&#x3D; filter. retrieve: Return a single variant. create: Create a new variant (status defaults to \&#39;draft\&#39;). update / partial_update: Edit a variant. Cannot edit an \&#39;active\&#39; variant directly — clone it first, edit the clone, then activate the clone. delete: Delete a variant. Active variants cannot be deleted.

### Example

```ts
import { Configuration, PromptVariantsApi } from '';
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
  const api = new PromptVariantsApi(config);

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

[**PaginatedSystemPromptVariantList**](PaginatedSystemPromptVariantList.md)

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

> SystemPromptVariant partialUpdate(id, patchedSystemPromptVariant)

CRUD for platform-global AI system prompt variants. Superuser-only. Use the &#x60;&#x60;activate&#x60;&#x60; action to promote a variant as the active prompt for its type (retiring the previous active variant). list: List all prompt variants (superuser only). Supports ?promptType&#x3D; filter. retrieve: Return a single variant. create: Create a new variant (status defaults to \&#39;draft\&#39;). update / partial_update: Edit a variant. Cannot edit an \&#39;active\&#39; variant directly — clone it first, edit the clone, then activate the clone. delete: Delete a variant. Active variants cannot be deleted.

### Example

```ts
import {
  Configuration,
  PromptVariantsApi,
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
  const api = new PromptVariantsApi(config);

  const body = {
    // number | A unique integer value identifying this system prompt variant.
    id: 56,
    // PatchedSystemPromptVariant (optional)
    patchedSystemPromptVariant: ...,
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

| Name                           | Type                                                        | Description                                                    | Notes                     |
| ------------------------------ | ----------------------------------------------------------- | -------------------------------------------------------------- | ------------------------- |
| **id**                         | `number`                                                    | A unique integer value identifying this system prompt variant. | [Defaults to `undefined`] |
| **patchedSystemPromptVariant** | [PatchedSystemPromptVariant](PatchedSystemPromptVariant.md) |                                                                | [Optional]                |

### Return type

[**SystemPromptVariant**](SystemPromptVariant.md)

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

> SystemPromptVariant retrieve(id)

CRUD for platform-global AI system prompt variants. Superuser-only. Use the &#x60;&#x60;activate&#x60;&#x60; action to promote a variant as the active prompt for its type (retiring the previous active variant). list: List all prompt variants (superuser only). Supports ?promptType&#x3D; filter. retrieve: Return a single variant. create: Create a new variant (status defaults to \&#39;draft\&#39;). update / partial_update: Edit a variant. Cannot edit an \&#39;active\&#39; variant directly — clone it first, edit the clone, then activate the clone. delete: Delete a variant. Active variants cannot be deleted.

### Example

```ts
import { Configuration, PromptVariantsApi } from '';
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
  const api = new PromptVariantsApi(config);

  const body = {
    // number | A unique integer value identifying this system prompt variant.
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

| Name   | Type     | Description                                                    | Notes                     |
| ------ | -------- | -------------------------------------------------------------- | ------------------------- |
| **id** | `number` | A unique integer value identifying this system prompt variant. | [Defaults to `undefined`] |

### Return type

[**SystemPromptVariant**](SystemPromptVariant.md)

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

## settingsRetrieve

> { [key: string]: any | undefined; } settingsRetrieve()

Get the current Prompt Lab auto-improvement settings.

### Example

```ts
import { Configuration, PromptVariantsApi } from '';
import type { SettingsRetrieveRequest } from '';

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
  const api = new PromptVariantsApi(config);

  try {
    const data = await api.settingsRetrieve();
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

**{ [key: string]: any | undefined; }**

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

## settingsUpdateUpdate

> { [key: string]: any | undefined; } settingsUpdateUpdate(requestBody)

Update Prompt Lab auto-improvement settings.

### Example

```ts
import { Configuration, PromptVariantsApi } from '';
import type { SettingsUpdateUpdateRequest } from '';

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
  const api = new PromptVariantsApi(config);

  const body = {
    // { [key: string]: any | undefined; } (optional)
    requestBody: Object,
  } satisfies SettingsUpdateUpdateRequest;

  try {
    const data = await api.settingsUpdateUpdate(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name            | Type                  | Description   | Notes |
| --------------- | --------------------- | ------------- | ----- | ---------- |
| **requestBody** | `{ [key: string]: any | undefined; }` |       | [Optional] |

### Return type

**{ [key: string]: any | undefined; }**

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

## statsRetrieve

> { [key: string]: any | undefined; } statsRetrieve(id)

Get performance stats for this prompt variant: behavioral metrics (acceptance/rejection/edit rates, time to decide) and explicit feedback (thumbs up/down).

### Example

```ts
import { Configuration, PromptVariantsApi } from '';
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
  const api = new PromptVariantsApi(config);

  const body = {
    // number | A unique integer value identifying this system prompt variant.
    id: 56,
  } satisfies StatsRetrieveRequest;

  try {
    const data = await api.statsRetrieve(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name   | Type     | Description                                                    | Notes                     |
| ------ | -------- | -------------------------------------------------------------- | ------------------------- |
| **id** | `number` | A unique integer value identifying this system prompt variant. | [Defaults to `undefined`] |

### Return type

**{ [key: string]: any | undefined; }**

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

> SystemPromptVariant update(id, systemPromptVariant)

CRUD for platform-global AI system prompt variants. Superuser-only. Use the &#x60;&#x60;activate&#x60;&#x60; action to promote a variant as the active prompt for its type (retiring the previous active variant). list: List all prompt variants (superuser only). Supports ?promptType&#x3D; filter. retrieve: Return a single variant. create: Create a new variant (status defaults to \&#39;draft\&#39;). update / partial_update: Edit a variant. Cannot edit an \&#39;active\&#39; variant directly — clone it first, edit the clone, then activate the clone. delete: Delete a variant. Active variants cannot be deleted.

### Example

```ts
import {
  Configuration,
  PromptVariantsApi,
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
  const api = new PromptVariantsApi(config);

  const body = {
    // number | A unique integer value identifying this system prompt variant.
    id: 56,
    // SystemPromptVariant
    systemPromptVariant: ...,
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

| Name                    | Type                                          | Description                                                    | Notes                     |
| ----------------------- | --------------------------------------------- | -------------------------------------------------------------- | ------------------------- |
| **id**                  | `number`                                      | A unique integer value identifying this system prompt variant. | [Defaults to `undefined`] |
| **systemPromptVariant** | [SystemPromptVariant](SystemPromptVariant.md) |                                                                |                           |

### Return type

[**SystemPromptVariant**](SystemPromptVariant.md)

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
