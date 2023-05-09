import getCoercionFn from "../coerce"
import { FROM_QUERY_METADATA_KEY } from "../constants"
import { RequestParameterOptions } from "../types"

/**
 * Extract a parameter from the API Gateway request query string.
 * @category API Gateway Request Parameter Decorator
 */
export default function FromQuery(
    name: string,
    options: RequestParameterOptions = { required: true }
): ParameterDecorator {
    return (target: any, propertyKey: string | symbol, index: number): void => {
        const existing: any[] =
            Reflect.getOwnMetadata(
                FROM_QUERY_METADATA_KEY,
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
            FROM_QUERY_METADATA_KEY,
            existing,
            target,
            propertyKey
        )
    }
}
