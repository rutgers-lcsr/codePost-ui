# CapabilitiesApi

All URIs are relative to _http://localhost_

| Method                                                      | HTTP request                    | Description |
| ----------------------------------------------------------- | ------------------------------- | ----------- |
| [**batchCreate**](CapabilitiesApi.md#batchcreate)           | **POST** /capabilities/batch/   |             |
| [**platformRetrieve**](CapabilitiesApi.md#platformretrieve) | **GET** /capabilities/platform/ |             |

## batchCreate

> BatchCapabilitiesResponse batchCreate(batchCapabilitiesRequest)

Return capabilities for multiple resources in a single request. Accepts up to 20 keys like &#x60;&#x60;\&quot;course:1\&quot;&#x60;&#x60;, &#x60;&#x60;\&quot;assignment:5\&quot;&#x60;&#x60;, &#x60;&#x60;\&quot;submission:42\&quot;&#x60;&#x60;, or &#x60;&#x60;\&quot;platform\&quot;&#x60;&#x60;. Returns a map of key → capability dict. Invalid or inaccessible keys are silently skipped. A shared &#x60;&#x60;RoleCache&#x60;&#x60; is used across all computations so that role-check DB queries are deduplicated.

### Example

```ts
import {
  Configuration,
  CapabilitiesApi,
} from '';
import type { BatchCreateRequest } from '';

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
  const api = new CapabilitiesApi(config);

  const body = {
    // BatchCapabilitiesRequest
    batchCapabilitiesRequest: ...,
  } satisfies BatchCreateRequest;

  try {
    const data = await api.batchCreate(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                         | Type                                                    | Description | Notes |
| ---------------------------- | ------------------------------------------------------- | ----------- | ----- |
| **batchCapabilitiesRequest** | [BatchCapabilitiesRequest](BatchCapabilitiesRequest.md) |             |       |

### Return type

[**BatchCapabilitiesResponse**](BatchCapabilitiesResponse.md)

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

## platformRetrieve

> CapabilitiesResponse platformRetrieve(descriptions)

Return the requesting user\&#39;s platform-level capabilities.

### Example

```ts
import { Configuration, CapabilitiesApi } from '';
import type { PlatformRetrieveRequest } from '';

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
  const api = new CapabilitiesApi(config);

  const body = {
    // boolean | Include human-readable descriptions for each capability. (optional)
    descriptions: true,
  } satisfies PlatformRetrieveRequest;

  try {
    const data = await api.platformRetrieve(body);
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
