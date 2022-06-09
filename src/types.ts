import {
    Context,
    APIGatewayProxyEvent,
    APIGatewayProxyResult,
} from "aws-lambda"

/**
 * Request parsing parameter decorator options.
 * @category API Gateway Request Parameter Decorator
 */
export interface RequestParameterOptions {
    required: boolean
}

/**
 * Additional options that can be provided to a `@Controller()` decorator.
 * @category Controller
 */
export interface ControllerOptions {
    /**
     * A list of middleware that will run before any event handler in the controller.
     */
    middleware?: Array<Middleware<any, any> | MiddlewareFunction<any, any>>

    /**
     * A controller base path will be prepended to any API Gateway event handler resource paths.
     */
    basePath?: string
}

export type HTTPMethod = "GET" | "POST" | "DELETE" | "PATCH" | "PUT"

/**
 * A `RequestError` code.
 * @category Error
 */
export type RequestErrorCode =
    | "MISSING_PATH_PARAMETER"
    | "MISSING_QUERY_PARAMETER"
    | "MISSING_REQUEST_DATA"
    | "MISSING_HEADER"

/**
 * A `RouterError` code.
 * @category Error
 */
export type RouterErrorCode = "ROUTE_NOT_FOUND"

/**
 * Defines a middleware invoke function.
 * @category Middleware
 */
export type MiddlewareFunction<
    TEvent = APIGatewayProxyEvent,
    TResult = APIGatewayProxyResult
> = (
    event: TEvent,
    context: Context,
    next: Handler<TEvent, TResult>,
    middlewareContext?: MiddlewareContext
) => Promise<TResult>

/**
 * Defines a middleware class.
 * @category Middleware
 */
export interface Middleware<
    TEvent = APIGatewayProxyEvent,
    TResult = APIGatewayProxyResult
> {
    invoke: MiddlewareFunction<TEvent, TResult>
}

/**
 * Defines a Lambda event handler.
 * @category Middleware
 */
export type Handler<
    TEvent = APIGatewayProxyEvent,
    TResult = APIGatewayProxyResult
> = (r: TEvent, c: Context) => Promise<TResult>

/**
 * @internal
 */
export type MiddlewarePipeline<TEvent = unknown, TResult = unknown> = Array<
    Middleware<TEvent, TResult> | MiddlewareFunction<TEvent, TResult>
>

/**
 * Context passed to a middleware `invoke` function.
 * @category Middleware
 */
export interface MiddlewareContext {
    /**
     * The destination controller object.
     */
    controller?: any

    /**
     * The destination method name.
     */
    method?: string
}
