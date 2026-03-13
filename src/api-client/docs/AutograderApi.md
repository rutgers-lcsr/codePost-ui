# AutograderApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**environmentsBuildPartialUpdate**](AutograderApi.md#environmentsbuildpartialupdate) | **PATCH** /autograder/environments/{id}/build/ |  |
| [**environmentsBuildStatusRetrieve**](AutograderApi.md#environmentsbuildstatusretrieve) | **GET** /autograder/environments/{id}/build_status/ |  |
| [**environmentsCleanupCreate**](AutograderApi.md#environmentscleanupcreate) | **POST** /autograder/environments/{environmentId}/cleanup/ |  |
| [**environmentsConvertToManualCreate**](AutograderApi.md#environmentsconverttomanualcreate) | **POST** /autograder/environments/{environmentId}/convert-to-manual/ |  |
| [**environmentsCreate**](AutograderApi.md#environmentscreate) | **POST** /autograder/environments/ |  |
| [**environmentsDestroy**](AutograderApi.md#environmentsdestroy) | **DELETE** /autograder/environments/{id}/ |  |
| [**environmentsDockerfileRetrieve**](AutograderApi.md#environmentsdockerfileretrieve) | **GET** /autograder/environments/{id}/dockerfile/ |  |
| [**environmentsEjectRetrieve**](AutograderApi.md#environmentsejectretrieve) | **GET** /autograder/environments/{id}/eject/ |  |
| [**environmentsList**](AutograderApi.md#environmentslist) | **GET** /autograder/environments/ |  |
| [**environmentsPartialUpdate**](AutograderApi.md#environmentspartialupdate) | **PATCH** /autograder/environments/{id}/ |  |
| [**environmentsPreviewCreate**](AutograderApi.md#environmentspreviewcreate) | **POST** /autograder/environments/{id}/preview/ |  |
| [**environmentsRetrieve**](AutograderApi.md#environmentsretrieve) | **GET** /autograder/environments/{id}/ |  |
| [**environmentsRollbackCreate**](AutograderApi.md#environmentsrollbackcreate) | **POST** /autograder/environments/{environmentId}/rollback/ |  |
| [**environmentsRunAllPartialUpdate**](AutograderApi.md#environmentsrunallpartialupdate) | **PATCH** /autograder/environments/{id}/runAll/ |  |
| [**environmentsRunPartialUpdate**](AutograderApi.md#environmentsrunpartialupdate) | **PATCH** /autograder/environments/{id}/run/ |  |
| [**environmentsStatusRetrieve**](AutograderApi.md#environmentsstatusretrieve) | **GET** /autograder/environments/{environmentId}/status/ |  |
| [**environmentsUpdate**](AutograderApi.md#environmentsupdate) | **PUT** /autograder/environments/{id}/ |  |
| [**executeCodeCreate**](AutograderApi.md#executecodecreate) | **POST** /autograder/execute/code/ |  |
| [**executeFileAsyncCreate**](AutograderApi.md#executefileasynccreate) | **POST** /autograder/execute/file/async/ |  |
| [**executeFileCacheCheckRetrieve**](AutograderApi.md#executefilecachecheckretrieve) | **GET** /autograder/execute/file/cache/check/ |  |
| [**executeFileCreate**](AutograderApi.md#executefilecreate) | **POST** /autograder/execute/file/ |  |
| [**executeFileStreamingCreate**](AutograderApi.md#executefilestreamingcreate) | **POST** /autograder/execute/file/streaming/ |  |
| [**executeNotebookCellCreate**](AutograderApi.md#executenotebookcellcreate) | **POST** /autograder/execute/notebook-cell/ |  |
| [**executeNotebookCreate**](AutograderApi.md#executenotebookcreate) | **POST** /autograder/execute/notebook/ |  |
| [**shellMetricsRetrieve**](AutograderApi.md#shellmetricsretrieve) | **GET** /autograder/shell/metrics/ |  |
| [**tasksRetrieve**](AutograderApi.md#tasksretrieve) | **GET** /autograder/tasks/{id}/ |  |
| [**v2RunCreate**](AutograderApi.md#v2runcreate) | **POST** /autograder/v2/run/ |  |



## environmentsBuildPartialUpdate

> EnvironmentBuildResponse environmentsBuildPartialUpdate(id, patchedEnvironmentBuildRequest)



list: Return a list of all the testFiles.

### Example

```ts
import {
  Configuration,
  AutograderApi,
} from '';
import type { EnvironmentsBuildPartialUpdateRequest } from '';

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
    // Configure HTTP bearer authorization: jwtAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AutograderApi(config);

  const body = {
    // number | A unique integer value identifying this environment.
    id: 56,
    // PatchedEnvironmentBuildRequest (optional)
    patchedEnvironmentBuildRequest: ...,
  } satisfies EnvironmentsBuildPartialUpdateRequest;

  try {
    const data = await api.environmentsBuildPartialUpdate(body);
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
| **id** | `number` | A unique integer value identifying this environment. | [Defaults to `undefined`] |
| **patchedEnvironmentBuildRequest** | [PatchedEnvironmentBuildRequest](PatchedEnvironmentBuildRequest.md) |  | [Optional] |

### Return type

[**EnvironmentBuildResponse**](EnvironmentBuildResponse.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

### HTTP request headers

- **Content-Type**: `application/json`, `application/x-www-form-urlencoded`, `multipart/form-data`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |
| **500** | Async build dispatch failed |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## environmentsBuildStatusRetrieve

> EnvironmentBuildStatusResponse environmentsBuildStatusRetrieve(id)



list: Return a list of all the testFiles.

### Example

```ts
import {
  Configuration,
  AutograderApi,
} from '';
import type { EnvironmentsBuildStatusRetrieveRequest } from '';

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
    // Configure HTTP bearer authorization: jwtAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AutograderApi(config);

  const body = {
    // number | A unique integer value identifying this environment.
    id: 56,
  } satisfies EnvironmentsBuildStatusRetrieveRequest;

  try {
    const data = await api.environmentsBuildStatusRetrieve(body);
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
| **id** | `number` | A unique integer value identifying this environment. | [Defaults to `undefined`] |

### Return type

[**EnvironmentBuildStatusResponse**](EnvironmentBuildStatusResponse.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |
| **500** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## environmentsCleanupCreate

> EnvironmentCleanupResponse environmentsCleanupCreate(environmentId, environmentCleanupRequest)



Cleanup old Docker images for environment.  POST /autograder/environments/&lt;id&gt;/cleanup/ Body: {\&quot;keep_count\&quot;: 2}  (optional, defaults to 3)

### Example

```ts
import {
  Configuration,
  AutograderApi,
} from '';
import type { EnvironmentsCleanupCreateRequest } from '';

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
    // Configure HTTP bearer authorization: jwtAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AutograderApi(config);

  const body = {
    // number
    environmentId: 56,
    // EnvironmentCleanupRequest (optional)
    environmentCleanupRequest: ...,
  } satisfies EnvironmentsCleanupCreateRequest;

  try {
    const data = await api.environmentsCleanupCreate(body);
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
| **environmentId** | `number` |  | [Defaults to `undefined`] |
| **environmentCleanupRequest** | [EnvironmentCleanupRequest](EnvironmentCleanupRequest.md) |  | [Optional] |

### Return type

[**EnvironmentCleanupResponse**](EnvironmentCleanupResponse.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

### HTTP request headers

- **Content-Type**: `application/json`, `application/x-www-form-urlencoded`, `multipart/form-data`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## environmentsConvertToManualCreate

> EnvironmentConvertToManualResponse environmentsConvertToManualCreate(environmentId, environmentConvertToManualRequest)



Convert auto-detect environment to manual configuration.  POST /autograder/environments/&lt;id&gt;/convert-to-manual/ Body: {\&quot;from_version\&quot;: 2}  (optional, uses current if not specified)

### Example

```ts
import {
  Configuration,
  AutograderApi,
} from '';
import type { EnvironmentsConvertToManualCreateRequest } from '';

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
    // Configure HTTP bearer authorization: jwtAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AutograderApi(config);

  const body = {
    // number
    environmentId: 56,
    // EnvironmentConvertToManualRequest (optional)
    environmentConvertToManualRequest: ...,
  } satisfies EnvironmentsConvertToManualCreateRequest;

  try {
    const data = await api.environmentsConvertToManualCreate(body);
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
| **environmentId** | `number` |  | [Defaults to `undefined`] |
| **environmentConvertToManualRequest** | [EnvironmentConvertToManualRequest](EnvironmentConvertToManualRequest.md) |  | [Optional] |

### Return type

[**EnvironmentConvertToManualResponse**](EnvironmentConvertToManualResponse.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

### HTTP request headers

- **Content-Type**: `application/json`, `application/x-www-form-urlencoded`, `multipart/form-data`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## environmentsCreate

> Environment environmentsCreate(environment)



list: Return a list of all the testFiles.

### Example

```ts
import {
  Configuration,
  AutograderApi,
} from '';
import type { EnvironmentsCreateRequest } from '';

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
    // Configure HTTP bearer authorization: jwtAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AutograderApi(config);

  const body = {
    // Environment
    environment: ...,
  } satisfies EnvironmentsCreateRequest;

  try {
    const data = await api.environmentsCreate(body);
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
| **environment** | [Environment](Environment.md) |  | |

### Return type

[**Environment**](Environment.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

### HTTP request headers

- **Content-Type**: `application/json`, `application/x-www-form-urlencoded`, `multipart/form-data`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **201** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## environmentsDestroy

> environmentsDestroy(id)



list: Return a list of all the testFiles.

### Example

```ts
import {
  Configuration,
  AutograderApi,
} from '';
import type { EnvironmentsDestroyRequest } from '';

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
    // Configure HTTP bearer authorization: jwtAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AutograderApi(config);

  const body = {
    // number | A unique integer value identifying this environment.
    id: 56,
  } satisfies EnvironmentsDestroyRequest;

  try {
    const data = await api.environmentsDestroy(body);
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
| **id** | `number` | A unique integer value identifying this environment. | [Defaults to `undefined`] |

### Return type

`void` (Empty response body)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **204** | No response body |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## environmentsDockerfileRetrieve

> string environmentsDockerfileRetrieve(id)



list: Return a list of all the testFiles.

### Example

```ts
import {
  Configuration,
  AutograderApi,
} from '';
import type { EnvironmentsDockerfileRetrieveRequest } from '';

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
    // Configure HTTP bearer authorization: jwtAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AutograderApi(config);

  const body = {
    // number | A unique integer value identifying this environment.
    id: 56,
  } satisfies EnvironmentsDockerfileRetrieveRequest;

  try {
    const data = await api.environmentsDockerfileRetrieve(body);
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
| **id** | `number` | A unique integer value identifying this environment. | [Defaults to `undefined`] |

### Return type

**string**

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## environmentsEjectRetrieve

> EnvironmentEjectResponse environmentsEjectRetrieve(id)



Generates a \&quot;Reproduction Kit\&quot; for debugging locally. Returns the components needed to run tests exactly as the autograder does.

### Example

```ts
import {
  Configuration,
  AutograderApi,
} from '';
import type { EnvironmentsEjectRetrieveRequest } from '';

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
    // Configure HTTP bearer authorization: jwtAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AutograderApi(config);

  const body = {
    // number | A unique integer value identifying this environment.
    id: 56,
  } satisfies EnvironmentsEjectRetrieveRequest;

  try {
    const data = await api.environmentsEjectRetrieve(body);
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
| **id** | `number` | A unique integer value identifying this environment. | [Defaults to `undefined`] |

### Return type

[**EnvironmentEjectResponse**](EnvironmentEjectResponse.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## environmentsList

> Array&lt;Environment&gt; environmentsList()



list: Return a list of all the testFiles.

### Example

```ts
import {
  Configuration,
  AutograderApi,
} from '';
import type { EnvironmentsListRequest } from '';

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
    // Configure HTTP bearer authorization: jwtAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AutograderApi(config);

  try {
    const data = await api.environmentsList();
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

[**Array&lt;Environment&gt;**](Environment.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## environmentsPartialUpdate

> Environment environmentsPartialUpdate(id, patchedEnvironment)



list: Return a list of all the testFiles.

### Example

```ts
import {
  Configuration,
  AutograderApi,
} from '';
import type { EnvironmentsPartialUpdateRequest } from '';

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
    // Configure HTTP bearer authorization: jwtAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AutograderApi(config);

  const body = {
    // number | A unique integer value identifying this environment.
    id: 56,
    // PatchedEnvironment (optional)
    patchedEnvironment: ...,
  } satisfies EnvironmentsPartialUpdateRequest;

  try {
    const data = await api.environmentsPartialUpdate(body);
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
| **id** | `number` | A unique integer value identifying this environment. | [Defaults to `undefined`] |
| **patchedEnvironment** | [PatchedEnvironment](PatchedEnvironment.md) |  | [Optional] |

### Return type

[**Environment**](Environment.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

### HTTP request headers

- **Content-Type**: `application/json`, `application/x-www-form-urlencoded`, `multipart/form-data`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## environmentsPreviewCreate

> string environmentsPreviewCreate(id, environmentPreviewRequest)



Generate a preview of the Dockerfile based on provided parameters, without saving changes to the database.

### Example

```ts
import {
  Configuration,
  AutograderApi,
} from '';
import type { EnvironmentsPreviewCreateRequest } from '';

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
    // Configure HTTP bearer authorization: jwtAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AutograderApi(config);

  const body = {
    // number | A unique integer value identifying this environment.
    id: 56,
    // EnvironmentPreviewRequest (optional)
    environmentPreviewRequest: ...,
  } satisfies EnvironmentsPreviewCreateRequest;

  try {
    const data = await api.environmentsPreviewCreate(body);
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
| **id** | `number` | A unique integer value identifying this environment. | [Defaults to `undefined`] |
| **environmentPreviewRequest** | [EnvironmentPreviewRequest](EnvironmentPreviewRequest.md) |  | [Optional] |

### Return type

**string**

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

### HTTP request headers

- **Content-Type**: `application/json`, `application/x-www-form-urlencoded`, `multipart/form-data`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |
| **400** | Preview generation failed |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## environmentsRetrieve

> Environment environmentsRetrieve(id)



list: Return a list of all the testFiles.

### Example

```ts
import {
  Configuration,
  AutograderApi,
} from '';
import type { EnvironmentsRetrieveRequest } from '';

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
    // Configure HTTP bearer authorization: jwtAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AutograderApi(config);

  const body = {
    // number | A unique integer value identifying this environment.
    id: 56,
  } satisfies EnvironmentsRetrieveRequest;

  try {
    const data = await api.environmentsRetrieve(body);
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
| **id** | `number` | A unique integer value identifying this environment. | [Defaults to `undefined`] |

### Return type

[**Environment**](Environment.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## environmentsRollbackCreate

> EnvironmentRollbackResponse environmentsRollbackCreate(environmentId, environmentRollbackRequest)



Rollback environment to a previous image version.  POST /autograder/environments/&lt;id&gt;/rollback/ Body: {\&quot;version\&quot;: 2}  (optional, defaults to previous version)

### Example

```ts
import {
  Configuration,
  AutograderApi,
} from '';
import type { EnvironmentsRollbackCreateRequest } from '';

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
    // Configure HTTP bearer authorization: jwtAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AutograderApi(config);

  const body = {
    // number
    environmentId: 56,
    // EnvironmentRollbackRequest (optional)
    environmentRollbackRequest: ...,
  } satisfies EnvironmentsRollbackCreateRequest;

  try {
    const data = await api.environmentsRollbackCreate(body);
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
| **environmentId** | `number` |  | [Defaults to `undefined`] |
| **environmentRollbackRequest** | [EnvironmentRollbackRequest](EnvironmentRollbackRequest.md) |  | [Optional] |

### Return type

[**EnvironmentRollbackResponse**](EnvironmentRollbackResponse.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

### HTTP request headers

- **Content-Type**: `application/json`, `application/x-www-form-urlencoded`, `multipart/form-data`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## environmentsRunAllPartialUpdate

> EnvironmentRunAllResponse environmentsRunAllPartialUpdate(id, patchedEnvironmentRunAllRequest)



list: Return a list of all the testFiles.

### Example

```ts
import {
  Configuration,
  AutograderApi,
} from '';
import type { EnvironmentsRunAllPartialUpdateRequest } from '';

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
    // Configure HTTP bearer authorization: jwtAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AutograderApi(config);

  const body = {
    // number | A unique integer value identifying this environment.
    id: 56,
    // PatchedEnvironmentRunAllRequest (optional)
    patchedEnvironmentRunAllRequest: ...,
  } satisfies EnvironmentsRunAllPartialUpdateRequest;

  try {
    const data = await api.environmentsRunAllPartialUpdate(body);
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
| **id** | `number` | A unique integer value identifying this environment. | [Defaults to `undefined`] |
| **patchedEnvironmentRunAllRequest** | [PatchedEnvironmentRunAllRequest](PatchedEnvironmentRunAllRequest.md) |  | [Optional] |

### Return type

[**EnvironmentRunAllResponse**](EnvironmentRunAllResponse.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

### HTTP request headers

- **Content-Type**: `application/json`, `application/x-www-form-urlencoded`, `multipart/form-data`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## environmentsRunPartialUpdate

> EnvironmentRunResponse environmentsRunPartialUpdate(id, patchedEnvironmentRunRequest)



Run tests for a submission using the modern TestService architecture. Dispatches run_test_task which calls TestService.run_suite().

### Example

```ts
import {
  Configuration,
  AutograderApi,
} from '';
import type { EnvironmentsRunPartialUpdateRequest } from '';

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
    // Configure HTTP bearer authorization: jwtAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AutograderApi(config);

  const body = {
    // number | A unique integer value identifying this environment.
    id: 56,
    // PatchedEnvironmentRunRequest (optional)
    patchedEnvironmentRunRequest: ...,
  } satisfies EnvironmentsRunPartialUpdateRequest;

  try {
    const data = await api.environmentsRunPartialUpdate(body);
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
| **id** | `number` | A unique integer value identifying this environment. | [Defaults to `undefined`] |
| **patchedEnvironmentRunRequest** | [PatchedEnvironmentRunRequest](PatchedEnvironmentRunRequest.md) |  | [Optional] |

### Return type

[**EnvironmentRunResponse**](EnvironmentRunResponse.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

### HTTP request headers

- **Content-Type**: `application/json`, `application/x-www-form-urlencoded`, `multipart/form-data`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |
| **403** | Forbidden |  -  |
| **401** | Not authorized |  -  |
| **400** | Validation error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## environmentsStatusRetrieve

> EnvironmentStatusResponse environmentsStatusRetrieve(environmentId)



Get detailed environment status including version history.  GET /autograder/environments/&lt;id&gt;/status/

### Example

```ts
import {
  Configuration,
  AutograderApi,
} from '';
import type { EnvironmentsStatusRetrieveRequest } from '';

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
    // Configure HTTP bearer authorization: jwtAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AutograderApi(config);

  const body = {
    // number
    environmentId: 56,
  } satisfies EnvironmentsStatusRetrieveRequest;

  try {
    const data = await api.environmentsStatusRetrieve(body);
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
| **environmentId** | `number` |  | [Defaults to `undefined`] |

### Return type

[**EnvironmentStatusResponse**](EnvironmentStatusResponse.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## environmentsUpdate

> Environment environmentsUpdate(id, environment)



list: Return a list of all the testFiles.

### Example

```ts
import {
  Configuration,
  AutograderApi,
} from '';
import type { EnvironmentsUpdateRequest } from '';

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
    // Configure HTTP bearer authorization: jwtAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AutograderApi(config);

  const body = {
    // number | A unique integer value identifying this environment.
    id: 56,
    // Environment
    environment: ...,
  } satisfies EnvironmentsUpdateRequest;

  try {
    const data = await api.environmentsUpdate(body);
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
| **id** | `number` | A unique integer value identifying this environment. | [Defaults to `undefined`] |
| **environment** | [Environment](Environment.md) |  | |

### Return type

[**Environment**](Environment.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

### HTTP request headers

- **Content-Type**: `application/json`, `application/x-www-form-urlencoded`, `multipart/form-data`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## executeCodeCreate

> ExecutionResult executeCodeCreate(codeExecutionRequest)



Execute a code snippet using the autograder executors.  DEPRECATED: Use async endpoints.

### Example

```ts
import {
  Configuration,
  AutograderApi,
} from '';
import type { ExecuteCodeCreateRequest } from '';

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
    // Configure HTTP bearer authorization: jwtAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AutograderApi(config);

  const body = {
    // CodeExecutionRequest
    codeExecutionRequest: ...,
  } satisfies ExecuteCodeCreateRequest;

  try {
    const data = await api.executeCodeCreate(body);
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
| **codeExecutionRequest** | [CodeExecutionRequest](CodeExecutionRequest.md) |  | |

### Return type

[**ExecutionResult**](ExecutionResult.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

### HTTP request headers

- **Content-Type**: `application/json`, `application/x-www-form-urlencoded`, `multipart/form-data`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## executeFileAsyncCreate

> AsyncTaskResponse executeFileAsyncCreate(asyncExecutionRequest)



Async file execution endpoint.  Permissions: - Staff: Can execute freely, including force_execute - Students: Can only retrieve cached results (cache must exist)

### Example

```ts
import {
  Configuration,
  AutograderApi,
} from '';
import type { ExecuteFileAsyncCreateRequest } from '';

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
    // Configure HTTP bearer authorization: jwtAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AutograderApi(config);

  const body = {
    // AsyncExecutionRequest
    asyncExecutionRequest: ...,
  } satisfies ExecuteFileAsyncCreateRequest;

  try {
    const data = await api.executeFileAsyncCreate(body);
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
| **asyncExecutionRequest** | [AsyncExecutionRequest](AsyncExecutionRequest.md) |  | |

### Return type

[**AsyncTaskResponse**](AsyncTaskResponse.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

### HTTP request headers

- **Content-Type**: `application/json`, `application/x-www-form-urlencoded`, `multipart/form-data`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## executeFileCacheCheckRetrieve

> CacheCheckResponse executeFileCacheCheckRetrieve()



Check if cache exists for file

### Example

```ts
import {
  Configuration,
  AutograderApi,
} from '';
import type { ExecuteFileCacheCheckRetrieveRequest } from '';

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
    // Configure HTTP bearer authorization: jwtAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AutograderApi(config);

  try {
    const data = await api.executeFileCacheCheckRetrieve();
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

[**CacheCheckResponse**](CacheCheckResponse.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## executeFileCreate

> ExecutionResult executeFileCreate(fileExecutionRequest)



Execute a codePost file - use stream execution instead. This endpoint is used for testing file execution.  DEPRECATED: Use /autograder/async/execute/file/ instead. This view executes synchronously, blocking the request thread. It should not be used in production for long-running tasks.  Permissions: - Codepost staff only: Superusers can execute any file - Course Staff: Can execute with overrides if allowed by assignment  Uses FilePermissions which delegates to appropriate permission class based on file type (SubmissionFile, AssignmentFile, CourseFile)  POST /autograder/execute/file/ {     \&quot;file_id\&quot;: 123,     \&quot;timeout\&quot;: 30 }

### Example

```ts
import {
  Configuration,
  AutograderApi,
} from '';
import type { ExecuteFileCreateRequest } from '';

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
    // Configure HTTP bearer authorization: jwtAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AutograderApi(config);

  const body = {
    // FileExecutionRequest
    fileExecutionRequest: ...,
  } satisfies ExecuteFileCreateRequest;

  try {
    const data = await api.executeFileCreate(body);
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
| **fileExecutionRequest** | [FileExecutionRequest](FileExecutionRequest.md) |  | |

### Return type

[**ExecutionResult**](ExecutionResult.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

### HTTP request headers

- **Content-Type**: `application/json`, `application/x-www-form-urlencoded`, `multipart/form-data`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## executeFileStreamingCreate

> executeFileStreamingCreate(fileExecutionRequest)



Handle streaming execution request

### Example

```ts
import {
  Configuration,
  AutograderApi,
} from '';
import type { ExecuteFileStreamingCreateRequest } from '';

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
    // Configure HTTP bearer authorization: jwtAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AutograderApi(config);

  const body = {
    // FileExecutionRequest
    fileExecutionRequest: ...,
  } satisfies ExecuteFileStreamingCreateRequest;

  try {
    const data = await api.executeFileStreamingCreate(body);
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
| **fileExecutionRequest** | [FileExecutionRequest](FileExecutionRequest.md) |  | |

### Return type

`void` (Empty response body)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

### HTTP request headers

- **Content-Type**: `application/json`, `application/x-www-form-urlencoded`, `multipart/form-data`
- **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Server-Sent Events stream with ExecutionResult data |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## executeNotebookCellCreate

> ExecutionResult executeNotebookCellCreate(notebookCellExecutionRequest)



Execute a single notebook cell by wrapping it in a minimal notebook.

### Example

```ts
import {
  Configuration,
  AutograderApi,
} from '';
import type { ExecuteNotebookCellCreateRequest } from '';

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
    // Configure HTTP bearer authorization: jwtAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AutograderApi(config);

  const body = {
    // NotebookCellExecutionRequest
    notebookCellExecutionRequest: ...,
  } satisfies ExecuteNotebookCellCreateRequest;

  try {
    const data = await api.executeNotebookCellCreate(body);
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
| **notebookCellExecutionRequest** | [NotebookCellExecutionRequest](NotebookCellExecutionRequest.md) |  | |

### Return type

[**ExecutionResult**](ExecutionResult.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

### HTTP request headers

- **Content-Type**: `application/json`, `application/x-www-form-urlencoded`, `multipart/form-data`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## executeNotebookCreate

> ExecutionResult executeNotebookCreate(notebookExecutionRequest)



Execute a full notebook payload.  DEPRECATED: Use async endpoints.

### Example

```ts
import {
  Configuration,
  AutograderApi,
} from '';
import type { ExecuteNotebookCreateRequest } from '';

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
    // Configure HTTP bearer authorization: jwtAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AutograderApi(config);

  const body = {
    // NotebookExecutionRequest
    notebookExecutionRequest: ...,
  } satisfies ExecuteNotebookCreateRequest;

  try {
    const data = await api.executeNotebookCreate(body);
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
| **notebookExecutionRequest** | [NotebookExecutionRequest](NotebookExecutionRequest.md) |  | |

### Return type

[**ExecutionResult**](ExecutionResult.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

### HTTP request headers

- **Content-Type**: `application/json`, `application/x-www-form-urlencoded`, `multipart/form-data`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## shellMetricsRetrieve

> ShellMetricsResponse shellMetricsRetrieve()



Staff-only shell relay metrics from Redis. GET /autograder/shell/metrics/

### Example

```ts
import {
  Configuration,
  AutograderApi,
} from '';
import type { ShellMetricsRetrieveRequest } from '';

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
    // Configure HTTP bearer authorization: jwtAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AutograderApi(config);

  try {
    const data = await api.shellMetricsRetrieve();
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

[**ShellMetricsResponse**](ShellMetricsResponse.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## tasksRetrieve

> TaskStatusResponse tasksRetrieve(id)



A simple ViewSet for retrieving task results

### Example

```ts
import {
  Configuration,
  AutograderApi,
} from '';
import type { TasksRetrieveRequest } from '';

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
    // Configure HTTP bearer authorization: jwtAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AutograderApi(config);

  const body = {
    // string
    id: id_example,
  } satisfies TasksRetrieveRequest;

  try {
    const data = await api.tasksRetrieve(body);
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
| **id** | `string` |  | [Defaults to `undefined`] |

### Return type

[**TaskStatusResponse**](TaskStatusResponse.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## v2RunCreate

> TestExecutionResult v2RunCreate(testExecutionRequest)



API access to the Modern Testing Architecture. Runs a specific TestCase against a Submission.

### Example

```ts
import {
  Configuration,
  AutograderApi,
} from '';
import type { V2RunCreateRequest } from '';

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
    // Configure HTTP bearer authorization: jwtAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AutograderApi(config);

  const body = {
    // TestExecutionRequest
    testExecutionRequest: ...,
  } satisfies V2RunCreateRequest;

  try {
    const data = await api.v2RunCreate(body);
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
| **testExecutionRequest** | [TestExecutionRequest](TestExecutionRequest.md) |  | |

### Return type

[**TestExecutionResult**](TestExecutionResult.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

### HTTP request headers

- **Content-Type**: `application/json`, `application/x-www-form-urlencoded`, `multipart/form-data`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

