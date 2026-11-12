# PatchedEnvironment

## Properties

| Name                    | Type                                                                   |
| ----------------------- | ---------------------------------------------------------------------- |
| `id`                    | number                                                                 |
| `assignment`            | number                                                                 |
| `language`              | [LanguageEnum](LanguageEnum.md)                                        |
| `dockerRunInstructions` | any                                                                    |
| `compileText`           | string                                                                 |
| `dockerfile`            | string                                                                 |
| `buildType`             | [BuildTypeEnum](BuildTypeEnum.md)                                      |
| `allowNetworkAccess`    | boolean                                                                |
| `maxStudentTestRuns`    | number                                                                 |
| `maxExposedFailedTests` | number                                                                 |
| `autoDetect`            | boolean                                                                |
| `imageName`             | string                                                                 |
| `buildStatus`           | number                                                                 |
| `buildLogs`             | string                                                                 |
| `lastBuilt`             | string                                                                 |
| `requirements`          | string                                                                 |
| `envVars`               | any                                                                    |
| `currentBuildVersion`   | number                                                                 |
| `imageHistory`          | any                                                                    |
| `convergencePending`    | boolean                                                                |
| `convergenceStats`      | any                                                                    |
| `successfulRuns`        | number                                                                 |
| `totalRuns`             | number                                                                 |
| `successRate`           | number                                                                 |
| `packageListSupported`  | boolean                                                                |
| `packages`              | [Array&lt;EnvironmentPackage&gt;](EnvironmentPackage.md)               |
| `excludedPackages`      | Array&lt;string&gt;                                                    |
| `pendingPackages`       | [Array&lt;EnvironmentPendingPackage&gt;](EnvironmentPendingPackage.md) |
| `imageOutOfDate`        | boolean                                                                |
| `rebuildScheduled`      | boolean                                                                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
