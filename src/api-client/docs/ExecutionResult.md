
# ExecutionResult

Standard execution result for code files and notebooks.  This is the primary response type for all execution endpoints.

## Properties

Name | Type
------------ | -------------
`success` | boolean
`stdout` | string
`stderr` | string
`error` | string
`executionTime` | number
`outputData` | { [key: string]: any | undefined; }
`systemLogs` | Array&lt;string&gt;
`tests` | Array&lt;{ [key: string]: any | undefined; }&gt;
`timestamp` | string


[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


