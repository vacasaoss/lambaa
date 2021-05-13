/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context, SQSEvent } from "aws-lambda" // prettier-ignore
import { Middleware, RouterRegistration, ControllerOptions, Handler, MiddlewareFunction } from "./types" // prettier-ignore
import { ROUTE_HANDLER_METADATA_KEY, CONTROLLER_METADATA_KEY } from "./constants" // prettier-ignore
import RouteMap from "./RouteMap"
import replaceEventArgs from "./replaceEventArgs"
import { isApiGatewayEvent, isApiGatewayProxyEvent, isSqsEvent } from "./typeGuards"

class Router {
    private registrations: RouterRegistration[]

    constructor(...registrations: RouterRegistration[]) {
        this.registrations = registrations
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
     * Route an incoming SQS event to a controller.
     * @param event The SQS event.
     * @param context The Lambda context.
     */
    public route(event: SQSEvent, context: Context): Promise<void>

    public async route<TEvent, TResult>(
        event: TEvent,
        context: Context
    ): Promise<TResult> {
        for (const { controllers, middleware } of this.registrations) {
            for (const controller of controllers) {
                const controllerOptions:
                    | ControllerOptions
                    | undefined = Reflect.getMetadata(
                    CONTROLLER_METADATA_KEY,
                    controller
                )

                if (!controllerOptions) {
                    continue
                }

                const routeMap: RouteMap | undefined = Reflect.getMetadata(
                    ROUTE_HANDLER_METADATA_KEY,
                    controller
                )

                let method: string | undefined
                let debugMessage: string | undefined

                if (isApiGatewayProxyEvent(event)){
                    method = routeMap?.getRouteOverridePathParams(event);
                    if (method) {
                        debugMessage = `Passing ${event.httpMethod} ${event.path} request to ${controller?.constructor?.name}.${method}(...)`
                    }
                } else if (isApiGatewayEvent(event)) {
                    
                    method = routeMap?.getRoute({
                        eventType: "API_GATEWAY",
                        method: event.httpMethod,
                        resource: event.resource,
                        basePath: controllerOptions.basePath
                    })

                    if (method) {
                        debugMessage = `Passing ${event.httpMethod} ${event.resource} request to ${controller?.constructor?.name}.${method}(...)`
                    }
                } else if (isSqsEvent(event) && event.Records.length > 0) {
                    for (const record of event.Records) {
                        method = routeMap?.getRoute({
                            eventType: "SQS",
                            arn: record.eventSourceARN,
                        })

                        if (method) {
                            debugMessage = `Passing SQS event to ${controller?.constructor?.name}.${method}(...)`
                            break
                        }
                    }
                }

                if (!method) {
                    continue
                }

                if (
                    debugMessage &&
                    process.env.DEBUG?.toLowerCase() === "true"
                ) {
                    console.debug(debugMessage)
                }

                const pipeline = [
                    ...(middleware ?? []),
                    ...(controllerOptions.middleware ?? []),
                ].reverse() // Reverse to ensure middlewares are executed in the correct order

                return this.invoke(
                    event,
                    context,
                    (e, c) =>
                        this.executeRouteHandler(controller, method!, e, c),
                    pipeline
                )
            }
        }

        throw new Error("No configured route for this event")
    }

    /**
     * Execute the middleware pipeline.
     */
    private invoke(
        event: any,
        context: Context,
        handler: Handler<any, any>,
        pipeline: Array<Middleware<any, any> | MiddlewareFunction<any, any>>
    ): Promise<any> {
        const middleware = pipeline.pop()

        if (!middleware) {
            return handler(event, context)
        }

        const next = (e: any, c: Context) =>
            this.invoke(e, c, handler, pipeline)

        return "invoke" in middleware
            ? middleware.invoke(event, context, next)
            : middleware(event, context, next)
    }

    /**
     * Extract request parameters and pass to the route handler.
     */
    private executeRouteHandler(
        controller: any,
        method: string,
        event: any,
        context: Context
    ): Promise<any> {
        const args = replaceEventArgs(event, controller, method, [
            event,
            context,
        ])

        return controller[method](...[...args, event, context])
    }
}

export default Router
