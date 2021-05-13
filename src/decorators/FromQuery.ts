import { FROM_QUERY_METADATA_KEY } from "../constants"
import { RequestOptions } from "../types"

/**
 * Extract a parameter from the request query string.
 */
export default function FromQuery<T = string>(
    name: string,
    options: RequestOptions<T> = { required: true }
): ParameterDecorator {
    return (target: any, propertyKey: string | symbol, index: number): void => {
        const existing: any[] =
            Reflect.getOwnMetadata(
                FROM_QUERY_METADATA_KEY,
                target,
                propertyKey
            ) ?? []

        existing.push({ name, index, options })

        Reflect.defineMetadata(
            FROM_QUERY_METADATA_KEY,
            existing,
            target,
            propertyKey
        )
    }
}
