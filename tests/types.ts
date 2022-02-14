export interface APIGatewayEventFactoryArgs {
    body?: string
    resource?: string
    method?: string
    pathParameters?: { [name: string]: string }
    queryStringParameters?: { [name: string]: string }
    headers?: { [name: string]: string }
    path?: string
    isBase64Encoded?: boolean
}
