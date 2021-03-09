import {
    Context,
    APIGatewayProxyEvent,
    APIGatewayProxyResult,
    SQSEvent,
} from "aws-lambda"

export interface RequestOptions {
    required: boolean
}

export type ControllerOptions = {
    middleware?: Array<Middleware | MiddlewareFunction>
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

export interface RouterRegistration<TEvent = any, TResult = any> {
    controllers: any[]
    middleware?: Array<
        Middleware<TEvent, TResult> | MiddlewareFunction<TEvent, TResult>
    >
}

export type Handler<
    TEvent = APIGatewayProxyEvent,
    TResult = APIGatewayProxyResult
> = (r: TEvent, c: Context) => Promise<TResult>

export type Event = APIGatewayProxyEvent | SQSEvent

export type Result = APIGatewayProxyResult | void

export type RouteProperties =
    | {
          eventType: "API_GATEWAY"
          method: string
          resource: string
          basePath?: string
      }
    | {
          eventType: "SQS"
          arn: string
      }
