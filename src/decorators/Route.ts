import { HTTPMethod } from "../types"
import { ROUTE_HANDLER_METADATA_KEY } from "../constants"
import RouteMap from "../RouteMap"

/**
 * Define a request handler route.
 * @param method The request HTTP method.
 * @param resource The request resource path.
 */
export default function Route(
    method: HTTPMethod,
    resource: string
): MethodDecorator {
    return (
        target: any,
        propertyKey: string | symbol,
        descriptor: PropertyDescriptor
    ) => {
        const routeMap: RouteMap =
            Reflect.getMetadata(ROUTE_HANDLER_METADATA_KEY, target) ??
            new RouteMap()

        routeMap.addRoute(
            { eventType: "API_GATEWAY", method, resource },
            propertyKey
        )

        Reflect.defineMetadata(ROUTE_HANDLER_METADATA_KEY, routeMap, target)

        return descriptor
    }
}

/**
 * Define an SQS event handler.
 */
export function SQS(arn: string): MethodDecorator {
    return (
        target: any,
        propertyKey: string | symbol,
        descriptor: PropertyDescriptor
    ) => {
        const routeMap: RouteMap =
            Reflect.getMetadata(ROUTE_HANDLER_METADATA_KEY, target) ??
            new RouteMap()

        routeMap.addRoute({ eventType: "SQS", arn }, propertyKey)

        Reflect.defineMetadata(ROUTE_HANDLER_METADATA_KEY, routeMap, target)

        return descriptor
    }
}

/**
 * Define an API Gateway event handler.
 */
export const API = (method: HTTPMethod, resource: string) =>
    Route(method, resource)

/**
 * Define an HTTP `GET` request handler.
 * @param resource The request resource path.
 */
export const GET = (resource: string) => Route("GET", resource)

/**
 * Define an HTTP `POST` request handler.
 * @param resource The request resource path.
 */
export const POST = (resource: string) => Route("POST", resource)

/**
 * Define an HTTP `DELETE` request handler.
 * @param resource The request resource path.
 */
export const DELETE = (resource: string) => Route("DELETE", resource)

/**
 * Define an HTTP `PATCH` request handler.
 * @param resource The request resource path.
 */
export const PATCH = (resource: string) => Route("PATCH", resource)

/**
 * Define an HTTP `PUT` request handler.
 * @param resource The request resource path.
 */
export const PUT = (resource: string) => Route("PUT", resource)
