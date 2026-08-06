# OttApi

All URIs are relative to *http://localhost*

| Method                                             | HTTP request            | Description |
| -------------------------------------------------- | ----------------------- | ----------- |
| [**exchangeCreate**](OttApi.md#exchangecreate)     | **POST** /ott/exchange/ |             |
| [**generateCreate**](OttApi.md#generatecreate)     | **POST** /ott/generate/ |             |
| [**generateRetrieve**](OttApi.md#generateretrieve) | **GET** /ott/generate/  |             |
| [**retrieve**](OttApi.md#retrieve)                 | **GET** /ott/           |             |
| [**validateCreate**](OttApi.md#validatecreate)     | **POST** /ott/validate/ |             |
| [**validateRetrieve**](OttApi.md#validateretrieve) | **GET** /ott/validate/  |             |

## exchangeCreate

> ExchangeOTTResponse exchangeCreate(exchangeOTTRequest)

Consume a one-time token and issue a normal interactive access + refresh pair. Used by the Safe Exam Browser launch flow: SEB opens a fresh browser session with no stored auth, so the launch URL carries an OTT that this endpoint exchanges for the same short-lived, rotating session a login would issue. Deliberately NOT /ott/validate/, which issues a 365-day standalone token for long-lived Jupyter servers — the wrong risk profile for a student quiz session.

### Example

```ts
import {
  Configuration,
  OttApi,
} from '';
import type { ExchangeCreateRequest } from '';

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
  const api = new OttApi(config);

  const body = {
    // ExchangeOTTRequest
    exchangeOTTRequest: ...,
  } satisfies ExchangeCreateRequest;

  try {
    const data = await api.exchangeCreate(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                   | Type                                        | Description | Notes |
| ---------------------- | ------------------------------------------- | ----------- | ----- |
| **exchangeOTTRequest** | [ExchangeOTTRequest](ExchangeOTTRequest.md) |             |       |

### Return type

[**ExchangeOTTResponse**](ExchangeOTTResponse.md)

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

## generateCreate

> GenerateOTTResponse generateCreate(generateOTTRequest)

Generate a one-time token for the authenticated course instructor. Used to create one time tokens for jupyter servers.

### Example

```ts
import {
  Configuration,
  OttApi,
} from '';
import type { GenerateCreateRequest } from '';

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
  const api = new OttApi(config);

  const body = {
    // GenerateOTTRequest
    generateOTTRequest: ...,
  } satisfies GenerateCreateRequest;

  try {
    const data = await api.generateCreate(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                   | Type                                        | Description | Notes |
| ---------------------- | ------------------------------------------- | ----------- | ----- |
| **generateOTTRequest** | [GenerateOTTRequest](GenerateOTTRequest.md) |             |       |

### Return type

[**GenerateOTTResponse**](GenerateOTTResponse.md)

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

## generateRetrieve

> GenerateOTTResponse generateRetrieve()

Generate a one-time token for the authenticated course instructor. Used to create one time tokens for jupyter servers.

### Example

```ts
import { Configuration, OttApi } from '';
import type { GenerateRetrieveRequest } from '';

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
  const api = new OttApi(config);

  try {
    const data = await api.generateRetrieve();
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

[**GenerateOTTResponse**](GenerateOTTResponse.md)

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

> JwtOttResponse retrieve()

Generate a JWT short-lived 5 min token for the authenticated user. Used to exchange a one-time token for imbedding in an iframe or other uses.

### Example

```ts
import { Configuration, OttApi } from '';
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
  });
  const api = new OttApi(config);

  try {
    const data = await api.retrieve();
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

[**JwtOttResponse**](JwtOttResponse.md)

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

## validateCreate

> User validateCreate(validateOTTRequest)

Validate a one-time token and return the associated user data. Used for long lived Jupyter server sessions. Should stay in memory.

### Example

```ts
import {
  Configuration,
  OttApi,
} from '';
import type { ValidateCreateRequest } from '';

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
  const api = new OttApi(config);

  const body = {
    // ValidateOTTRequest
    validateOTTRequest: ...,
  } satisfies ValidateCreateRequest;

  try {
    const data = await api.validateCreate(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                   | Type                                        | Description | Notes |
| ---------------------- | ------------------------------------------- | ----------- | ----- |
| **validateOTTRequest** | [ValidateOTTRequest](ValidateOTTRequest.md) |             |       |

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

## validateRetrieve

> User validateRetrieve()

Validate a one-time token and return the associated user data. Used for long lived Jupyter server sessions. Should stay in memory.

### Example

```ts
import { Configuration, OttApi } from '';
import type { ValidateRetrieveRequest } from '';

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
  const api = new OttApi(config);

  try {
    const data = await api.validateRetrieve();
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

[**User**](User.md)

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
