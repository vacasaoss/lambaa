import { APIGatewayProxyEvent } from "aws-lambda"

type RouteProperties =
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
    | {
          eventType: "Schedule"
          arn: string
      }

/**
 * Used to store routing data on controllers.
 */
export default class RouteMap {
    constructor(private map = new Map<string, string>()) {}

    /**
     * Store the name of the method which can handle this route.
     */
    public addRoute(
        route: RouteProperties,
        propertyKey: string | symbol
    ): void {
        if (route.eventType === "API_GATEWAY") {
            route.resource = this.normalizePath(route.resource)
            this.map.set(
                `${route.resource}_${route.method}`,
                propertyKey.toString()
            )
        } else if (
            route.eventType === "SQS" ||
            route.eventType === "Schedule"
        ) {
            this.map.set(route.arn, propertyKey.toString())
        }
    }

    /**
     * Get the name of the method which can handle this route.
     */
    public getRoute(route: RouteProperties): string | undefined {
        if (route.eventType === "API_GATEWAY") {
            route.resource = this.normalizePath(route.resource)

            if (route.basePath && route.resource.includes(route.basePath)) {
                route.basePath = this.normalizePath(route.basePath)

                const methodPath = this.normalizePath(
                    route.resource.substring(route.basePath.length)
                )

                route.resource = methodPath
            }

            return this.map.get(`${route.resource}_${route.method}`)
        } else if (
            route.eventType === "SQS" ||
            route.eventType === "Schedule"
        ) {
            return this.map.get(route.arn)
        }
    }

    /**
     * Get the name of the method which can handle this route but also
     * overrides event.pathParameters based on data extracted from the url
     */
    public getRouteOverridePathParams({
        event,
        basePath,
    }: {
        event: APIGatewayProxyEvent
        basePath: string | undefined
    }): string | undefined {
        for (const [controllerPathKey, controllerKey] of this.map.entries()) {
            // isPathMatch overrides the current event.pathParams
            const controllerComposedPath = basePath
                ? `${this.normalizePath(basePath)}${controllerPathKey}`
                : controllerPathKey
            if (this.isPathMatch(controllerComposedPath, event)) {
                return controllerKey
            }
        }
    }

    /**
     * Checks if the event.path matches one the url patterns avaible on
     * the controller map.
     * TODO: allow snake cased pattern match
     */
    private isPathMatch(route: string, event: APIGatewayProxyEvent): boolean {
        const eventPathParts = event.path.split("/")
        const routeMethod = route.split("_")[1]
        const routePathParts = route.split("_")[0].split("/")

        // Fail fast if they're not the same length
        if (
            eventPathParts.length !== routePathParts.length ||
            routeMethod !== event.httpMethod
        ) {
            return false
        }

        // Start with 1 because the url should always start with the first back slash
        for (let i = 1; i < eventPathParts.length; ++i) {
            const pathPart = eventPathParts[i]
            const routePart = routePathParts[i]

            // If the part is a curly braces value
            const pathPartMatch = /\{(\w+)}/g.exec(routePart)
            if (pathPartMatch) {
                if (event?.pathParameters) {
                    event.pathParameters[pathPartMatch[1]] = pathPart
                }
                continue
            }

            // Fail fast if a part doesn't match
            if (routePart !== pathPart) {
                return false
            }
        }
        return true
    }

    private normalizePath(part: string): string {
        if (part[0] !== "/") {
            part = `/${part}`
        }

        return part
    }
}
