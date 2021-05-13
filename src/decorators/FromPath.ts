import { FROM_PATH_METADATA_KEY } from "../constants"

/**
 * Extract a parameter from the request resource path.
 */
export default function FromPath<T = string>(name: string, options?: { coerce: (param: string) => T }): ParameterDecorator {
    return (target: any, propertyKey: string | symbol, index: number): void => {
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
