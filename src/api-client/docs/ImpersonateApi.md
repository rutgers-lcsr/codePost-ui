# ImpersonateApi

All URIs are relative to _http://localhost_

| Method                                 | HTTP request           | Description |
| -------------------------------------- | ---------------------- | ----------- |
| [**create**](ImpersonateApi.md#create) | **POST** /impersonate/ |             |

## create

> User create(impersonateRequest)

View to handle impersonation of users. Accepts either \&#39;username\&#39; (exact match) or \&#39;email\&#39; (lookup by email) in the POST body. Staff/superusers can impersonate any user. Course admins can only impersonate students or graders in courses they administer.

### Example

```ts
import {
  Configuration,
  ImpersonateApi,
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
  const api = new ImpersonateApi(config);

  const body = {
    // ImpersonateRequest (optional)
    impersonateRequest: ...,
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

| Name                   | Type                                        | Description | Notes      |
| ---------------------- | ------------------------------------------- | ----------- | ---------- |
| **impersonateRequest** | [ImpersonateRequest](ImpersonateRequest.md) |             | [Optional] |

### Return type

[**User**](User.md)

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
