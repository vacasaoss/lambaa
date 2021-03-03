import { MiddlewareFunction } from "lambaa"

const isAuthorized = () => true

const authorizationMiddleware: MiddlewareFunction = async (
    event,
    context,
    next
) => {
    if (isAuthorized()) {
        return next(event, context)
    }

    return {
        statusCode: 401,
        body: "",
    }
}

export default authorizationMiddleware
