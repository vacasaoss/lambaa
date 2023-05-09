import {
    APIGatewayProxyEvent,
    APIGatewayProxyResult,
    Context,
    DynamoDBStreamEvent,
    EventBridgeEvent,
    KinesisStreamEvent,
    S3Event,
    ScheduledEvent,
    SNSEvent,
    SQSEvent,
} from "aws-lambda"
import {
    CONTROLLER_METADATA_KEY,
    ROUTE_HANDLER_METADATA_KEY,
    ROUTE_HANDLER_MIDDLEWARE_KEY,
} from "./constants"
import replaceEventArgs from "./replaceEventArgs"
import RouteMap from "./RouteMap"
import RouterError from "./RouterError"
import {
    isApiGatewayProxyEvent,
    isApiGatewayEvent,
    isSqsEvent,
    isSNSEvent,
    isScheduledEvent,
    isDynamoDbStreamEvent,
    isKinesisStreamEvent,
    isEventBridgeEvent,
    isS3event,
} from "./typeGuards"
import { ControllerOptions, Handler, MiddlewarePipeline } from "./types"

interface Destination {
    controller: any
    method: string
    options: ControllerOptions
}

/**
 * The `Router` is responsible for routing Lambda events to controllers and executing the middleware pipeline.
 * @category Router
 */
export default class Router {
    private middleware: MiddlewarePipeline<any, any> = []
    private controllers: any[] = []

    public registerMiddleware(
        ...middleware: MiddlewarePipeline<any, any>
    ): Router {
        this.middleware.push(...middleware)
        return this
    }

    public registerController(controller: any): Router {
        this.controllers.push(controller)
        return this
    }

    public registerControllers(controllers: any[]): Router {
        this.controllers.push(...controllers)
        return this
    }

    /**
     * Get a Lambda event handler.
     * - This is the function that should be provided to the Lambda runtime.
     */
    public getHandler<TEvent = unknown, TResult = unknown>(): Handler<
        TEvent,
        TResult
    > {
        return (event: TEvent, context: Context): Promise<TResult> =>
            this.route(event as any, context) as any
    }

    /**
     * Route an incoming API Gateway event to a controller.
     * @param event The API Gateway event.
     * @param context The Lambda context.
     */
    public route(
        event: APIGatewayProxyEvent,
        context: Context
    ): Promise<APIGatewayProxyResult>

    /**
     * Route a scheduled event to a controller.
     * @param event The scheduled event.
     * @param context The Lambda context.
     */
    public route(event: ScheduledEvent, context: Context): Promise<void>

    /**
     * Route an incoming SQS event to a controller.
     * @param event The SQS event.
     * @param context The Lambda context.
     */
    public route(event: SQSEvent, context: Context): Promise<void>

    /**
     * Route an incoming Dynamo DB stream event to a controller.
     * @param event The Dynamo DB stream event.
     * @param context The Lambda context.
     */
    public route(event: DynamoDBStreamEvent, context: Context): Promise<void>

    /**
     * Route an incoming Kinesis stream event to a controller.
     * @param event The Kinesis stream event.
     * @param context The Lambda context.
     */
    public route(event: KinesisStreamEvent, context: Context): Promise<void>

    /**
     * Route an incoming EventBridge event to a controller.
     * @param event The EventBridge event.
     * @param context The Lambda context.
     */
    public route<TDetailType extends string, TDetail>(
        event: EventBridgeEvent<TDetailType, TDetail>,
        context: Context
    ): Promise<void>

    /**
     * Route an incoming S3 event to a controller.
     * @param event The S3 event.
     * @param context The Lambda context.
     */
    public route(event: S3Event, context: Context): Promise<void>

    /**
     * Route an incoming SNS event to a controller.
     * @param event The SNS event.
     * @param context The Lambda context.
     */
    public route(event: SNSEvent, context: Context): Promise<void>

    /**
     * Route a Lambda event through the middleware pipeline, to a matching controller event handler.
     * @param event The Lambda event.
     * @param context The Lambda context.
     */
    public async route(event: unknown, context: Context): Promise<unknown> {
        const destination = this.findDestination(event)
        const pipeline = this.middleware.reverse()
        const handler = (e: unknown, c: Context) =>
            this.passToController(e, c, destination)

        return this.invoke(event, context, pipeline, handler, destination)
    }

    private invoke(
        event: unknown,
        context: Context,
        pipeline: MiddlewarePipeline,
        handler: Handler<unknown, unknown>,
        destination: Destination | undefined
    ): Promise<unknown> {
        const pipelineCopy = [...pipeline]
        const middleware = pipelineCopy.pop()

        if (!middleware) {
            return handler(event, context)
        }

        const middlewareContext = {
            controller: destination?.controller,
            method: destination?.method,
        }

        const next = (e: any, c: Context) =>
            this.invoke(e, c, pipelineCopy, handler, destination)

        return "invoke" in middleware
            ? middleware.invoke(event, context, next, middlewareContext)
            : middleware(event, context, next, middlewareContext)
    }

