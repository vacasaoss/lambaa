import { Middleware, MiddlewareFunction } from "../types"
import replaceEventArgs from "../replaceEventArgs"

/**
 * Add middleware to the request piepline of a single route.
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
        const original = descriptor.value
        if (original) {
            descriptor.value = function (...args: any): any {
                // Get the last two args.
                // This because the router may call this with additional args, e.g. (@FromBody() etc args), however the final two will still be (event, context).
                const [event, context] = args.slice(-2)

                if ("invoke" in middleware) {
                    return middleware.invoke(event, context, (e, c) =>
                        original.apply(
                            this,
                            replaceEventArgs(e, target, propertyKey, [e, c])
                        )
                    )
                } else {
                    return middleware(event, context, (e, c) =>
                        original.apply(
                            this,
                            replaceEventArgs(e, target, propertyKey, [e, c])
                        )
                    )
                }
            }
        }

        return descriptor
    }
}
