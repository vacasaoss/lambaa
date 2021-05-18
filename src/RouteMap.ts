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

    private normalizePath(part: string): string {
        if (part[0] !== "/") {
            part = `/${part}`
        }

        return part
    }
}
