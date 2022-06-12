import { RouterErrorCode } from "./types"

/**
 * An error thrown when the `Router` is unable to route an event.
 * @category Error
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
