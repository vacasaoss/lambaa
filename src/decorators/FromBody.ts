import { RequestParameterOptions } from "../types"
import { FROM_BODY_METADATA_KEY } from "../constants"

/**
 * Extract and parse JSON data from the API Gateway request body.
 * @category API Gateway Request Parameter Decorator
 */
export default function FromBody(
    options: RequestParameterOptions = { required: true }
): ParameterDecorator {
    return (target: any, propertyKey: string | symbol, index: number): void => {
        const existing: any[] =
            Reflect.getOwnMetadata(
                FROM_BODY_METADATA_KEY,
                target,
                propertyKey
            ) ?? []

        existing.push({ index, options })

        Reflect.defineMetadata(
            FROM_BODY_METADATA_KEY,
            existing,
            target,
            propertyKey
        )
    }
}
