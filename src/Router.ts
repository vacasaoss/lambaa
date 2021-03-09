import { Context, APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda" // prettier-ignore
import { Middleware, RouterRegistration, ControllerOptions, Handler, MiddlewareFunction } from "./types" // prettier-ignore
import { ROUTE_HANDLER_METADATA_KEY, CONTROLLER_METADATA_KEY } from "./constants" // prettier-ignore
import RouteMap from "./RouteMap"
import replaceEventArgs from "./replaceEventArgs"

class Router {
    private registrations: RouterRegistration[]

    constructor(...registrations: RouterRegistration[]) {
        this.registrations = registrations
    }

    /**
     * Create an API Gateway event handler.
     */
    public getHandler(): Handler {
        return (
            event: APIGatewayProxyEvent,
            context: Context
        ): Promise<APIGatewayProxyResult> => this.route(event, context)
    }

    /**
     * Route an incoming API Gateway request to a controller.
     * @param event The API Gateway event.
     * @param context The API Gateway context.
     */
    public async route(
        event: APIGatewayProxyEvent,
        context: Context
    ): Promise<APIGatewayProxyResult> {
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

                const method = routeMap?.getRoute({
                    eventType: "API_GATEWAY",
                    method: event.httpMethod,
                    resource: event.resource,
                    basePath: controllerOptions.basePath,
                })

                if (!method) {
                    continue
                }

                if (process.env.DEBUG?.toLowerCase() === "true") {
                    console.debug(
                        `Passing ${event.httpMethod} ${event.resource} request to ${controller?.constructor?.name}.${method}(...)`
                    )
                }

                const pipeline = [
                    ...(middleware ?? []),
                    ...(controllerOptions.middleware ?? []),
                ].reverse() // Reverse to ensure middlewares are executed in the correct order

                return this.invoke(
                    event,
                    context,
                    (r, c) =>
                        this.executeRouteHandler(controller, method, r, c),
                    pipeline
                )
            }
        }

        console.error("No configured route for this event")

        return {
            statusCode: 500,
            body: "",
        }
    }

    /**
     * Execute the middleware pipeline.
     */
    private invoke(
        event: APIGatewayProxyEvent,
        context: Context,
        handler: Handler,
        pipeline: Array<Middleware | MiddlewareFunction>
    ): Promise<APIGatewayProxyResult> {
        const middleware = pipeline.pop()

        if (!middleware) {
            return handler(event, context)
        }

        if ("invoke" in middleware) {
            return middleware.invoke(event, context, (r, c) =>
                this.invoke(r, c, handler, pipeline)
            )
        } else {
            return middleware(event, context, (r, c) =>
                this.invoke(r, c, handler, pipeline)
            )
        }
    }

    /**
     * Extract request parameters and pass to the route handler.
     */
    private executeRouteHandler(
        controller: any,
        method: string,
        event: APIGatewayProxyEvent,
        context: Context
    ): Promise<APIGatewayProxyResult> {
        const args = replaceEventArgs(event, controller, method, [
            event,
            context,
        ])

        return controller[method](...[...args, event, context])
    }
}

export default Router
