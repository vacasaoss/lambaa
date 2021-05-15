const getDefaultCoerce = (
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
        ? (param) => Number(param)
        : paramType === "Boolean"
        ? (param) => param.toLowerCase() === "true"
        : (param) => param
}

export default getDefaultCoerce
