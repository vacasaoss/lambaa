import getCoercionFn from "../coerce"
import { FROM_PATH_METADATA_KEY } from "../constants"
import { RequestOptions } from "../types"

/**
 * Extract a parameter from the API Gateway request resource path.
 * @category API Gateway Request Parameter Decorator
 */
export default function FromPath(
    name: string,
    options: Omit<RequestOptions, "required"> = {}
): ParameterDecorator {
    return (target: any, propertyKey: string | symbol, index: number): void => {
        const existing: any[] =
            Reflect.getOwnMetadata(
                FROM_PATH_METADATA_KEY,
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
            FROM_PATH_METADATA_KEY,
            existing,
            target,
            propertyKey
        )
    }
}
