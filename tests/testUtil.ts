/* eslint-disable @typescript-eslint/ban-types */
import { APIGatewayProxyEvent, Context, SQSEvent } from "aws-lambda"

export const createAPIGatewayEvent = ({
    body,
    resource,
    method,
    pathParameters,
    queryStringParameters,
    headers,
}: {
    body?: string
    resource?: string
    method?: string
    pathParameters?: { [name: string]: string }
    queryStringParameters?: { [name: string]: string }
    headers?: { [name: string]: string }
} = {}): APIGatewayProxyEvent => {
    const eventTemplate: APIGatewayProxyEvent = {
        resource: resource ?? "/test",
        path: "/v1",
        httpMethod: method ?? "GET",
        headers: {
            ...headers,
        },
        multiValueHeaders: {},
        queryStringParameters: queryStringParameters ?? null,
        multiValueQueryStringParameters: null,
        pathParameters: pathParameters ?? null,
        stageVariables: null,
        requestContext: {
            resourceId: "kdxer6",
            resourcePath: "/test",
            httpMethod: "GET",
            extendedRequestId: "test",
            requestTime: "test",
            path: "/test",
            accountId: "test",
            stage: "test",
            requestTimeEpoch: 1,
            requestId: "test",
            identity: {
                principalOrgId: null,
                cognitoIdentityPoolId: null,
                cognitoIdentityId: null,
                apiKey: "test",
                cognitoAuthenticationType: null,
                userArn: null,
                apiKeyId: "test",
                userAgent: "test",
                accountId: null,
                caller: null,
                sourceIp: "test",
                accessKey: null,
                cognitoAuthenticationProvider: null,
                user: null,
            },
            domainName: "test",
            apiId: "test",
            authorizer: {},
            protocol: "",
        },
        body: body ?? null,
        isBase64Encoded: false,
    }

    return eventTemplate
}

export const createSQSEvent = (...arns: string[]): SQSEvent => ({
    Records: arns.map((arn) => ({
        eventSourceARN: arn,
        messageId: "message_id",
        receiptHandle: "receipt_handle",
        body: "",
        attributes: {
            AWSTraceHeader: "",
            ApproximateReceiveCount: "",
            SentTimestamp: "",
            SenderId: "",
            ApproximateFirstReceiveTimestamp: "",
        },
        messageAttributes: {},
        md5OfBody: "",
        eventSource: "aws:sqs",
        awsRegion: "",
    })),
})

export const createLambdaContext = (): Context => ({
    awsRequestId: "1234",
    callbackWaitsForEmptyEventLoop: true,
    done: (): object => ({}),
    fail: (): object => ({}),
    functionName: "test",
    functionVersion: "1",
    getRemainingTimeInMillis: (): number => 1,
    invokedFunctionArn: "",
    logGroupName: "lg1",
    logStreamName: "ls1",
    memoryLimitInMB: "30",
    succeed: (): object => ({}),
})
