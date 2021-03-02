export default class RouteMap {
    constructor(private map = new Map<string, string>()) {}

    public addRoute(
        method: string,
        resource: string,
        propertyKey: string | symbol
    ): void {
        resource = this.normalizePath(resource)
        this.map.set(`${resource}_${method}`, propertyKey.toString())
    }

    public getRoute(
        method: string,
        resource: string,
        basePath?: string
    ): string | undefined {
        resource = this.normalizePath(resource)

        if (basePath && resource.includes(basePath)) {
            basePath = this.normalizePath(basePath)

            const methodPath = this.normalizePath(
                resource.substring(basePath.length)
            )

            return this.map.get(`${methodPath}_${method}`)
        }

        return this.map.get(`${resource}_${method}`)
    }

    private normalizePath(part: string): string {
        if (part[0] !== "/") {
            part = `/${part}`
        }

        return part
    }
}
