import { RequestParameterOptions } from "../types"
import { FROM_HEADER_METADATA_KEY } from "../constants"

/**
 * Extract a header value from the API Gateway request.
 * @category API Gateway Request Parameter Decorator
 */
export default function FromHeader(
    name: string,
    options: RequestParameterOptions = { required: true }
): ParameterDecorator {
    return (target: any, propertyKey: string | symbol, index: number): void => {
        const existing: any[] =
            Reflect.getOwnMetadata(
                FROM_HEADER_METADATA_KEY,
                target,
                propertyKey
            ) ?? []

        existing.push({ name, index, options })

        Reflect.defineMetadata(
            FROM_HEADER_METADATA_KEY,
            existing,
            target,
            propertyKey
        )
    }
}
