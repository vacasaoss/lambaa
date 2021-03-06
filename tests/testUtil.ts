/* eslint-disable @typescript-eslint/ban-types */
import {
    APIGatewayProxyEvent,
    ScheduledEvent,
    Context,
    SQSEvent,
} from "aws-lambda"
import { APIGatewayEventFactoryArgs } from "./types"

export const createAPIGatewayEvent = ({
    body,
    resource,
    method,
    pathParameters,
    queryStringParameters,
    headers,
}: APIGatewayEventFactoryArgs = {}): APIGatewayProxyEvent => {
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

export const createAPIGatewayProxyEvent = (
    args: APIGatewayEventFactoryArgs
): APIGatewayProxyEvent => {
    const event = createAPIGatewayEvent(args)
    return {
        ...event,
        path: args.path as string,
        pathParameters: {},
        resource: "{proxy+}",
    }
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

export const createScheduledEvent = (...arns: string[]): ScheduledEvent => ({
    version: "0",
    account: "123456789012",
    region: "us-east-2",
    detail: {},
    "detail-type": "Scheduled Event",
    source: "aws.events",
    time: "2019-03-01T01:23:45Z",
    id: "cdc73f9d-aea9-11e3-9d5a-835b769c0d9c",
    resources: arns,
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
