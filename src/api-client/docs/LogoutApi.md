# LogoutApi

All URIs are relative to *http://localhost*

| Method                            | HTTP request      | Description |
| --------------------------------- | ----------------- | ----------- |
| [**create**](LogoutApi.md#create) | **POST** /logout/ |             |

## create

> LogoutResponse create(logoutRequest)

Revoke a single session by blacklisting its refresh token. Idempotent: an already-blacklisted, expired, or malformed token still returns 200 so the client can proceed to clear local state and redirect to login.

### Example

```ts
import {
  Configuration,
  LogoutApi,
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
  });
  const api = new LogoutApi(config);

  const body = {
    // LogoutRequest
    logoutRequest: ...,
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

| Name              | Type                              | Description | Notes |
| ----------------- | --------------------------------- | ----------- | ----- |
| **logoutRequest** | [LogoutRequest](LogoutRequest.md) |             |       |

### Return type

[**LogoutResponse**](LogoutResponse.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth)

### HTTP request headers

- **Content-Type**: `application/json`, `application/x-www-form-urlencoded`, `multipart/form-data`
- **Accept**: `application/json`

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **200**     |             | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
