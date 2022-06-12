import { Middleware, MiddlewareFunction } from "../types"
import replaceEventArgs from "../replaceEventArgs"
import { Context } from "aws-lambda"

/**
 * Attach middleware to an event handler method.
 * @category Middleware1
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

                const next = (e: TEvent, c: Context) =>
                    original.apply(
                        this,
                        replaceEventArgs(e, target, propertyKey, [e, c])
                    )

                return "invoke" in middleware
                    ? middleware.invoke(event, context, next)
                    : middleware(event, context, next)
            }
        }

        return descriptor
    }
}
