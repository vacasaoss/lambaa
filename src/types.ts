import {
    Context,
    APIGatewayProxyEvent,
    APIGatewayProxyResult,
} from "aws-lambda"

export interface RequestOptions {
    required: boolean
}

export type ControllerOptions = {
    middleware?: Array<Middleware<any, any> | MiddlewareFunction<any, any>>
    basePath?: string
}

export type HTTPMethod = "GET" | "POST" | "DELETE" | "PATCH" | "PUT"

export type RequestErrorCode =
    | "MISSING_PATH_PARAMETER"
    | "MISSING_QUERY_PARAMETER"
    | "MISSING_REQUEST_DATA"
    | "MISSING_HEADER"

/**
 * Defines a middleware invoke function.
 */
export type MiddlewareFunction<
    TEvent = APIGatewayProxyEvent,
    TResult = APIGatewayProxyResult
> = (
    event: TEvent,
    context: Context,
    next: Handler<TEvent, TResult>
) => Promise<TResult>

/**
 * Defines middleware that can be added to the request pipeline.
 */
export interface Middleware<
    TEvent = APIGatewayProxyEvent,
    TResult = APIGatewayProxyResult
> {
    invoke: MiddlewareFunction<TEvent, TResult>
}

/**
 * Defines controller/ middleware, registered with the controller.
 */
export interface RouterRegistration<TEvent = any, TResult = any> {
    controllers: any[]
    middleware?: Array<
        Middleware<TEvent, TResult> | MiddlewareFunction<TEvent, TResult>
    >
}

/**
 * Defines a Lambda event handler.
 */
export type Handler<
    TEvent = APIGatewayProxyEvent,
    TResult = APIGatewayProxyResult
> = (r: TEvent, c: Context) => Promise<TResult>
