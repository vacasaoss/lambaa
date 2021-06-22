import getCoercionFn from "../coerce"
import { FROM_HEADER_METADATA_KEY } from "../constants"
import { RequestOptions } from "../types"

/**
 * Extract a header value from the request.
 */
export default function FromHeader(
    name: string,
    options: RequestOptions = { required: true }
): ParameterDecorator {
    return (target: any, propertyKey: string | symbol, index: number): void => {
        const existing: any[] =
            Reflect.getOwnMetadata(
                FROM_HEADER_METADATA_KEY,
                target,
                propertyKey
            ) ?? []

        existing.push({
            name,
            index,
            options: {
                ...options,
                coerce: getCoercionFn(target, propertyKey, index),
            },
        })

        Reflect.defineMetadata(
            FROM_HEADER_METADATA_KEY,
            existing,
            target,
            propertyKey
        )
    }
}
