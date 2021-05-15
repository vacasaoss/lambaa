import getDefaultCoerce from "../coerce"
import { FROM_PATH_METADATA_KEY } from "../constants"
import { RequestOptions } from "../types"

/**
 * Extract a parameter from the request resource path.
 */
export default function FromPath(name: string, options: Omit<RequestOptions, 'required'> = {}): ParameterDecorator {
    return (target: any, propertyKey: string | symbol, index: number): void => {
        if (!options.coerce) {
            options.coerce = getDefaultCoerce(target, propertyKey, index)
        }
        const existing: any[] =
            Reflect.getOwnMetadata(
                FROM_PATH_METADATA_KEY,
                target,
                propertyKey
            ) ?? []

        existing.push({ name, index, options })

        Reflect.defineMetadata(
            FROM_PATH_METADATA_KEY,
            existing,
            target,
            propertyKey
        )
    }
}
