# OrganizationsApi

All URIs are relative to _http://localhost_

| Method                                                                     | HTTP request                                      | Description |
| -------------------------------------------------------------------------- | ------------------------------------------------- | ----------- |
| [**aiModelsRetrieve**](OrganizationsApi.md#aimodelsretrieve)               | **GET** /organizations/{id}/aiModels/             |             |
| [**aiSettingsPartialUpdate**](OrganizationsApi.md#aisettingspartialupdate) | **PATCH** /organizations/{id}/aiSettings/         |             |
| [**aiSettingsRetrieve**](OrganizationsApi.md#aisettingsretrieve)           | **GET** /organizations/{id}/aiSettings/           |             |
| [**aiUsageRetrieve**](OrganizationsApi.md#aiusageretrieve)                 | **GET** /organizations/{id}/aiUsage/              |             |
| [**analyticsRetrieve**](OrganizationsApi.md#analyticsretrieve)             | **GET** /organizations/{id}/analytics/            |             |
| [**approveAdminCreate**](OrganizationsApi.md#approveadmincreate)           | **POST** /organizations/{id}/approve_admin/       |             |
| [**create**](OrganizationsApi.md#create)                                   | **POST** /organizations/                          |             |
| [**demoteStaffCreate**](OrganizationsApi.md#demotestaffcreate)             | **POST** /organizations/{id}/demote_staff/        |             |
| [**denyAdminCreate**](OrganizationsApi.md#denyadmincreate)                 | **POST** /organizations/{id}/deny_admin/          |             |
| [**destroy**](OrganizationsApi.md#destroy)                                 | **DELETE** /organizations/{id}/                   |             |
| [**list**](OrganizationsApi.md#list)                                       | **GET** /organizations/                           |             |
| [**partialUpdate**](OrganizationsApi.md#partialupdate)                     | **PATCH** /organizations/{id}/                    |             |
| [**pendingAdminsRetrieve**](OrganizationsApi.md#pendingadminsretrieve)     | **GET** /organizations/{id}/pending_admins/       |             |
| [**promoteStaffCreate**](OrganizationsApi.md#promotestaffcreate)           | **POST** /organizations/{id}/promote_staff/       |             |
| [**removeUserCreate**](OrganizationsApi.md#removeusercreate)               | **POST** /organizations/{id}/remove_user/         |             |
| [**resetUserPasswordCreate**](OrganizationsApi.md#resetuserpasswordcreate) | **POST** /organizations/{id}/reset_user_password/ |             |
| [**retrieve**](OrganizationsApi.md#retrieve)                               | **GET** /organizations/{id}/                      |             |
| [**update**](OrganizationsApi.md#update)                                   | **PUT** /organizations/{id}/                      |             |
| [**usersRetrieve**](OrganizationsApi.md#usersretrieve)                     | **GET** /organizations/{id}/users/                |             |
| [**verifyUserCreate**](OrganizationsApi.md#verifyusercreate)               | **POST** /organizations/{id}/verify_user/         |             |

## aiModelsRetrieve

> AIProviderModelsList aiModelsRetrieve(id)

GET: Return curated AI models for the org\&#39;s configured provider. Also queries the provider\&#39;s API for live model listings using the org\&#39;s stored credentials. Only accessible by Org Staff or superuser.

### Example

```ts
import { Configuration, OrganizationsApi } from '';
import type { AiModelsRetrieveRequest } from '';

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
  const api = new OrganizationsApi(config);

  const body = {
    // number | A unique integer value identifying this organization.
    id: 56,
  } satisfies AiModelsRetrieveRequest;

  try {
    const data = await api.aiModelsRetrieve(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name   | Type     | Description                                           | Notes                     |
| ------ | -------- | ----------------------------------------------------- | ------------------------- |
| **id** | `number` | A unique integer value identifying this organization. | [Defaults to `undefined`] |

### Return type

[**AIProviderModelsList**](AIProviderModelsList.md)

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

## aiSettingsPartialUpdate

> OrganizationAISettings aiSettingsPartialUpdate(id, patchedOrganizationAISettingsUpdate)

GET: Return the organization\&#39;s AI configuration. PATCH: Update the organization\&#39;s AI configuration. Only accessible by Org Staff or superuser.

### Example

```ts
import {
  Configuration,
  OrganizationsApi,
} from '';
import type { AiSettingsPartialUpdateRequest } from '';

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
  const api = new OrganizationsApi(config);

  const body = {
    // number | A unique integer value identifying this organization.
    id: 56,
    // PatchedOrganizationAISettingsUpdate (optional)
    patchedOrganizationAISettingsUpdate: ...,
  } satisfies AiSettingsPartialUpdateRequest;

  try {
    const data = await api.aiSettingsPartialUpdate(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                                    | Type                                                                          | Description                                           | Notes                     |
| --------------------------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------- | ------------------------- |
| **id**                                  | `number`                                                                      | A unique integer value identifying this organization. | [Defaults to `undefined`] |
| **patchedOrganizationAISettingsUpdate** | [PatchedOrganizationAISettingsUpdate](PatchedOrganizationAISettingsUpdate.md) |                                                       | [Optional]                |

### Return type

[**OrganizationAISettings**](OrganizationAISettings.md)

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

## aiSettingsRetrieve

> OrganizationAISettings aiSettingsRetrieve(id)

GET: Return the organization\&#39;s AI configuration. PATCH: Update the organization\&#39;s AI configuration. Only accessible by Org Staff or superuser.

### Example

```ts
import { Configuration, OrganizationsApi } from '';
import type { AiSettingsRetrieveRequest } from '';

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
  const api = new OrganizationsApi(config);

  const body = {
    // number | A unique integer value identifying this organization.
    id: 56,
  } satisfies AiSettingsRetrieveRequest;

  try {
    const data = await api.aiSettingsRetrieve(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name   | Type     | Description                                           | Notes                     |
| ------ | -------- | ----------------------------------------------------- | ------------------------- |
| **id** | `number` | A unique integer value identifying this organization. | [Defaults to `undefined`] |

### Return type

[**OrganizationAISettings**](OrganizationAISettings.md)

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

## aiUsageRetrieve

> AIUsageSummary aiUsageRetrieve(id, endDate, granularity, startDate)

Returns AI usage analytics for the organization. Includes time-series data and per-course breakdown. Only accessible by Org Staff or superuser.

### Example

```ts
import { Configuration, OrganizationsApi } from '';
import type { AiUsageRetrieveRequest } from '';

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
  const api = new OrganizationsApi(config);

  const body = {
    // number | A unique integer value identifying this organization.
    id: 56,
    // string | End date (ISO 8601) (optional)
    endDate: endDate_example,
    // 'daily' | 'hourly' | 'monthly' | Time bucket granularity: \'hourly\', \'daily\', or \'monthly\' (optional)
    granularity: granularity_example,
    // string | Start date (ISO 8601) (optional)
    startDate: startDate_example,
  } satisfies AiUsageRetrieveRequest;

  try {
    const data = await api.aiUsageRetrieve(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name            | Type                         | Description                                                                            | Notes                                                               |
| --------------- | ---------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| **id**          | `number`                     | A unique integer value identifying this organization.                                  | [Defaults to `undefined`]                                           |
| **endDate**     | `string`                     | End date (ISO 8601)                                                                    | [Optional] [Defaults to `undefined`]                                |
| **granularity** | `daily`, `hourly`, `monthly` | Time bucket granularity: \&#39;hourly\&#39;, \&#39;daily\&#39;, or \&#39;monthly\&#39; | [Optional] [Defaults to `undefined`] [Enum: daily, hourly, monthly] |
| **startDate**   | `string`                     | Start date (ISO 8601)                                                                  | [Optional] [Defaults to `undefined`]                                |

### Return type

[**AIUsageSummary**](AIUsageSummary.md)

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

## analyticsRetrieve

> Organization analyticsRetrieve(id)

Returns analytics for the organization.

### Example

```ts
import { Configuration, OrganizationsApi } from '';
import type { AnalyticsRetrieveRequest } from '';

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
  const api = new OrganizationsApi(config);

  const body = {
    // number | A unique integer value identifying this organization.
    id: 56,
  } satisfies AnalyticsRetrieveRequest;

  try {
    const data = await api.analyticsRetrieve(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name   | Type     | Description                                           | Notes                     |
| ------ | -------- | ----------------------------------------------------- | ------------------------- |
| **id** | `number` | A unique integer value identifying this organization. | [Defaults to `undefined`] |

### Return type

[**Organization**](Organization.md)

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

## approveAdminCreate

> Organization approveAdminCreate(id, organization)

Approve a pending admin request. Grants canCreateCourses&#x3D;True. Payload: { \&#39;user_email\&#39;: \&#39;...\&#39; }

### Example

```ts
import {
  Configuration,
  OrganizationsApi,
} from '';
import type { ApproveAdminCreateRequest } from '';

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
  const api = new OrganizationsApi(config);

  const body = {
    // number | A unique integer value identifying this organization.
    id: 56,
    // Organization
    organization: ...,
  } satisfies ApproveAdminCreateRequest;

  try {
    const data = await api.approveAdminCreate(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name             | Type                            | Description                                           | Notes                     |
| ---------------- | ------------------------------- | ----------------------------------------------------- | ------------------------- |
| **id**           | `number`                        | A unique integer value identifying this organization. | [Defaults to `undefined`] |
| **organization** | [Organization](Organization.md) |                                                       |                           |

### Return type

[**Organization**](Organization.md)

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

## create

> Organization create(organization)

list: Return a list of all the organizations. create: Create a new organization. retrieve: Return the given organization. update: Update an organization. partial_update: Update an organization. delete: Delete an organization

### Example

```ts
import {
  Configuration,
  OrganizationsApi,
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
  const api = new OrganizationsApi(config);

  const body = {
    // Organization
    organization: ...,
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

| Name             | Type                            | Description | Notes |
| ---------------- | ------------------------------- | ----------- | ----- |
| **organization** | [Organization](Organization.md) |             |       |

### Return type

[**Organization**](Organization.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [courseKeyAuth](../README.md#courseKeyAuth)

### HTTP request headers

- **Content-Type**: `application/json`, `application/x-www-form-urlencoded`, `multipart/form-data`
- **Accept**: `application/json`

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **201**     |             | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## demoteStaffCreate

> Organization demoteStaffCreate(id, organization)

Demote a user from Organization Staff. Payload: { \&#39;user_email\&#39;: \&#39;...\&#39; }

### Example

```ts
import {
  Configuration,
  OrganizationsApi,
} from '';
import type { DemoteStaffCreateRequest } from '';

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
  const api = new OrganizationsApi(config);

  const body = {
    // number | A unique integer value identifying this organization.
    id: 56,
    // Organization
    organization: ...,
  } satisfies DemoteStaffCreateRequest;

  try {
    const data = await api.demoteStaffCreate(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name             | Type                            | Description                                           | Notes                     |
| ---------------- | ------------------------------- | ----------------------------------------------------- | ------------------------- |
| **id**           | `number`                        | A unique integer value identifying this organization. | [Defaults to `undefined`] |
| **organization** | [Organization](Organization.md) |                                                       |                           |

### Return type

[**Organization**](Organization.md)

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

## denyAdminCreate

> Organization denyAdminCreate(id, organization)

Deny a pending admin request. Payload: { \&#39;user_email\&#39;: \&#39;...\&#39; }

### Example

```ts
import {
  Configuration,
  OrganizationsApi,
} from '';
import type { DenyAdminCreateRequest } from '';

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
  const api = new OrganizationsApi(config);

  const body = {
    // number | A unique integer value identifying this organization.
    id: 56,
    // Organization
    organization: ...,
  } satisfies DenyAdminCreateRequest;

  try {
    const data = await api.denyAdminCreate(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name             | Type                            | Description                                           | Notes                     |
| ---------------- | ------------------------------- | ----------------------------------------------------- | ------------------------- |
| **id**           | `number`                        | A unique integer value identifying this organization. | [Defaults to `undefined`] |
| **organization** | [Organization](Organization.md) |                                                       |                           |

### Return type

[**Organization**](Organization.md)

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

## destroy

> destroy(id)

list: Return a list of all the organizations. create: Create a new organization. retrieve: Return the given organization. update: Update an organization. partial_update: Update an organization. delete: Delete an organization

### Example

```ts
import { Configuration, OrganizationsApi } from '';
import type { DestroyRequest } from '';

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
  const api = new OrganizationsApi(config);

  const body = {
    // number | A unique integer value identifying this organization.
    id: 56,
  } satisfies DestroyRequest;

  try {
    const data = await api.destroy(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name   | Type     | Description                                           | Notes                     |
| ------ | -------- | ----------------------------------------------------- | ------------------------- |
| **id** | `number` | A unique integer value identifying this organization. | [Defaults to `undefined`] |

### Return type

`void` (Empty response body)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [courseKeyAuth](../README.md#courseKeyAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: Not defined

### HTTP response details

| Status code | Description      | Response headers |
| ----------- | ---------------- | ---------------- |
| **204**     | No response body | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## list

> Array&lt;Organization&gt; list()

list: Return a list of all the organizations. create: Create a new organization. retrieve: Return the given organization. update: Update an organization. partial_update: Update an organization. delete: Delete an organization

### Example

```ts
import { Configuration, OrganizationsApi } from '';
import type { ListRequest } from '';

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
  const api = new OrganizationsApi(config);

  try {
    const data = await api.list();
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

[**Array&lt;Organization&gt;**](Organization.md)

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

## partialUpdate

> Organization partialUpdate(id, patchedOrganization)

list: Return a list of all the organizations. create: Create a new organization. retrieve: Return the given organization. update: Update an organization. partial_update: Update an organization. delete: Delete an organization

### Example

```ts
import {
  Configuration,
  OrganizationsApi,
} from '';
import type { PartialUpdateRequest } from '';

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
  const api = new OrganizationsApi(config);

  const body = {
    // number | A unique integer value identifying this organization.
    id: 56,
    // PatchedOrganization (optional)
    patchedOrganization: ...,
  } satisfies PartialUpdateRequest;

  try {
    const data = await api.partialUpdate(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                    | Type                                          | Description                                           | Notes                     |
| ----------------------- | --------------------------------------------- | ----------------------------------------------------- | ------------------------- |
| **id**                  | `number`                                      | A unique integer value identifying this organization. | [Defaults to `undefined`] |
| **patchedOrganization** | [PatchedOrganization](PatchedOrganization.md) |                                                       | [Optional]                |

### Return type

[**Organization**](Organization.md)

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

## pendingAdminsRetrieve

> Organization pendingAdminsRetrieve(id)

Returns a list of users with pendingValidation&#x3D;True in this organization. Only accessible by Org Staff or superuser.

### Example

```ts
import { Configuration, OrganizationsApi } from '';
import type { PendingAdminsRetrieveRequest } from '';

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
  const api = new OrganizationsApi(config);

  const body = {
    // number | A unique integer value identifying this organization.
    id: 56,
  } satisfies PendingAdminsRetrieveRequest;

  try {
    const data = await api.pendingAdminsRetrieve(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name   | Type     | Description                                           | Notes                     |
| ------ | -------- | ----------------------------------------------------- | ------------------------- |
| **id** | `number` | A unique integer value identifying this organization. | [Defaults to `undefined`] |

### Return type

[**Organization**](Organization.md)

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

## promoteStaffCreate

> Organization promoteStaffCreate(id, organization)

Promote a user to Organization Staff. Payload: { \&#39;user_email\&#39;: \&#39;...\&#39; }

### Example

```ts
import {
  Configuration,
  OrganizationsApi,
} from '';
import type { PromoteStaffCreateRequest } from '';

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
  const api = new OrganizationsApi(config);

  const body = {
    // number | A unique integer value identifying this organization.
    id: 56,
    // Organization
    organization: ...,
  } satisfies PromoteStaffCreateRequest;

  try {
    const data = await api.promoteStaffCreate(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name             | Type                            | Description                                           | Notes                     |
| ---------------- | ------------------------------- | ----------------------------------------------------- | ------------------------- |
| **id**           | `number`                        | A unique integer value identifying this organization. | [Defaults to `undefined`] |
| **organization** | [Organization](Organization.md) |                                                       |                           |

### Return type

[**Organization**](Organization.md)

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

## removeUserCreate

> Organization removeUserCreate(id, organization)

Remove a user from the organization. Payload: { \&#39;user_email\&#39;: \&#39;...\&#39; }

### Example

```ts
import {
  Configuration,
  OrganizationsApi,
} from '';
import type { RemoveUserCreateRequest } from '';

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
  const api = new OrganizationsApi(config);

  const body = {
    // number | A unique integer value identifying this organization.
    id: 56,
    // Organization
    organization: ...,
  } satisfies RemoveUserCreateRequest;

  try {
    const data = await api.removeUserCreate(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name             | Type                            | Description                                           | Notes                     |
| ---------------- | ------------------------------- | ----------------------------------------------------- | ------------------------- |
| **id**           | `number`                        | A unique integer value identifying this organization. | [Defaults to `undefined`] |
| **organization** | [Organization](Organization.md) |                                                       |                           |

### Return type

[**Organization**](Organization.md)

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

## resetUserPasswordCreate

> Organization resetUserPasswordCreate(id, organization)

Send password reset email to a user. Payload: { \&#39;user_email\&#39;: \&#39;...\&#39; }

### Example

```ts
import {
  Configuration,
  OrganizationsApi,
} from '';
import type { ResetUserPasswordCreateRequest } from '';

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
  const api = new OrganizationsApi(config);

  const body = {
    // number | A unique integer value identifying this organization.
    id: 56,
    // Organization
    organization: ...,
  } satisfies ResetUserPasswordCreateRequest;

  try {
    const data = await api.resetUserPasswordCreate(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name             | Type                            | Description                                           | Notes                     |
| ---------------- | ------------------------------- | ----------------------------------------------------- | ------------------------- |
| **id**           | `number`                        | A unique integer value identifying this organization. | [Defaults to `undefined`] |
| **organization** | [Organization](Organization.md) |                                                       |                           |

### Return type

[**Organization**](Organization.md)

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

## retrieve

> Organization retrieve(id)

list: Return a list of all the organizations. create: Create a new organization. retrieve: Return the given organization. update: Update an organization. partial_update: Update an organization. delete: Delete an organization

### Example

```ts
import { Configuration, OrganizationsApi } from '';
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
    // To configure API key authorization: courseKeyAuth
    apiKey: 'YOUR API KEY',
  });
  const api = new OrganizationsApi(config);

  const body = {
    // number | A unique integer value identifying this organization.
    id: 56,
  } satisfies RetrieveRequest;

  try {
    const data = await api.retrieve(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name   | Type     | Description                                           | Notes                     |
| ------ | -------- | ----------------------------------------------------- | ------------------------- |
| **id** | `number` | A unique integer value identifying this organization. | [Defaults to `undefined`] |

### Return type

[**Organization**](Organization.md)

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

## update

> Organization update(id, organization)

list: Return a list of all the organizations. create: Create a new organization. retrieve: Return the given organization. update: Update an organization. partial_update: Update an organization. delete: Delete an organization

### Example

```ts
import {
  Configuration,
  OrganizationsApi,
} from '';
import type { UpdateRequest } from '';

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
  const api = new OrganizationsApi(config);

  const body = {
    // number | A unique integer value identifying this organization.
    id: 56,
    // Organization
    organization: ...,
  } satisfies UpdateRequest;

  try {
    const data = await api.update(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name             | Type                            | Description                                           | Notes                     |
| ---------------- | ------------------------------- | ----------------------------------------------------- | ------------------------- |
| **id**           | `number`                        | A unique integer value identifying this organization. | [Defaults to `undefined`] |
| **organization** | [Organization](Organization.md) |                                                       |                           |

### Return type

[**Organization**](Organization.md)

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

## usersRetrieve

> Organization usersRetrieve(id)

Returns a list of all users in the organization. Only accessible by Org Staff.

### Example

```ts
import { Configuration, OrganizationsApi } from '';
import type { UsersRetrieveRequest } from '';

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
  const api = new OrganizationsApi(config);

  const body = {
    // number | A unique integer value identifying this organization.
    id: 56,
  } satisfies UsersRetrieveRequest;

  try {
    const data = await api.usersRetrieve(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name   | Type     | Description                                           | Notes                     |
| ------ | -------- | ----------------------------------------------------- | ------------------------- |
| **id** | `number` | A unique integer value identifying this organization. | [Defaults to `undefined`] |

### Return type

[**Organization**](Organization.md)

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

## verifyUserCreate

> Organization verifyUserCreate(id, organization)

Approve or Decline a pending user. Payload: { \&#39;user_email\&#39;: \&#39;...\&#39;, \&#39;action\&#39;: \&#39;approve\&#39; | \&#39;decline\&#39; }

### Example

```ts
import {
  Configuration,
  OrganizationsApi,
} from '';
import type { VerifyUserCreateRequest } from '';

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
  const api = new OrganizationsApi(config);

  const body = {
    // number | A unique integer value identifying this organization.
    id: 56,
    // Organization
    organization: ...,
  } satisfies VerifyUserCreateRequest;

  try {
    const data = await api.verifyUserCreate(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name             | Type                            | Description                                           | Notes                     |
| ---------------- | ------------------------------- | ----------------------------------------------------- | ------------------------- |
| **id**           | `number`                        | A unique integer value identifying this organization. | [Defaults to `undefined`] |
| **organization** | [Organization](Organization.md) |                                                       |                           |

### Return type

[**Organization**](Organization.md)

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
