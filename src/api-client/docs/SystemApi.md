# SystemApi

All URIs are relative to _http://localhost_

| Method                                                | HTTP request              | Description |
| ----------------------------------------------------- | ------------------------- | ----------- |
| [**activityRetrieve**](SystemApi.md#activityretrieve) | **GET** /system/activity/ |             |
| [**healthRetrieve**](SystemApi.md#healthretrieve)     | **GET** /system/health/   |             |

## activityRetrieve

> SystemActivityResponse activityRetrieve(category, endDate, page, pageSize, search, startDate)

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
    // Configure HTTP bearer authorization: jwtAuth
    accessToken: 'YOUR BEARER TOKEN',
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

| Name          | Type     | Description                                               | Notes                                |
| ------------- | -------- | --------------------------------------------------------- | ------------------------------------ |
| **category**  | `string` | Filter by event category (exact match)                    | [Optional] [Defaults to `undefined`] |
| **endDate**   | `string` | Filter events created on or before this ISO 8601 datetime | [Optional] [Defaults to `undefined`] |
| **page**      | `number` |                                                           | [Optional] [Defaults to `undefined`] |
| **pageSize**  | `number` |                                                           | [Optional] [Defaults to `undefined`] |
| **search**    | `string` | Search across description, user, and meta fields          | [Optional] [Defaults to `undefined`] |
| **startDate** | `string` | Filter events created on or after this ISO 8601 datetime  | [Optional] [Defaults to `undefined`] |

### Return type

[**SystemActivityResponse**](SystemActivityResponse.md)

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
    // Configure HTTP bearer authorization: jwtAuth
    accessToken: 'YOUR BEARER TOKEN',
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

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **200**     |             | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
