import getDefaultCoerce from "../coerce"
import { FROM_BODY_METADATA_KEY } from "../constants"
import { RequestOptions } from "../types"

/**
 * Extract and parse JSON data from the request body.
 */
export default function FromBody(
    options: RequestOptions = { required: true }
): ParameterDecorator {
    return (target: any, propertyKey: string | symbol, index: number): void => {
        if (!options.coerce) {
            options.coerce = getDefaultCoerce(target, propertyKey, index)
        }
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
