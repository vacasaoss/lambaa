import { MiddlewareFunction } from "lambaa"

// Define the middleware using unknown event types so we can be sure
// it is compatible with both API Gateway events and SQS events.
const errorLoggerMiddleware: MiddlewareFunction<unknown, unknown> = async (
    event,
    context,
    next
) => {
    try {
        return await next(event, context)
    } catch (err) {
        console.error(`An unexpected error occurred - ${err.message}`)
        throw err
    }
}

export default errorLoggerMiddleware