    private passToController(
        event: unknown,
        context: Context,
        destination: Destination | undefined
    ): Promise<unknown> {
        if (destination) {
            const { controller, method, options } = destination
            const { middleware: controllerMiddleware } = options

            const handlerMiddleware =
                Reflect.getMetadata(
                    ROUTE_HANDLER_MIDDLEWARE_KEY,
                    controller,
                    method
                ) ?? []

            const pipeline = [
                ...(controllerMiddleware ?? []),
                ...handlerMiddleware.reverse(),
            ].reverse()

            const handler = (e: unknown, c: Context) => {
                const args = replaceEventArgs(event, controller, method, [
                    event,
                    context,
                ])

                return controller[method](...[...args, e, c])
            }

            return this.invoke(event, context, pipeline, handler, destination)
        }

        throw new RouterError({
            message: "No configured route for this event",
            code: "ROUTE_NOT_FOUND",
        })
    }

    private findDestination(event: unknown): Destination | undefined {
        for (const controller of this.controllers) {
            const options: ControllerOptions | undefined = Reflect.getMetadata(
                CONTROLLER_METADATA_KEY,
                controller
            )

            if (!options) {
                continue
            }

            const routeMap: RouteMap | undefined = Reflect.getMetadata(
                ROUTE_HANDLER_METADATA_KEY,
                controller
            )

            let method: string | undefined

            if (isApiGatewayProxyEvent(event)) {
                method = routeMap?.getRouteOverridePathParams({
                    event,
                    basePath: options.basePath,
                })

                if (method) {
                    this.logDebugMessage(
                        `Passing ${event.httpMethod} ${event.path} request to ${controller?.constructor?.name}.${method}(...)`
                    )

                    return { controller, method, options }
                }
            }

            if (isApiGatewayEvent(event)) {
                method = routeMap?.getRoute({
                    eventType: "API_GATEWAY",
                    method: event.httpMethod,
                    resource: event.resource,
                    basePath: options.basePath,
                })

                if (method) {
                    this.logDebugMessage(
                        `Passing ${event.httpMethod} ${event.resource} request to ${controller?.constructor?.name}.${method}(...)`
                    )

                    return { controller, method, options }
                }
            }

            if (isSqsEvent(event) && event.Records.length > 0) {
                for (const record of event.Records) {
                    method = routeMap?.getRoute({
                        eventType: "SQS",
                        arn: record.eventSourceARN,
                    })

                    if (method) {
                        this.logDebugMessage(
                            `Passing SQS event to ${controller?.constructor?.name}.${method}(...)`
                        )

                        return { controller, method, options }
                    }
                }
            }

            if (isSNSEvent(event)) {
                for (const record of event.Records) {
                    method = routeMap?.getRoute({
                        eventType: "SNS",
                        arn: record.Sns.TopicArn,
                    })

                    if (method) {
                        this.logDebugMessage(
                            `Passing SNS event to ${controller?.constructor?.name}.${method}(...)`
                        )

                        return { controller, method, options }
                    }
                }
            }

            if (isScheduledEvent(event)) {
                for (const resource of event.resources) {
                    method = routeMap?.getRoute({
                        eventType: "Schedule",
                        arn: resource,
                    })

                    if (method) {
                        this.logDebugMessage(
                            `Passing Scheduled event to ${controller?.constructor?.name}.${method}(...)`
                        )

                        return { controller, method, options }
                    }
                }
            }

            if (isDynamoDbStreamEvent(event) && event.Records.length > 0) {
                for (const record of event.Records) {
                    if (!record.eventSourceARN) {
                        continue
                    }

                    const tableArn = record.eventSourceARN.substring(
                        0,
                        record.eventSourceARN.indexOf("/stream/")
                    )

                    method = routeMap?.getRoute({
                        eventType: "Dynamo",
                        arn: tableArn,
                    })

                    if (method) {
                        this.logDebugMessage(
                            `Passing Dynamo DB stream event to ${controller?.constructor?.name}.${method}(...)`
                        )

                        return { controller, method, options }
                    }
                }
            }

            if (isKinesisStreamEvent(event) && event.Records.length > 0) {
                for (const record of event.Records) {
                    method = routeMap?.getRoute({
                        eventType: "Kinesis",
                        arn: record.eventSourceARN,
                    })

                    if (method) {
                        this.logDebugMessage(
                            `Passing Kinesis stream event to ${controller?.constructor?.name}.${method}(...)`
                        )

                        return { controller, method, options }
                    }
                }
            }

            if (isEventBridgeEvent(event)) {
                method = routeMap?.getRoute({
                    eventType: "EventBridge",
                    detailType: event["detail-type"],
                    source: event.source,
                })

                if (method) {
                    this.logDebugMessage(
                        `Passing EventBridge event to ${controller?.constructor?.name}.${method}(...)`
                    )

                    return { controller, method, options }
                }
            }

            if (isS3event(event)) {
                for (const record of event.Records) {
                    method = routeMap?.getRoute({
                        eventType: "S3",
                        arn: record.s3.bucket.arn,
                    })

                    if (method) {
                        this.logDebugMessage(
                            `Passing S3 event to ${controller?.constructor?.name}.${method}(...)`
                        )

                        return { controller, method, options }
                    }
                }
            }
        }
    }

    private logDebugMessage(debugMessage: string) {
        if (debugMessage && process.env.DEBUG?.toLowerCase() === "true") {
            console.debug(debugMessage)
        }
    }
}
