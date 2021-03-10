import { MiddlewareFunction } from "lambaa"

const apiErrorHandlerMiddleware: MiddlewareFunction = async (
    event,
    context,
    next
) => {
    try {
        return await next(event, context)
    } catch {
        console.error("An unexpected error occurred")

        return {
            statusCode: 500,
            body: "",
        }
    }
}

export default apiErrorHandlerMiddleware
