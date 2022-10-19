import { ROUTE_HANDLER_METADATA_KEY } from "../constants"
import RouteMap from "../RouteMap"
import { HTTPMethod } from "../types"

/**
 * Define an API Gateway request handler.
 * @category Event Handler Decorator
 * @param method The {@link HTTPMethod}.
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
 * @category Event Handler Decorator
 * @param arn The ARN of the queue.
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
 * Define a Scheduled event handler.
 * @category Event Handler Decorator
 * @param arn The ARN of the event rule.
 * @see https://docs.aws.amazon.com/lambda/latest/dg/services-cloudwatchevents.html
 */
export function Schedule(arn: string): MethodDecorator {
    return (
        target: any,
        propertyKey: string | symbol,
        descriptor: PropertyDescriptor
    ) => {
        const routeMap: RouteMap =
            Reflect.getMetadata(ROUTE_HANDLER_METADATA_KEY, target) ??
            new RouteMap()

        routeMap.addRoute({ eventType: "Schedule", arn }, propertyKey)

        Reflect.defineMetadata(ROUTE_HANDLER_METADATA_KEY, routeMap, target)

        return descriptor
    }
}

/**
 * Define a Dynamo DB stream event handler.
 * @category Event Handler Decorator
 * @param tableArn The ARN of the table (not the event stream ARN).
 */
export function DynamoDB(tableArn: string): MethodDecorator {
    return (
        target: any,
        propertyKey: string | symbol,
        descriptor: PropertyDescriptor
    ) => {
        const routeMap: RouteMap =
            Reflect.getMetadata(ROUTE_HANDLER_METADATA_KEY, target) ??
            new RouteMap()

        routeMap.addRoute({ eventType: "Dynamo", arn: tableArn }, propertyKey)

        Reflect.defineMetadata(ROUTE_HANDLER_METADATA_KEY, routeMap, target)

        return descriptor
    }
}

/**
 * Define a Kinesis stream event handler.
 * @category Event Handler Decorator
 * @param arn The ARN of the event stream.
 */
export function Kinesis(arn: string): MethodDecorator {
    return (
        target: any,
        propertyKey: string | symbol,
        descriptor: PropertyDescriptor
    ) => {
        const routeMap: RouteMap =
            Reflect.getMetadata(ROUTE_HANDLER_METADATA_KEY, target) ??
            new RouteMap()

        routeMap.addRoute({ eventType: "Kinesis", arn }, propertyKey)

        Reflect.defineMetadata(ROUTE_HANDLER_METADATA_KEY, routeMap, target)

        return descriptor
    }
}

/**
 * Define an EventBridge event handler.
 * @category Event Handler Decorator
 * @param source The event source. This identifies the service that generated the event.
 * @param detailType The event `detail-type`. This identifies the fields and values that appear in the `detail` field.
 */
export function EventBridge(
    source: string,
    detailType: string
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
            { eventType: "EventBridge", detailType, source },
            propertyKey
        )

        Reflect.defineMetadata(ROUTE_HANDLER_METADATA_KEY, routeMap, target)

        return descriptor
    }
}

/**
 * Define an S3 event handler.
 * @param arn The ARN of the S3 bucket.
 * @category Event Handler Decorator
 */
export function S3(arn: string): MethodDecorator {
    return (
        target: any,
        propertyKey: string | symbol,
        descriptor: PropertyDescriptor
    ) => {
        const routeMap: RouteMap =
            Reflect.getMetadata(ROUTE_HANDLER_METADATA_KEY, target) ??
            new RouteMap()

        routeMap.addRoute({ eventType: "S3", arn }, propertyKey)

        Reflect.defineMetadata(ROUTE_HANDLER_METADATA_KEY, routeMap, target)

        return descriptor
    }
}

/**
 * Define an API Gateway event handler.
 * @category Event Handler Decorator
 * @param method The {@link HTTPMethod}.
 * @param resource The request resource path.
 */
export const API = (method: HTTPMethod, resource: string) =>
    Route(method, resource)

/**
 * Define an API Gateway HTTP `GET` request handler.
 * @category Event Handler Decorator
 * @param resource The request resource path.
 */
export const GET = (resource: string) => Route("GET", resource)

/**
 * Define an API Gateway HTTP `POST` request handler.
 * @category Event Handler Decorator
 * @param resource The request resource path.
 */
export const POST = (resource: string) => Route("POST", resource)

/**
 * Define an API Gateway HTTP `DELETE` request handler.
 * @category Event Handler Decorator
 * @param resource The request resource path.
 */
export const DELETE = (resource: string) => Route("DELETE", resource)

/**
 * Define an API Gateway HTTP `PATCH` request handler.
 * @category Event Handler Decorator
 * @param resource The request resource path.
 */
export const PATCH = (resource: string) => Route("PATCH", resource)

/**
 * Define an API Gateway HTTP `PUT` request handler.
 * @category Event Handler Decorator
 * @param resource The request resource path.
 */
export const PUT = (resource: string) => Route("PUT", resource)
