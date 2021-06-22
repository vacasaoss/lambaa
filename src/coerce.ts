import RequestError from "./RequestError"

const getCoercionFn = (
    target: any,
    propertyKey: string | symbol,
    index: number
): ((param: string) => unknown) => {
    const paramType = Reflect.getMetadata(
        "design:paramtypes",
        target,
        propertyKey
    )[index].name
    return paramType === "Number"
        ? coerceNumber
        : paramType === "Boolean"
        ? (param) => param.toLowerCase() === "true"
        : (param) => param
}

const coerceNumber = (param: string) => {
    const result = Number(param)
    if (Number.isNaN(result)) {
        throw new RequestError({
            code: "INVALID_REQUEST_DATA",
            message:
                "An error occurred coercing request parameters - parameter is NaN",
        })
    }

    return result
}

export default getCoercionFn
