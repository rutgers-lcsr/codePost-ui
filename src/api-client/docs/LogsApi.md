# LogsApi

All URIs are relative to _http://localhost_

| Method                                                  | HTTP request                 | Description |
| ------------------------------------------------------- | ---------------------------- | ----------- |
| [**logCreate**](LogsApi.md#logcreate)                   | **POST** /logs/log/          |             |
| [**logErrorCreate**](LogsApi.md#logerrorcreate)         | **POST** /logs/logError/     |             |
| [**logHappinessCreate**](LogsApi.md#loghappinesscreate) | **POST** /logs/logHappiness/ |             |

## logCreate

> LogSuccessResponse logCreate(logDumpRequest)

### Example

```ts
import {
  Configuration,
  LogsApi,
} from '';
import type { LogCreateRequest } from '';

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
  const api = new LogsApi(config);

  const body = {
    // LogDumpRequest (optional)
    logDumpRequest: ...,
  } satisfies LogCreateRequest;

  try {
    const data = await api.logCreate(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name               | Type                                | Description | Notes      |
| ------------------ | ----------------------------------- | ----------- | ---------- |
| **logDumpRequest** | [LogDumpRequest](LogDumpRequest.md) |             | [Optional] |

### Return type

[**LogSuccessResponse**](LogSuccessResponse.md)

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

## logErrorCreate

> LogSuccessResponse logErrorCreate(logErrorRequest)

Request body includes: error, errorInfo. Notifies codePost of any uncaught UI errors. Initiated via globally-scoped ErrorBoundary on the frontend. https://reactjs.org/docs/error-boundaries.html

### Example

```ts
import {
  Configuration,
  LogsApi,
} from '';
import type { LogErrorCreateRequest } from '';

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
  const api = new LogsApi(config);

  const body = {
    // LogErrorRequest (optional)
    logErrorRequest: ...,
  } satisfies LogErrorCreateRequest;

  try {
    const data = await api.logErrorCreate(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                | Type                                  | Description | Notes      |
| ------------------- | ------------------------------------- | ----------- | ---------- |
| **logErrorRequest** | [LogErrorRequest](LogErrorRequest.md) |             | [Optional] |

### Return type

[**LogSuccessResponse**](LogSuccessResponse.md)

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

## logHappinessCreate

> LogSuccessResponse logHappinessCreate(logHappinessRequest)

Notifies codePost of any happiness occurring on the frontend (by authenticated users).

### Example

```ts
import {
  Configuration,
  LogsApi,
} from '';
import type { LogHappinessCreateRequest } from '';

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
  const api = new LogsApi(config);

  const body = {
    // LogHappinessRequest (optional)
    logHappinessRequest: ...,
  } satisfies LogHappinessCreateRequest;

  try {
    const data = await api.logHappinessCreate(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                    | Type                                          | Description | Notes      |
| ----------------------- | --------------------------------------------- | ----------- | ---------- |
| **logHappinessRequest** | [LogHappinessRequest](LogHappinessRequest.md) |             | [Optional] |

### Return type

[**LogSuccessResponse**](LogSuccessResponse.md)

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
