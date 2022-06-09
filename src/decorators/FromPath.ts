import { FROM_PATH_METADATA_KEY } from "../constants"

/**
 * Extract a parameter from the API Gateway request resource path.
 * @category API Gateway Request Decorator
 */
export default function FromPath(name: string): ParameterDecorator {
    return (target: any, propertyKey: string | symbol, index: number): void => {
        const existing: any[] =
            Reflect.getOwnMetadata(
                FROM_PATH_METADATA_KEY,
                target,
                propertyKey
            ) ?? []

        existing.push({ name, index })

        Reflect.defineMetadata(
            FROM_PATH_METADATA_KEY,
            existing,
            target,
            propertyKey
        )
    }
}
