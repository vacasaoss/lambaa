import { RouterErrorCode } from "./types"

/**
 * Represents a failure to route an event.
 */
export default class RouterError extends Error {
    public isRouterError = true
    public code: RouterErrorCode

    constructor({ message, code }: { message: string; code: RouterErrorCode }) {
        super(message)
        this.code = code
        Object.setPrototypeOf(this, RouterError.prototype)
    }
}
