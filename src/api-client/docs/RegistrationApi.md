# RegistrationApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**checkStatusNewAdminUserRetrieve**](RegistrationApi.md#checkstatusnewadminuserretrieve) | **GET** /registration/checkStatusNewAdminUser/ |  |
| [**currentUserRetrieve**](RegistrationApi.md#currentuserretrieve) | **GET** /registration/current_user/ |  |
| [**emailPasswordResetCreate**](RegistrationApi.md#emailpasswordresetcreate) | **POST** /registration/emailPasswordReset/ |  |
| [**emailRegistrationCreate**](RegistrationApi.md#emailregistrationcreate) | **POST** /registration/emailRegistration/ |  |
| [**graderToAdminCreate**](RegistrationApi.md#gradertoadmincreate) | **POST** /registration/graderToAdmin/ |  |
| [**handleValidationResponseRetrieve**](RegistrationApi.md#handlevalidationresponseretrieve) | **GET** /registration/handleValidationResponse/ |  |
| [**registerAndSetPasswordCreate**](RegistrationApi.md#registerandsetpasswordcreate) | **POST** /registration/registerAndSetPassword/ |  |
| [**resetPasswordCreate**](RegistrationApi.md#resetpasswordcreate) | **POST** /registration/resetPassword/ |  |
| [**setCredentialsCreate**](RegistrationApi.md#setcredentialscreate) | **POST** /registration/setCredentials/ |  |
| [**validateNewAdminUserCreate**](RegistrationApi.md#validatenewadminusercreate) | **POST** /registration/validateNewAdminUser/ |  |
| [**verifyRegistrationTokenCreate**](RegistrationApi.md#verifyregistrationtokencreate) | **POST** /registration/verifyRegistrationToken/ |  |
| [**verifyResetTokenCreate**](RegistrationApi.md#verifyresettokencreate) | **POST** /registration/verifyResetToken/ |  |



## checkStatusNewAdminUserRetrieve

> CheckStatusNewAdminUserResponse checkStatusNewAdminUserRetrieve()



Allows the client to check on the status of a validation request for a given user.  This view is invoked by the UI to monitor progress of validation requests.

### Example

```ts
import {
  Configuration,
  RegistrationApi,
} from '';
import type { CheckStatusNewAdminUserRetrieveRequest } from '';

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
  const api = new RegistrationApi(config);

  try {
    const data = await api.checkStatusNewAdminUserRetrieve();
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

[**CheckStatusNewAdminUserResponse**](CheckStatusNewAdminUserResponse.md)

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


## currentUserRetrieve

> User currentUserRetrieve()



Determine the current user by their token, and return their data

### Example

```ts
import {
  Configuration,
  RegistrationApi,
} from '';
import type { CurrentUserRetrieveRequest } from '';

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
  const api = new RegistrationApi(config);

  try {
    const data = await api.currentUserRetrieve();
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

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## emailPasswordResetCreate

> EmailPasswordResetResponse emailPasswordResetCreate(emailPasswordResetRequest)



### Example

```ts
import {
  Configuration,
  RegistrationApi,
} from '';
import type { EmailPasswordResetCreateRequest } from '';

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
  const api = new RegistrationApi(config);

  const body = {
    // EmailPasswordResetRequest
    emailPasswordResetRequest: ...,
  } satisfies EmailPasswordResetCreateRequest;

  try {
    const data = await api.emailPasswordResetCreate(body);
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
| **emailPasswordResetRequest** | [EmailPasswordResetRequest](EmailPasswordResetRequest.md) |  | |

### Return type

[**EmailPasswordResetResponse**](EmailPasswordResetResponse.md)

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


## emailRegistrationCreate

> EmailRegistrationResponse emailRegistrationCreate(emailRegistrationRequest)



Request body includes: email.  Function to take in email and send activation email in response, if user exists but is inactive (which indicates that they have been added to a course by a courseAdmin, but yet to create their account.)  This is intended to allow users who missed their initial activation emails to re-send one to themselves.

### Example

```ts
import {
  Configuration,
  RegistrationApi,
} from '';
import type { EmailRegistrationCreateRequest } from '';

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
  const api = new RegistrationApi(config);

  const body = {
    // EmailRegistrationRequest
    emailRegistrationRequest: ...,
  } satisfies EmailRegistrationCreateRequest;

  try {
    const data = await api.emailRegistrationCreate(body);
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
| **emailRegistrationRequest** | [EmailRegistrationRequest](EmailRegistrationRequest.md) |  | |

### Return type

[**EmailRegistrationResponse**](EmailRegistrationResponse.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

### HTTP request headers

- **Content-Type**: `application/json`, `application/x-www-form-urlencoded`, `multipart/form-data`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |
| **400** | Invalid form data |  -  |
| **403** | Email not on whitelist or invalid code |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## graderToAdminCreate

> graderToAdminCreate()



Allows a user who is only a grader to elevate their status to level of admin within their organization. The role elevation allows the admin to create new courses, but not join existing courses.

### Example

```ts
import {
  Configuration,
  RegistrationApi,
} from '';
import type { GraderToAdminCreateRequest } from '';

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
  const api = new RegistrationApi(config);

  try {
    const data = await api.graderToAdminCreate();
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

`void` (Empty response body)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | No response body |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## handleValidationResponseRetrieve

> HandleValidationResponse handleValidationResponseRetrieve()



Function is used to respond to validation instructions from codePost admins (sent via URL).  In response to a valid activation grant, set user.canModifyRosters &#x3D; True and user.pendingValidation &#x3D; False.  In response to a valid activation deny, set user.pendingValidation &#x3D; False and if user is not a member of any courses, delete that user.

### Example

```ts
import {
  Configuration,
  RegistrationApi,
} from '';
import type { HandleValidationResponseRetrieveRequest } from '';

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
  const api = new RegistrationApi(config);

  try {
    const data = await api.handleValidationResponseRetrieve();
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

[**HandleValidationResponse**](HandleValidationResponse.md)

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


## registerAndSetPasswordCreate

> RegisterAndSetPasswordResponse registerAndSetPasswordCreate(registerAndSetPasswordRequest)



Function takes a (uid, token) as authorization and, if authorization is valid, sets the associated user\&#39;s password to the password payload.  This is used in response to account activation emails (both generated via the \&quot;join\&quot; signup flow and automatically generated by roster additions)

### Example

```ts
import {
  Configuration,
  RegistrationApi,
} from '';
import type { RegisterAndSetPasswordCreateRequest } from '';

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
  const api = new RegistrationApi(config);

  const body = {
    // RegisterAndSetPasswordRequest
    registerAndSetPasswordRequest: ...,
  } satisfies RegisterAndSetPasswordCreateRequest;

  try {
    const data = await api.registerAndSetPasswordCreate(body);
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
| **registerAndSetPasswordRequest** | [RegisterAndSetPasswordRequest](RegisterAndSetPasswordRequest.md) |  | |

### Return type

[**RegisterAndSetPasswordResponse**](RegisterAndSetPasswordResponse.md)

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


## resetPasswordCreate

> ResetPasswordResponse resetPasswordCreate(resetPasswordRequest)



### Example

```ts
import {
  Configuration,
  RegistrationApi,
} from '';
import type { ResetPasswordCreateRequest } from '';

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
  const api = new RegistrationApi(config);

  const body = {
    // ResetPasswordRequest
    resetPasswordRequest: ...,
  } satisfies ResetPasswordCreateRequest;

  try {
    const data = await api.resetPasswordCreate(body);
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
| **resetPasswordRequest** | [ResetPasswordRequest](ResetPasswordRequest.md) |  | |

### Return type

[**ResetPasswordResponse**](ResetPasswordResponse.md)

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


## setCredentialsCreate

> SetCredentialsResponse setCredentialsCreate(setCredentialsRequest)



If a user is logged in by hasn\&#39;t yet set a usable password, they can use this endpoint to do so, as well as specify their organization.

### Example

```ts
import {
  Configuration,
  RegistrationApi,
} from '';
import type { SetCredentialsCreateRequest } from '';

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
  const api = new RegistrationApi(config);

  const body = {
    // SetCredentialsRequest
    setCredentialsRequest: ...,
  } satisfies SetCredentialsCreateRequest;

  try {
    const data = await api.setCredentialsCreate(body);
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
| **setCredentialsRequest** | [SetCredentialsRequest](SetCredentialsRequest.md) |  | |

### Return type

[**SetCredentialsResponse**](SetCredentialsResponse.md)

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


## validateNewAdminUserCreate

> ValidateNewAdminUserResponse validateNewAdminUserCreate(validateNewAdminUserRequest)



Function is used to trigger manual account validation in response to a user requesting their account be granted course creation privileges.  Currently Vurnable to abuse, any user can call this endpoint and create an admin account.

### Example

```ts
import {
  Configuration,
  RegistrationApi,
} from '';
import type { ValidateNewAdminUserCreateRequest } from '';

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
  const api = new RegistrationApi(config);

  const body = {
    // ValidateNewAdminUserRequest
    validateNewAdminUserRequest: ...,
  } satisfies ValidateNewAdminUserCreateRequest;

  try {
    const data = await api.validateNewAdminUserCreate(body);
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
| **validateNewAdminUserRequest** | [ValidateNewAdminUserRequest](ValidateNewAdminUserRequest.md) |  | |

### Return type

[**ValidateNewAdminUserResponse**](ValidateNewAdminUserResponse.md)

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


## verifyRegistrationTokenCreate

> VerifyRegistrationTokenResponse verifyRegistrationTokenCreate(verifyRegistrationTokenRequest)



Handle valid verify email links sent after account creation.  Function takes a (uid, token) as input and determines if the pair is valid.  This is used to inform the client whether a user presenting (uid, token) should be shown a form to set their password.

### Example

```ts
import {
  Configuration,
  RegistrationApi,
} from '';
import type { VerifyRegistrationTokenCreateRequest } from '';

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
  const api = new RegistrationApi(config);

  const body = {
    // VerifyRegistrationTokenRequest
    verifyRegistrationTokenRequest: ...,
  } satisfies VerifyRegistrationTokenCreateRequest;

  try {
    const data = await api.verifyRegistrationTokenCreate(body);
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
| **verifyRegistrationTokenRequest** | [VerifyRegistrationTokenRequest](VerifyRegistrationTokenRequest.md) |  | |

### Return type

[**VerifyRegistrationTokenResponse**](VerifyRegistrationTokenResponse.md)

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


## verifyResetTokenCreate

> VerifyResetTokenResponse verifyResetTokenCreate(verifyResetTokenRequest)



Handle valid verify email links sent after password reset requests.

### Example

```ts
import {
  Configuration,
  RegistrationApi,
} from '';
import type { VerifyResetTokenCreateRequest } from '';

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
  const api = new RegistrationApi(config);

  const body = {
    // VerifyResetTokenRequest
    verifyResetTokenRequest: ...,
  } satisfies VerifyResetTokenCreateRequest;

  try {
    const data = await api.verifyResetTokenCreate(body);
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
| **verifyResetTokenRequest** | [VerifyResetTokenRequest](VerifyResetTokenRequest.md) |  | |

### Return type

[**VerifyResetTokenResponse**](VerifyResetTokenResponse.md)

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

