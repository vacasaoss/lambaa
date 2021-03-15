import { CONTROLLER_METADATA_KEY } from "../constants"
import { ControllerOptions, MiddlewareFunction, Middleware } from "../types"

/**
 * Define an API controller.
 */
export default function Controller(): ClassDecorator
export default function Controller(basePath: string): ClassDecorator
export default function Controller(middleware: Middleware<any, any>): ClassDecorator // prettier-ignore
export default function Controller(middleware: MiddlewareFunction<any, any>): ClassDecorator // prettier-ignore
export default function Controller(middleware: Array<Middleware<any, any> | MiddlewareFunction<any, any>>): ClassDecorator // prettier-ignore
export default function Controller(options: ControllerOptions): ClassDecorator
export default function Controller(
    options?:
        | ControllerOptions
        | string
        | Middleware<any, any>
        | MiddlewareFunction<any, any>
        | Array<Middleware<any, any> | MiddlewareFunction<any, any>>
): ClassDecorator {
    let controllerOptions: ControllerOptions = {}

    if (options) {
        const isMiddleware = (i: unknown): i is Middleware<any, any> => {
            const as = i as Middleware<any, any>
            return as.invoke !== undefined
        }

        if (typeof options === "string") {
            controllerOptions.basePath = options
        } else if (Array.isArray(options)) {
            controllerOptions.middleware = options
        } else if (isMiddleware(options)) {
            controllerOptions.middleware = [options]
        } else if (typeof options === "function") {
            controllerOptions.middleware = [options]
        } else {
            controllerOptions = options
        }
    }

    return (target: any) => {
        Reflect.defineMetadata(
            CONTROLLER_METADATA_KEY,
            controllerOptions,
            target.prototype
        )
    }
}
