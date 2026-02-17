# CoursesApi

All URIs are relative to _http://localhost_

| Method                                                                                   | HTTP request                                  | Description |
| ---------------------------------------------------------------------------------------- | --------------------------------------------- | ----------- |
| [**addToRosterPartialUpdate**](CoursesApi.md#addtorosterpartialupdate)                   | **PATCH** /courses/{id}/addToRoster/          |             |
| [**aiSettingsPartialUpdate**](CoursesApi.md#aisettingspartialupdate)                     | **PATCH** /courses/{id}/aiSettings/           |             |
| [**aiSettingsRetrieve**](CoursesApi.md#aisettingsretrieve)                               | **GET** /courses/{id}/aiSettings/             |             |
| [**changeInviteCodePartialUpdate**](CoursesApi.md#changeinvitecodepartialupdate)         | **PATCH** /courses/{id}/changeInviteCode/     |             |
| [**courseSettingsPartialUpdate**](CoursesApi.md#coursesettingspartialupdate)             | **PATCH** /courses/{id}/courseSettings/       |             |
| [**courseSettingsRetrieve**](CoursesApi.md#coursesettingsretrieve)                       | **GET** /courses/{id}/courseSettings/         |             |
| [**create**](CoursesApi.md#create)                                                       | **POST** /courses/                            |             |
| [**deleteRubricCategoryPartialUpdate**](CoursesApi.md#deleterubriccategorypartialupdate) | **PATCH** /courses/{id}/deleteRubricCategory/ |             |
| [**destroy**](CoursesApi.md#destroy)                                                     | **DELETE** /courses/{id}/                     |             |
| [**list**](CoursesApi.md#list)                                                           | **GET** /courses/                             |             |
| [**partialUpdate**](CoursesApi.md#partialupdate)                                         | **PATCH** /courses/{id}/                      |             |
| [**removeFromRosterPartialUpdate**](CoursesApi.md#removefromrosterpartialupdate)         | **PATCH** /courses/{id}/removeFromRoster/     |             |
| [**retrieve**](CoursesApi.md#retrieve)                                                   | **GET** /courses/{id}/                        |             |
| [**rosterMapPartialUpdate**](CoursesApi.md#rostermappartialupdate)                       | **PATCH** /courses/{id}/rosterMap/            |             |
| [**rosterMapRetrieve**](CoursesApi.md#rostermapretrieve)                                 | **GET** /courses/{id}/rosterMap/              |             |
| [**rosterPartialUpdate**](CoursesApi.md#rosterpartialupdate)                             | **PATCH** /courses/{id}/roster/               |             |
| [**rosterRetrieve**](CoursesApi.md#rosterretrieve)                                       | **GET** /courses/{id}/roster/                 |             |
| [**sectionsList**](CoursesApi.md#sectionslist)                                           | **GET** /courses/{id}/sections/               |             |
| [**studentCaptionsPartialUpdate**](CoursesApi.md#studentcaptionspartialupdate)           | **PATCH** /courses/{id}/studentCaptions/      |             |
| [**studentCaptionsRetrieve**](CoursesApi.md#studentcaptionsretrieve)                     | **GET** /courses/{id}/studentCaptions/        |             |
| [**update**](CoursesApi.md#update)                                                       | **PUT** /courses/{id}/                        |             |

## addToRosterPartialUpdate

> CourseRoster addToRosterPartialUpdate(id, patchedCourse)

get: Show the roster for a course. patch: Update the roster for a course.

### Example

```ts
import {
  Configuration,
  CoursesApi,
} from '';
import type { AddToRosterPartialUpdateRequest } from '';

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
  const api = new CoursesApi(config);

  const body = {
    // number | A unique integer value identifying this course.
    id: 56,
    // PatchedCourse (optional)
    patchedCourse: ...,
  } satisfies AddToRosterPartialUpdateRequest;

  try {
    const data = await api.addToRosterPartialUpdate(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name              | Type                              | Description                                     | Notes                     |
| ----------------- | --------------------------------- | ----------------------------------------------- | ------------------------- |
| **id**            | `number`                          | A unique integer value identifying this course. | [Defaults to `undefined`] |
| **patchedCourse** | [PatchedCourse](PatchedCourse.md) |                                                 | [Optional]                |

### Return type

[**CourseRoster**](CourseRoster.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

### HTTP request headers

- **Content-Type**: `application/json`, `application/x-www-form-urlencoded`, `multipart/form-data`
- **Accept**: `application/json`

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **200**     |             | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## aiSettingsPartialUpdate

> CourseAISettings aiSettingsPartialUpdate(id, patchedCourse)

get: Get AI configuration for the course. patch: Update AI configuration for the course. Admin-only.

### Example

```ts
import {
  Configuration,
  CoursesApi,
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
    // Configure HTTP bearer authorization: jwtAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new CoursesApi(config);

  const body = {
    // number | A unique integer value identifying this course.
    id: 56,
    // PatchedCourse (optional)
    patchedCourse: ...,
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

| Name              | Type                              | Description                                     | Notes                     |
| ----------------- | --------------------------------- | ----------------------------------------------- | ------------------------- |
| **id**            | `number`                          | A unique integer value identifying this course. | [Defaults to `undefined`] |
| **patchedCourse** | [PatchedCourse](PatchedCourse.md) |                                                 | [Optional]                |

### Return type

[**CourseAISettings**](CourseAISettings.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

### HTTP request headers

- **Content-Type**: `application/json`, `application/x-www-form-urlencoded`, `multipart/form-data`
- **Accept**: `application/json`

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **200**     |             | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## aiSettingsRetrieve

> CourseAISettings aiSettingsRetrieve(id)

get: Get AI configuration for the course. patch: Update AI configuration for the course. Admin-only.

### Example

```ts
import { Configuration, CoursesApi } from '';
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
    // Configure HTTP bearer authorization: jwtAuth
    accessToken: 'YOUR BEARER TOKEN',
  });
  const api = new CoursesApi(config);

  const body = {
    // number | A unique integer value identifying this course.
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

| Name   | Type     | Description                                     | Notes                     |
| ------ | -------- | ----------------------------------------------- | ------------------------- |
| **id** | `number` | A unique integer value identifying this course. | [Defaults to `undefined`] |

### Return type

[**CourseAISettings**](CourseAISettings.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **200**     |             | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## changeInviteCodePartialUpdate

> string changeInviteCodePartialUpdate(id, patchedCourse)

list: Return a list of all the courses. create: Create a new course. retrieve: Return the given course. update: Update a course. partial_update: Update a course. delete: Delete a course

### Example

```ts
import {
  Configuration,
  CoursesApi,
} from '';
import type { ChangeInviteCodePartialUpdateRequest } from '';

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
  const api = new CoursesApi(config);

  const body = {
    // number | A unique integer value identifying this course.
    id: 56,
    // PatchedCourse (optional)
    patchedCourse: ...,
  } satisfies ChangeInviteCodePartialUpdateRequest;

  try {
    const data = await api.changeInviteCodePartialUpdate(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name              | Type                              | Description                                     | Notes                     |
| ----------------- | --------------------------------- | ----------------------------------------------- | ------------------------- |
| **id**            | `number`                          | A unique integer value identifying this course. | [Defaults to `undefined`] |
| **patchedCourse** | [PatchedCourse](PatchedCourse.md) |                                                 | [Optional]                |

### Return type

**string**

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

### HTTP request headers

- **Content-Type**: `application/json`, `application/x-www-form-urlencoded`, `multipart/form-data`
- **Accept**: `application/json`

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **200**     |             | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## courseSettingsPartialUpdate

> CourseSettings courseSettingsPartialUpdate(id, patchedCourse)

list: Return a list of all the courses. create: Create a new course. retrieve: Return the given course. update: Update a course. partial_update: Update a course. delete: Delete a course

### Example

```ts
import {
  Configuration,
  CoursesApi,
} from '';
import type { CourseSettingsPartialUpdateRequest } from '';

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
  const api = new CoursesApi(config);

  const body = {
    // number | A unique integer value identifying this course.
    id: 56,
    // PatchedCourse (optional)
    patchedCourse: ...,
  } satisfies CourseSettingsPartialUpdateRequest;

  try {
    const data = await api.courseSettingsPartialUpdate(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name              | Type                              | Description                                     | Notes                     |
| ----------------- | --------------------------------- | ----------------------------------------------- | ------------------------- |
| **id**            | `number`                          | A unique integer value identifying this course. | [Defaults to `undefined`] |
| **patchedCourse** | [PatchedCourse](PatchedCourse.md) |                                                 | [Optional]                |

### Return type

[**CourseSettings**](CourseSettings.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

### HTTP request headers

- **Content-Type**: `application/json`, `application/x-www-form-urlencoded`, `multipart/form-data`
- **Accept**: `application/json`

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **200**     |             | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## courseSettingsRetrieve

> CourseSettings courseSettingsRetrieve(id)

list: Return a list of all the courses. create: Create a new course. retrieve: Return the given course. update: Update a course. partial_update: Update a course. delete: Delete a course

### Example

```ts
import { Configuration, CoursesApi } from '';
import type { CourseSettingsRetrieveRequest } from '';

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
    // Configure HTTP bearer authorization: jwtAuth
    accessToken: 'YOUR BEARER TOKEN',
  });
  const api = new CoursesApi(config);

  const body = {
    // number | A unique integer value identifying this course.
    id: 56,
  } satisfies CourseSettingsRetrieveRequest;

  try {
    const data = await api.courseSettingsRetrieve(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name   | Type     | Description                                     | Notes                     |
| ------ | -------- | ----------------------------------------------- | ------------------------- |
| **id** | `number` | A unique integer value identifying this course. | [Defaults to `undefined`] |

### Return type

[**CourseSettings**](CourseSettings.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **200**     |             | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## create

> Course create(course)

list: Return a list of all the courses. create: Create a new course. retrieve: Return the given course. update: Update a course. partial_update: Update a course. delete: Delete a course

### Example

```ts
import {
  Configuration,
  CoursesApi,
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
    // Configure HTTP bearer authorization: jwtAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new CoursesApi(config);

  const body = {
    // Course
    course: ...,
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

| Name       | Type                | Description | Notes |
| ---------- | ------------------- | ----------- | ----- |
| **course** | [Course](Course.md) |             |       |

### Return type

[**Course**](Course.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

### HTTP request headers

- **Content-Type**: `application/json`, `application/x-www-form-urlencoded`, `multipart/form-data`
- **Accept**: `application/json`

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **201**     |             | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## deleteRubricCategoryPartialUpdate

> deleteRubricCategoryPartialUpdate(id, patchedCourse)

list: Return a list of all the courses. create: Create a new course. retrieve: Return the given course. update: Update a course. partial_update: Update a course. delete: Delete a course

### Example

```ts
import {
  Configuration,
  CoursesApi,
} from '';
import type { DeleteRubricCategoryPartialUpdateRequest } from '';

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
  const api = new CoursesApi(config);

  const body = {
    // number | A unique integer value identifying this course.
    id: 56,
    // PatchedCourse (optional)
    patchedCourse: ...,
  } satisfies DeleteRubricCategoryPartialUpdateRequest;

  try {
    const data = await api.deleteRubricCategoryPartialUpdate(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name              | Type                              | Description                                     | Notes                     |
| ----------------- | --------------------------------- | ----------------------------------------------- | ------------------------- |
| **id**            | `number`                          | A unique integer value identifying this course. | [Defaults to `undefined`] |
| **patchedCourse** | [PatchedCourse](PatchedCourse.md) |                                                 | [Optional]                |

### Return type

`void` (Empty response body)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

### HTTP request headers

- **Content-Type**: `application/json`, `application/x-www-form-urlencoded`, `multipart/form-data`
- **Accept**: Not defined

### HTTP response details

| Status code | Description      | Response headers |
| ----------- | ---------------- | ---------------- |
| **204**     | No response body | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## destroy

> destroy(id)

list: Return a list of all the courses. create: Create a new course. retrieve: Return the given course. update: Update a course. partial_update: Update a course. delete: Delete a course

### Example

```ts
import { Configuration, CoursesApi } from '';
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
    // Configure HTTP bearer authorization: jwtAuth
    accessToken: 'YOUR BEARER TOKEN',
  });
  const api = new CoursesApi(config);

  const body = {
    // number | A unique integer value identifying this course.
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

| Name   | Type     | Description                                     | Notes                     |
| ------ | -------- | ----------------------------------------------- | ------------------------- |
| **id** | `number` | A unique integer value identifying this course. | [Defaults to `undefined`] |

### Return type

`void` (Empty response body)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: Not defined

### HTTP response details

| Status code | Description      | Response headers |
| ----------- | ---------------- | ---------------- |
| **204**     | No response body | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## list

> Array&lt;Course&gt; list()

list: Return a list of all the courses. create: Create a new course. retrieve: Return the given course. update: Update a course. partial_update: Update a course. delete: Delete a course

### Example

```ts
import { Configuration, CoursesApi } from '';
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
    // Configure HTTP bearer authorization: jwtAuth
    accessToken: 'YOUR BEARER TOKEN',
  });
  const api = new CoursesApi(config);

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

[**Array&lt;Course&gt;**](Course.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **200**     |             | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## partialUpdate

> Course partialUpdate(id, patchedCourse)

list: Return a list of all the courses. create: Create a new course. retrieve: Return the given course. update: Update a course. partial_update: Update a course. delete: Delete a course

### Example

```ts
import {
  Configuration,
  CoursesApi,
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
    // Configure HTTP bearer authorization: jwtAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new CoursesApi(config);

  const body = {
    // number | A unique integer value identifying this course.
    id: 56,
    // PatchedCourse (optional)
    patchedCourse: ...,
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

| Name              | Type                              | Description                                     | Notes                     |
| ----------------- | --------------------------------- | ----------------------------------------------- | ------------------------- |
| **id**            | `number`                          | A unique integer value identifying this course. | [Defaults to `undefined`] |
| **patchedCourse** | [PatchedCourse](PatchedCourse.md) |                                                 | [Optional]                |

### Return type

[**Course**](Course.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

### HTTP request headers

- **Content-Type**: `application/json`, `application/x-www-form-urlencoded`, `multipart/form-data`
- **Accept**: `application/json`

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **200**     |             | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## removeFromRosterPartialUpdate

> CourseRoster removeFromRosterPartialUpdate(id, patchedCourse)

get: Show the roster for a course. patch: Update the roster for a course.

### Example

```ts
import {
  Configuration,
  CoursesApi,
} from '';
import type { RemoveFromRosterPartialUpdateRequest } from '';

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
  const api = new CoursesApi(config);

  const body = {
    // number | A unique integer value identifying this course.
    id: 56,
    // PatchedCourse (optional)
    patchedCourse: ...,
  } satisfies RemoveFromRosterPartialUpdateRequest;

  try {
    const data = await api.removeFromRosterPartialUpdate(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name              | Type                              | Description                                     | Notes                     |
| ----------------- | --------------------------------- | ----------------------------------------------- | ------------------------- |
| **id**            | `number`                          | A unique integer value identifying this course. | [Defaults to `undefined`] |
| **patchedCourse** | [PatchedCourse](PatchedCourse.md) |                                                 | [Optional]                |

### Return type

[**CourseRoster**](CourseRoster.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

### HTTP request headers

- **Content-Type**: `application/json`, `application/x-www-form-urlencoded`, `multipart/form-data`
- **Accept**: `application/json`

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **200**     |             | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## retrieve

> Course retrieve(id)

list: Return a list of all the courses. create: Create a new course. retrieve: Return the given course. update: Update a course. partial_update: Update a course. delete: Delete a course

### Example

```ts
import { Configuration, CoursesApi } from '';
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
    // Configure HTTP bearer authorization: jwtAuth
    accessToken: 'YOUR BEARER TOKEN',
  });
  const api = new CoursesApi(config);

  const body = {
    // number | A unique integer value identifying this course.
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

| Name   | Type     | Description                                     | Notes                     |
| ------ | -------- | ----------------------------------------------- | ------------------------- |
| **id** | `number` | A unique integer value identifying this course. | [Defaults to `undefined`] |

### Return type

[**Course**](Course.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **200**     |             | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## rosterMapPartialUpdate

> CourseRosterMap rosterMapPartialUpdate(id, patchedCourseRosterMap)

list: Return a list of all the courses. create: Create a new course. retrieve: Return the given course. update: Update a course. partial_update: Update a course. delete: Delete a course

### Example

```ts
import {
  Configuration,
  CoursesApi,
} from '';
import type { RosterMapPartialUpdateRequest } from '';

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
  const api = new CoursesApi(config);

  const body = {
    // number | A unique integer value identifying this course.
    id: 56,
    // PatchedCourseRosterMap (optional)
    patchedCourseRosterMap: ...,
  } satisfies RosterMapPartialUpdateRequest;

  try {
    const data = await api.rosterMapPartialUpdate(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                       | Type                                                | Description                                     | Notes                     |
| -------------------------- | --------------------------------------------------- | ----------------------------------------------- | ------------------------- |
| **id**                     | `number`                                            | A unique integer value identifying this course. | [Defaults to `undefined`] |
| **patchedCourseRosterMap** | [PatchedCourseRosterMap](PatchedCourseRosterMap.md) |                                                 | [Optional]                |

### Return type

[**CourseRosterMap**](CourseRosterMap.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

### HTTP request headers

- **Content-Type**: `application/json`, `application/x-www-form-urlencoded`, `multipart/form-data`
- **Accept**: `application/json`

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **200**     |             | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## rosterMapRetrieve

> CourseRosterMap rosterMapRetrieve(id)

list: Return a list of all the courses. create: Create a new course. retrieve: Return the given course. update: Update a course. partial_update: Update a course. delete: Delete a course

### Example

```ts
import { Configuration, CoursesApi } from '';
import type { RosterMapRetrieveRequest } from '';

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
    // Configure HTTP bearer authorization: jwtAuth
    accessToken: 'YOUR BEARER TOKEN',
  });
  const api = new CoursesApi(config);

  const body = {
    // number | A unique integer value identifying this course.
    id: 56,
  } satisfies RosterMapRetrieveRequest;

  try {
    const data = await api.rosterMapRetrieve(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name   | Type     | Description                                     | Notes                     |
| ------ | -------- | ----------------------------------------------- | ------------------------- |
| **id** | `number` | A unique integer value identifying this course. | [Defaults to `undefined`] |

### Return type

[**CourseRosterMap**](CourseRosterMap.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **200**     |             | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## rosterPartialUpdate

> CourseRoster rosterPartialUpdate(id, patchedCourse)

get: Show the roster for a course. patch: Update the roster for a course.

### Example

```ts
import {
  Configuration,
  CoursesApi,
} from '';
import type { RosterPartialUpdateRequest } from '';

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
  const api = new CoursesApi(config);

  const body = {
    // number | A unique integer value identifying this course.
    id: 56,
    // PatchedCourse (optional)
    patchedCourse: ...,
  } satisfies RosterPartialUpdateRequest;

  try {
    const data = await api.rosterPartialUpdate(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name              | Type                              | Description                                     | Notes                     |
| ----------------- | --------------------------------- | ----------------------------------------------- | ------------------------- |
| **id**            | `number`                          | A unique integer value identifying this course. | [Defaults to `undefined`] |
| **patchedCourse** | [PatchedCourse](PatchedCourse.md) |                                                 | [Optional]                |

### Return type

[**CourseRoster**](CourseRoster.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

### HTTP request headers

- **Content-Type**: `application/json`, `application/x-www-form-urlencoded`, `multipart/form-data`
- **Accept**: `application/json`

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **200**     |             | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## rosterRetrieve

> CourseRoster rosterRetrieve(id)

get: Show the roster for a course. patch: Update the roster for a course.

### Example

```ts
import { Configuration, CoursesApi } from '';
import type { RosterRetrieveRequest } from '';

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
    // Configure HTTP bearer authorization: jwtAuth
    accessToken: 'YOUR BEARER TOKEN',
  });
  const api = new CoursesApi(config);

  const body = {
    // number | A unique integer value identifying this course.
    id: 56,
  } satisfies RosterRetrieveRequest;

  try {
    const data = await api.rosterRetrieve(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name   | Type     | Description                                     | Notes                     |
| ------ | -------- | ----------------------------------------------- | ------------------------- |
| **id** | `number` | A unique integer value identifying this course. | [Defaults to `undefined`] |

### Return type

[**CourseRoster**](CourseRoster.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **200**     |             | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## sectionsList

> PaginatedSectionList sectionsList(id, page, pageSize)

Gets a paginated list of sections for a course. We use this for performance for large courses to fetch sections in bulk. They\&#39;re rarely used in admin console operations, so it\&#39;s a great candidate to paginate Returns a list of Section objects

### Example

```ts
import { Configuration, CoursesApi } from '';
import type { SectionsListRequest } from '';

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
    // Configure HTTP bearer authorization: jwtAuth
    accessToken: 'YOUR BEARER TOKEN',
  });
  const api = new CoursesApi(config);

  const body = {
    // number | A unique integer value identifying this course.
    id: 56,
    // number | A page number within the paginated result set. (optional)
    page: 56,
    // number | Number of results to return per page. (optional)
    pageSize: 56,
  } satisfies SectionsListRequest;

  try {
    const data = await api.sectionsList(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name         | Type     | Description                                     | Notes                                |
| ------------ | -------- | ----------------------------------------------- | ------------------------------------ |
| **id**       | `number` | A unique integer value identifying this course. | [Defaults to `undefined`]            |
| **page**     | `number` | A page number within the paginated result set.  | [Optional] [Defaults to `undefined`] |
| **pageSize** | `number` | Number of results to return per page.           | [Optional] [Defaults to `undefined`] |

### Return type

[**PaginatedSectionList**](PaginatedSectionList.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **200**     |             | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## studentCaptionsPartialUpdate

> CourseStudentCaptions studentCaptionsPartialUpdate(id, patchedCourseStudentCaptions)

list: Return a list of all the courses. create: Create a new course. retrieve: Return the given course. update: Update a course. partial_update: Update a course. delete: Delete a course

### Example

```ts
import {
  Configuration,
  CoursesApi,
} from '';
import type { StudentCaptionsPartialUpdateRequest } from '';

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
  const api = new CoursesApi(config);

  const body = {
    // number | A unique integer value identifying this course.
    id: 56,
    // PatchedCourseStudentCaptions (optional)
    patchedCourseStudentCaptions: ...,
  } satisfies StudentCaptionsPartialUpdateRequest;

  try {
    const data = await api.studentCaptionsPartialUpdate(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                             | Type                                                            | Description                                     | Notes                     |
| -------------------------------- | --------------------------------------------------------------- | ----------------------------------------------- | ------------------------- |
| **id**                           | `number`                                                        | A unique integer value identifying this course. | [Defaults to `undefined`] |
| **patchedCourseStudentCaptions** | [PatchedCourseStudentCaptions](PatchedCourseStudentCaptions.md) |                                                 | [Optional]                |

### Return type

[**CourseStudentCaptions**](CourseStudentCaptions.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

### HTTP request headers

- **Content-Type**: `application/json`, `application/x-www-form-urlencoded`, `multipart/form-data`
- **Accept**: `application/json`

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **200**     |             | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## studentCaptionsRetrieve

> CourseStudentCaptions studentCaptionsRetrieve(id)

list: Return a list of all the courses. create: Create a new course. retrieve: Return the given course. update: Update a course. partial_update: Update a course. delete: Delete a course

### Example

```ts
import { Configuration, CoursesApi } from '';
import type { StudentCaptionsRetrieveRequest } from '';

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
    // Configure HTTP bearer authorization: jwtAuth
    accessToken: 'YOUR BEARER TOKEN',
  });
  const api = new CoursesApi(config);

  const body = {
    // number | A unique integer value identifying this course.
    id: 56,
  } satisfies StudentCaptionsRetrieveRequest;

  try {
    const data = await api.studentCaptionsRetrieve(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name   | Type     | Description                                     | Notes                     |
| ------ | -------- | ----------------------------------------------- | ------------------------- |
| **id** | `number` | A unique integer value identifying this course. | [Defaults to `undefined`] |

### Return type

[**CourseStudentCaptions**](CourseStudentCaptions.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **200**     |             | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## update

> Course update(id, course)

list: Return a list of all the courses. create: Create a new course. retrieve: Return the given course. update: Update a course. partial_update: Update a course. delete: Delete a course

### Example

```ts
import {
  Configuration,
  CoursesApi,
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
    // Configure HTTP bearer authorization: jwtAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new CoursesApi(config);

  const body = {
    // number | A unique integer value identifying this course.
    id: 56,
    // Course
    course: ...,
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

| Name       | Type                | Description                                     | Notes                     |
| ---------- | ------------------- | ----------------------------------------------- | ------------------------- |
| **id**     | `number`            | A unique integer value identifying this course. | [Defaults to `undefined`] |
| **course** | [Course](Course.md) |                                                 |                           |

### Return type

[**Course**](Course.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

### HTTP request headers

- **Content-Type**: `application/json`, `application/x-www-form-urlencoded`, `multipart/form-data`
- **Accept**: `application/json`

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **200**     |             | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
