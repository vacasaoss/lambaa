import { Middleware, MiddlewareFunction } from "../types"
import { ROUTE_HANDLER_MIDDLEWARE_KEY } from "../constants"

/**
 * Attach middleware to an event handler method.
 * @category Middleware
 */
export default function Use<TEvent, TResponse>(
    middleware:
        | Middleware<TEvent, TResponse>
        | MiddlewareFunction<TEvent, TResponse>
): MethodDecorator {
    return (
        target: any,
        propertyKey: string | symbol,
        descriptor: PropertyDescriptor
    ) => {
        const existing: any[] =
            Reflect.getOwnMetadata(
                ROUTE_HANDLER_MIDDLEWARE_KEY,
                target,
                propertyKey
            ) ?? []

        existing.push(middleware)

        Reflect.defineMetadata(
            ROUTE_HANDLER_MIDDLEWARE_KEY,
            existing,
            target,
            propertyKey
        )

        return descriptor
    }
}
