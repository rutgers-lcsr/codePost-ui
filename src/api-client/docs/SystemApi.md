# SystemApi

All URIs are relative to _http://localhost_

| Method                                                      | HTTP request              | Description |
| ----------------------------------------------------------- | ------------------------- | ----------- |
| [**activityRetrieve**](SystemApi.md#activityretrieve)       | **GET** /system/activity/ |             |
| [**aiModelsRetrieve**](SystemApi.md#aimodelsretrieve)       | **GET** /system/aiModels/ |             |
| [**aiUsageRetrieve**](SystemApi.md#aiusageretrieve)         | **GET** /system/aiUsage/  |             |
| [**bannerPartialUpdate**](SystemApi.md#bannerpartialupdate) | **PATCH** /system/banner/ |             |
| [**bannerRetrieve**](SystemApi.md#bannerretrieve)           | **GET** /system/banner/   |             |
| [**healthRetrieve**](SystemApi.md#healthretrieve)           | **GET** /system/health/   |             |

## activityRetrieve

> SystemActivityResponse activityRetrieve(category, endDate, page, pageSize, search, startDate, type)

### Example

```ts
import { Configuration, SystemApi } from '';
import type { ActivityRetrieveRequest } from '';

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
  const api = new SystemApi(config);

  const body = {
    // string | Filter by event category (exact match) (optional)
    category: category_example,
    // string | Filter events created on or before this ISO 8601 datetime (optional)
    endDate: endDate_example,
    // number (optional)
    page: 56,
    // number (optional)
    pageSize: 56,
    // string | Search across description, user, and meta fields (optional)
    search: search_example,
    // string | Filter events created on or after this ISO 8601 datetime (optional)
    startDate: startDate_example,
    // string | Filter by event type: \'audit\' for login/security events, \'activity\' for system events (optional)
    type: type_example,
  } satisfies ActivityRetrieveRequest;

  try {
    const data = await api.activityRetrieve(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name          | Type     | Description                                                                                               | Notes                                |
| ------------- | -------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| **category**  | `string` | Filter by event category (exact match)                                                                    | [Optional] [Defaults to `undefined`] |
| **endDate**   | `string` | Filter events created on or before this ISO 8601 datetime                                                 | [Optional] [Defaults to `undefined`] |
| **page**      | `number` |                                                                                                           | [Optional] [Defaults to `undefined`] |
| **pageSize**  | `number` |                                                                                                           | [Optional] [Defaults to `undefined`] |
| **search**    | `string` | Search across description, user, and meta fields                                                          | [Optional] [Defaults to `undefined`] |
| **startDate** | `string` | Filter events created on or after this ISO 8601 datetime                                                  | [Optional] [Defaults to `undefined`] |
| **type**      | `string` | Filter by event type: \&#39;audit\&#39; for login/security events, \&#39;activity\&#39; for system events | [Optional] [Defaults to `undefined`] |

### Return type

[**SystemActivityResponse**](SystemActivityResponse.md)

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

## aiModelsRetrieve

> AIProviderModelsList aiModelsRetrieve(provider)

GET: Return the curated list of AI models per provider. Optional query params: ?provider&#x3D;X to filter by provider. No credentials are required — this just returns the static list.

### Example

```ts
import { Configuration, SystemApi } from '';
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
  const api = new SystemApi(config);

  const body = {
    // 'custom' | 'gemini' | 'ollama' | 'openai' | 'portkey' | Filter to a single provider (optional)
    provider: provider_example,
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

| Name         | Type                                              | Description                 | Notes                                                                                |
| ------------ | ------------------------------------------------- | --------------------------- | ------------------------------------------------------------------------------------ |
| **provider** | `custom`, `gemini`, `ollama`, `openai`, `portkey` | Filter to a single provider | [Optional] [Defaults to `undefined`] [Enum: custom, gemini, ollama, openai, portkey] |

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

## aiUsageRetrieve

> AIUsageSummary aiUsageRetrieve(endDate, granularity, organizationId, startDate)

GET /system/aiUsage/ — Platform-wide AI usage analytics. Superuser only. Supports granularity, date range, and org breakdown.

### Example

```ts
import { Configuration, SystemApi } from '';
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
  const api = new SystemApi(config);

  const body = {
    // string | End date (ISO 8601) (optional)
    endDate: endDate_example,
    // 'daily' | 'hourly' | 'monthly' | Time bucket granularity: \'hourly\', \'daily\', or \'monthly\' (optional)
    granularity: granularity_example,
    // number | Filter to a specific organization ID (optional)
    organizationId: 56,
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

| Name               | Type                         | Description                                                                            | Notes                                                               |
| ------------------ | ---------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| **endDate**        | `string`                     | End date (ISO 8601)                                                                    | [Optional] [Defaults to `undefined`]                                |
| **granularity**    | `daily`, `hourly`, `monthly` | Time bucket granularity: \&#39;hourly\&#39;, \&#39;daily\&#39;, or \&#39;monthly\&#39; | [Optional] [Defaults to `undefined`] [Enum: daily, hourly, monthly] |
| **organizationId** | `number`                     | Filter to a specific organization ID                                                   | [Optional] [Defaults to `undefined`]                                |
| **startDate**      | `string`                     | Start date (ISO 8601)                                                                  | [Optional] [Defaults to `undefined`]                                |

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

## bannerPartialUpdate

> MaintenanceBannerResponse bannerPartialUpdate(patchedMaintenanceBanner)

Update the maintenance banner. Requires admin authentication.

### Example

```ts
import {
  Configuration,
  SystemApi,
} from '';
import type { BannerPartialUpdateRequest } from '';

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
  const api = new SystemApi(config);

  const body = {
    // PatchedMaintenanceBanner (optional)
    patchedMaintenanceBanner: ...,
  } satisfies BannerPartialUpdateRequest;

  try {
    const data = await api.bannerPartialUpdate(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                         | Type                                                    | Description | Notes      |
| ---------------------------- | ------------------------------------------------------- | ----------- | ---------- |
| **patchedMaintenanceBanner** | [PatchedMaintenanceBanner](PatchedMaintenanceBanner.md) |             | [Optional] |

### Return type

[**MaintenanceBannerResponse**](MaintenanceBannerResponse.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [courseKeyAuth](../README.md#courseKeyAuth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **200**     |             | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## bannerRetrieve

> MaintenanceBannerResponse bannerRetrieve()

Returns the current maintenance banner configuration. No authentication required.

### Example

```ts
import { Configuration, SystemApi } from '';
import type { BannerRetrieveRequest } from '';

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
  const api = new SystemApi(config);

  try {
    const data = await api.bannerRetrieve();
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

[**MaintenanceBannerResponse**](MaintenanceBannerResponse.md)

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

## healthRetrieve

> SystemHealthResponse healthRetrieve()

### Example

```ts
import { Configuration, SystemApi } from '';
import type { HealthRetrieveRequest } from '';

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
  const api = new SystemApi(config);

  try {
    const data = await api.healthRetrieve();
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

[**SystemHealthResponse**](SystemHealthResponse.md)

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
