import {
    APIGatewayProxyEvent,
    APIGatewayProxyResult,
    Context,
    ScheduledEvent,
    SQSEvent,
} from "aws-lambda"
import {
    CONTROLLER_METADATA_KEY,
    ROUTE_HANDLER_METADATA_KEY,
} from "./constants"
import replaceEventArgs from "./replaceEventArgs"
import RouteMap from "./RouteMap"
import RouterError from "./RouterError"
import {
    isApiGatewayProxyEvent,
    isApiGatewayEvent,
    isSqsEvent,
    isScheduledEvent,
    isDynamoDbStreamEvent,
} from "./typeGuards"
import { ControllerOptions, Handler, MiddlewarePipeline } from "./types"

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

    public async route(event: unknown, context: Context): Promise<unknown> {
        const pipeline = this.middleware.reverse()
        return this.invoke(event, context, pipeline, (e: unknown, c: Context) =>
            this.passToController(e, c)
        )
    }

    private invoke(
        event: unknown,
        context: Context,
        pipeline: MiddlewarePipeline,
        handler: Handler<unknown, unknown>
    ): Promise<unknown> {
        const pipelineCopy = [...pipeline]
        const middleware = pipelineCopy.pop()

        if (!middleware) {
            return handler(event, context)
        }

        const next = (e: any, c: Context) =>
            this.invoke(e, c, pipelineCopy, handler)

        return "invoke" in middleware
            ? middleware.invoke(event, context, next)
            : middleware(event, context, next)
    }

    private passToController(
        event: unknown,
        context: Context
    ): Promise<unknown> {
        const routable = this.findRoutable(event)

        if (routable) {
            const { controller, method, options } = routable
            const args = replaceEventArgs(event, controller, method, [
                event,
                context,
            ])

            const pipeline = [...(options.middleware ?? [])].reverse()

            return this.invoke(
                event,
                context,
                pipeline,
                (e: unknown, c: Context) =>
                    controller[method](...[...args, e, c])
            )
        }

        throw new RouterError({
            message: "No configured route for this event",
            code: "ROUTE_NOT_FOUND",
        })
    }

    private findRoutable(event: unknown):
        | {
              controller: any
              method: string
              options: ControllerOptions
          }
        | undefined {
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
        }
    }

    private logDebugMessage(debugMessage: string) {
        if (debugMessage && process.env.DEBUG?.toLowerCase() === "true") {
            console.debug(debugMessage)
        }
    }
}
