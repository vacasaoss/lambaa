import { RouteProperties } from "./types"

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

            return
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
        }
    }

    private normalizePath(part: string): string {
        if (part[0] !== "/") {
            part = `/${part}`
        }

        return part
    }
}
