import { APIGatewayProxyEvent } from "aws-lambda"
import "reflect-metadata"
import {
    FROM_BODY_METADATA_KEY,
    FROM_HEADER_METADATA_KEY,
    FROM_PATH_METADATA_KEY,
    FROM_QUERY_METADATA_KEY,
    ROUTE_ARGS_METADATA_KEY
} from "./constants"
import RequestError from "./RequestError"
import { isApiGatewayEvent } from "./typeGuards"

/**
 * If the `@FromBody()` decorator is applied to a parameter:
 *  - Validate that the event body property exists
 *  - Parse the body and replace the `arg` at the `@FromBody()` parameter index
 */
const replaceFromBodyArgs = (
    event: APIGatewayProxyEvent,
    target: any,
    propertyKey: any,
    args: any[]
): void => {
    // Get metadata added by the @FromBody() decorator
    const metadata: any[] = Reflect.getMetadata(
        FROM_BODY_METADATA_KEY,
        target,
        propertyKey
    )

    metadata?.forEach(({ index, options }) => {
        if (!event.body && options.required) {
            throw new RequestError({
                code: "MISSING_REQUEST_DATA",
                message:
                    "An error occurred extracting request parameters - body data does not exist",
            })
        }

        // Replace the argument at the index with the request body or undefined if not required
        args[index] = !event.body ? undefined : JSON.parse(event.body)
    })
}

/**
 * If the `@FromQuery()` decorator is applied to a parameter:
 *  - Validate that the query parameter exists
 *  - Replace the `arg` at the `@FromQuery()` parameter index with the query parameter value
 */
const replaceFromQueryArgs = (
    event: APIGatewayProxyEvent,
    target: any,
    propertyKey: any,
    args: any[]
): void => {
    // Get metadata added by the @FromQuery() decorator
    const metadata: any[] = Reflect.getMetadata(
        FROM_QUERY_METADATA_KEY,
        target,
        propertyKey
    )

    metadata?.forEach(({ index, name, options }) => {
        const value = event.queryStringParameters
            ? event.queryStringParameters[name]
            : undefined

        if (!value && options.required) {
            throw new RequestError({
                code: "MISSING_QUERY_PARAMETER",
                message: `An error occurred extracting request parameters - query parameter '${name}' does not exist`,
            })
        }

        // Replace the argument at the index with the query parameter value or undefined if not required
        args[index] =
            options.coerce && value ? options.coerce(value) : value || undefined
    })
}

/**
 * If the `@FromPath()` decorator is applied to a parameter:
 *  - Validate that the path parameter exists
 *  - Replace the `arg` at the `@FromPath()` parameter index with the path parameter value
 */
const replaceFromPathArgs = (
    event: APIGatewayProxyEvent,
    target: any,
    propertyKey: any,
    args: any[]
): void => {
    // Get metadata added by the @FromPath() decorator
    const metadata: any[] = Reflect.getMetadata(
        FROM_PATH_METADATA_KEY,
        target,
        propertyKey
    )

    metadata?.forEach(({ index, name, options }) => {
        const value = event.pathParameters
            ? event.pathParameters[name]
            : undefined

        if (!value) {
            throw new RequestError({
                code: "MISSING_PATH_PARAMETER",
                message: `An error occurred extracting request parameters - path parameter '${name}' does not exist`,
            })
        }

        // Replace the argument at the index with the path parameter value
        args[index] =
            options.coerce && value ? options.coerce(value) : value || undefined
    })
}

/**
 * If the `@FromHeader()` decorator is applied to a parameter:
 *  - Validate that the header exists
 *  - Replace the `arg` at the `@FromHeader()` parameter index with the header value
 */
const replaceFromHeaderArgs = (
    event: APIGatewayProxyEvent,
    target: any,
    propertyKey: any,
    args: any[]
): void => {
    // Get metadata added by the @FromHeader() decorator
    const metadata: any[] = Reflect.getMetadata(
        FROM_HEADER_METADATA_KEY,
        target,
        propertyKey
    )

    metadata?.forEach(({ index, name, options }) => {
        const value = event.headers ? event.headers[name] : undefined

        if (!value && options.required) {
            throw new RequestError({
                code: "MISSING_HEADER",
                message: `An error occurred extracting request parameters - header '${name}' does not exist`,
            })
        }

        // Replace the argument at the index with the header value or undefined if not required
        args[index] =
            options.coerce && value ? options.coerce(value) : value || undefined
    })
}

/**
 * If any function created with 'DecodedParam' decorator is applied to a parameter:
 *  - Replace the `arg` at the DecodedParam parameter index with the result from the applied function
 */
const replaceCustomArgs = (
    event: APIGatewayProxyEvent,
    target: any,
    propertyKey: any,
    args: any[]
): void => {
    const metadata: any[] = Reflect.getMetadata(
        ROUTE_ARGS_METADATA_KEY,
        target,
        propertyKey
    )

    metadata?.forEach(({ index, func }) => {
        args[index] = func(event)
    })
}

/**
 * Replace the arguments with any request parameters specified using:
 * - `@FromBody()`
 * - `@FromHeader()`
 * - `@FromPath()`
 * - `@FromQuery()`
 * - any parameter created with 'DecodedParam'
 */
const replaceEventArgs = <TEvent>(
    event: TEvent,
    target: any,
    propertyKey: any,
    currentArgs: any[]
): any[] => {
    const args = [...currentArgs]

    if (isApiGatewayEvent(event)) {
        replaceFromBodyArgs(event, target, propertyKey, args)
        replaceFromQueryArgs(event, target, propertyKey, args)
        replaceFromPathArgs(event, target, propertyKey, args)
        replaceFromHeaderArgs(event, target, propertyKey, args)
        replaceCustomArgs(event, target, propertyKey, args)
    }

    return args
}

export default replaceEventArgs
