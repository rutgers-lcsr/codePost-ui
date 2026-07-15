# LogoutAllApi

All URIs are relative to *http://localhost*

| Method                               | HTTP request          | Description |
| ------------------------------------ | --------------------- | ----------- |
| [**create**](LogoutAllApi.md#create) | **POST** /logout-all/ |             |

## create

> LogoutResponse create()

Revoke every session for the authenticated user (\&quot;log out everywhere\&quot;) by blacklisting all of their outstanding refresh tokens.

### Example

```ts
import { Configuration, LogoutAllApi } from '';
import type { CreateRequest } from '';

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
  });
  const api = new LogoutAllApi(config);

  try {
    const data = await api.create();
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

[**LogoutResponse**](LogoutResponse.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **200**     |             | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
