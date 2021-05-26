import { APIGatewayProxyEvent } from "aws-lambda"
import { ROUTE_ARGS_METADATA_KEY } from "../constants"

/**
 * Define a new parameter decorator.
 */
export default function DecodedParam<T>(
    func: (event: APIGatewayProxyEvent) => T
): () => ParameterDecorator {
    return () => (target: any, propertyKey: string | symbol, index: number) => {
        const existing: any[] =
            Reflect.getOwnMetadata(
                ROUTE_ARGS_METADATA_KEY,
                target,
                propertyKey
            ) ?? []
        existing.push({ index, func })
        Reflect.defineMetadata(
            ROUTE_ARGS_METADATA_KEY,
            existing,
            target,
            propertyKey
        )
    }
}
