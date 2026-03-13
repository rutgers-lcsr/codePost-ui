# TokenRefreshApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**create**](TokenRefreshApi.md#create) | **POST** /token-refresh/ |  |



## create

> TokenRefreshSliding create(tokenRefreshSliding)



Takes a sliding JSON web token and returns a new, refreshed version if the token\&#39;s refresh period has not expired.

### Example

```ts
import {
  Configuration,
  TokenRefreshApi,
} from '';
import type { CreateRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new TokenRefreshApi();

  const body = {
    // TokenRefreshSliding
    tokenRefreshSliding: ...,
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


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **tokenRefreshSliding** | [TokenRefreshSliding](TokenRefreshSliding.md) |  | |

### Return type

[**TokenRefreshSliding**](TokenRefreshSliding.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `application/json`, `application/x-www-form-urlencoded`, `multipart/form-data`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

