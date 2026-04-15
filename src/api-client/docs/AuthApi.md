# AuthApi

All URIs are relative to _http://localhost_

| Method                                                    | HTTP request                           | Description |
| --------------------------------------------------------- | -------------------------------------- | ----------- |
| [**ssoCallbackRetrieve**](AuthApi.md#ssocallbackretrieve) | **GET** /auth/sso/callback/{provider}/ |             |
| [**ssoCheckRetrieve**](AuthApi.md#ssocheckretrieve)       | **GET** /auth/sso/check/               |             |
| [**ssoConfigRetrieve**](AuthApi.md#ssoconfigretrieve)     | **GET** /auth/sso/config/              |             |
| [**ssoConfigRetrieve2**](AuthApi.md#ssoconfigretrieve2)   | **GET** /auth/sso/config/{shortname}/  |             |
| [**ssoLoginRetrieve**](AuthApi.md#ssologinretrieve)       | **GET** /auth/sso/login/{provider}/    |             |

## ssoCallbackRetrieve

> ssoCallbackRetrieve(provider)

Handles the callback from the SSO provider. Validates ticket/code, creates session, redirects to frontend.

### Example

```ts
import { Configuration, AuthApi } from '';
import type { SsoCallbackRetrieveRequest } from '';

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
  const api = new AuthApi(config);

  const body = {
    // string
    provider: provider_example,
  } satisfies SsoCallbackRetrieveRequest;

  try {
    const data = await api.ssoCallbackRetrieve(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name         | Type     | Description | Notes                     |
| ------------ | -------- | ----------- | ------------------------- |
| **provider** | `string` |             | [Defaults to `undefined`] |

### Return type

`void` (Empty response body)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [courseKeyAuth](../README.md#courseKeyAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: Not defined

### HTTP response details

| Status code | Description                     | Response headers |
| ----------- | ------------------------------- | ---------------- |
| **302**     | Redirect to frontend with token | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## ssoCheckRetrieve

> CheckSSOAvailabilityResponse ssoCheckRetrieve()

Checks if the given email belongs to an SSO-enabled organization. Returns { \&quot;sso_enabled\&quot;: true, \&quot;provider\&quot;: \&quot;CAS\&quot;, \&quot;org_id\&quot;: 123 } or { \&quot;sso_enabled\&quot;: false }

### Example

```ts
import { Configuration, AuthApi } from '';
import type { SsoCheckRetrieveRequest } from '';

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
  const api = new AuthApi(config);

  try {
    const data = await api.ssoCheckRetrieve();
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

[**CheckSSOAvailabilityResponse**](CheckSSOAvailabilityResponse.md)

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

## ssoConfigRetrieve

> MainOrgSSOConfig ssoConfigRetrieve()

Returns SSO configuration for the main/default organization. Used by the frontend to auto-redirect to SSO on the default login page.

### Example

```ts
import { Configuration, AuthApi } from '';
import type { SsoConfigRetrieveRequest } from '';

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
  const api = new AuthApi(config);

  try {
    const data = await api.ssoConfigRetrieve();
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

[**MainOrgSSOConfig**](MainOrgSSOConfig.md)

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

## ssoConfigRetrieve2

> OrgSSOConfig ssoConfigRetrieve2(shortname)

Returns SSO configuration for a specific organization by shortname. Used by the frontend for per-org login pages (e.g. /login/RU).

### Example

```ts
import { Configuration, AuthApi } from '';
import type { SsoConfigRetrieve2Request } from '';

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
  const api = new AuthApi(config);

  const body = {
    // string
    shortname: shortname_example,
  } satisfies SsoConfigRetrieve2Request;

  try {
    const data = await api.ssoConfigRetrieve2(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name          | Type     | Description | Notes                     |
| ------------- | -------- | ----------- | ------------------------- |
| **shortname** | `string` |             | [Defaults to `undefined`] |

### Return type

[**OrgSSOConfig**](OrgSSOConfig.md)

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

## ssoLoginRetrieve

> ssoLoginRetrieve(provider)

Redirects user to the SSO provider\&#39;s login page. Requires \&#39;email\&#39; query param to identify the organization (and thus the config), OR \&#39;org\&#39; ID directly.

### Example

```ts
import { Configuration, AuthApi } from '';
import type { SsoLoginRetrieveRequest } from '';

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
  const api = new AuthApi(config);

  const body = {
    // string
    provider: provider_example,
  } satisfies SsoLoginRetrieveRequest;

  try {
    const data = await api.ssoLoginRetrieve(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name         | Type     | Description | Notes                     |
| ------------ | -------- | ----------- | ------------------------- |
| **provider** | `string` |             | [Defaults to `undefined`] |

### Return type

`void` (Empty response body)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [courseKeyAuth](../README.md#courseKeyAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: Not defined

### HTTP response details

| Status code | Description              | Response headers |
| ----------- | ------------------------ | ---------------- |
| **302**     | Redirect to SSO provider | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
