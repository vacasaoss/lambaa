import { RequestErrorCode } from "./types"

/**
 * An error thrown if a request parsing decorator is unable to provide the request data.
 */
export default class RequestError extends Error {
    public isRequestParseError = true
    public code: RequestErrorCode

    constructor({
        message,
        code,
    }: {
        message: string
        code: RequestErrorCode
    }) {
        super(message)
        this.code = code
        Object.setPrototypeOf(this, RequestError.prototype)
    }
}
