/* eslint-disable @typescript-eslint/ban-types */
import {
    APIGatewayProxyEvent,
    Context,
    DynamoDBStreamEvent,
    EventBridgeEvent,
    KinesisStreamEvent,
    S3Event,
    ScheduledEvent,
    SNSEvent,
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
    isBase64Encoded,
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
                clientCert: null,
            },
            domainName: "test",
            apiId: "test",
            authorizer: {},
            protocol: "",
        },
        body: body ?? null,
        isBase64Encoded: isBase64Encoded ?? false,
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

export const createDynamoDbStreamEvent = (
    ...tableArns: string[]
): DynamoDBStreamEvent => ({
    Records: tableArns.map((tableArn) => ({
        eventID: "a61438b745710c58893214a3ce02ced7",
        eventName: "INSERT",
        eventVersion: "1.1",
        eventSource: "aws:dynamodb",
        awsRegion: "us-west-2",
        dynamodb: {
            ApproximateCreationDateTime: 1645747230,
            Keys: { hk: { S: "test" } },
            NewImage: { test: { S: "test" } },
            SequenceNumber: "516800000000013117674582",
            SizeBytes: 559,
            StreamViewType: "NEW_IMAGE",
        },
        eventSourceARN: `${tableArn}/stream/2022-02-24T22:37:34.890`,
    })),
})

export const createKinesisStreamEvent = (
    ...tableArns: string[]
): KinesisStreamEvent => ({
    Records: tableArns.map((tableArn) => ({
        kinesis: {
            partitionKey: "partitionKey-03",
            kinesisSchemaVersion: "1.0",
            data: "SGVsbG8sIHRoaXMgaXMgYSB0ZXN0IDEyMy4=",
            sequenceNumber:
                "49545115243490985018280067714973144582180062593244200961",
            approximateArrivalTimestamp: 1428537600,
        },
        eventSource: "aws:kinesis",
        eventID:
            "shardId-000000000000:49545115243490985018280067714973144582180062593244200961",
        invokeIdentityArn: "arn:aws:iam::EXAMPLE",
        eventVersion: "1.0",
        eventName: "aws:kinesis:record",
        eventSourceARN: `${tableArn}`,
        awsRegion: "us-east-1",
    })),
})

export const createEventBridgeEvent = (
    source: string,
    detailType: string
): EventBridgeEvent<string, unknown> => ({
    source,
    "detail-type": detailType,
    version: "0",
    id: "fe8d3c65-xmpl-c5c3-2c87-81584709a377",
    account: "123456789012",
    time: "2020-04-28T07:20:20Z",
    region: "us-east-2",
    resources: ["arn:aws:rds:us-east-2:123456789012:db:rdz6xmpliljlb1"],
    detail: {
        EventCategories: ["backup"],
        SourceType: "DB_INSTANCE",
        SourceArn: "arn:aws:rds:us-east-2:123456789012:db:rdz6xmpliljlb1",
        Date: "2020-04-28T07:20:20.112Z",
        Message: "Finished DB Instance backup",
        SourceIdentifier: "rdz6xmpliljlb1",
    },
})

export const createS3Event = (arn: string): S3Event => ({
    Records: [
        {
            eventVersion: "2.1",
            eventSource: "aws:s3",
            awsRegion: "us-east-2",
            eventTime: "2019-09-03T19:37:27.192Z",
            eventName: "ObjectCreated:Put",
            userIdentity: {
                principalId: "AWS:AIDAINPONIXQXHT3IKHL2",
            },
            requestParameters: {
                sourceIPAddress: "205.255.255.255",
            },
            responseElements: {
                "x-amz-request-id": "D82B88E5F771F645",
                "x-amz-id-2":
                    "vlR7PnpV2Ce81l0PRw6jlUpck7Jo5ZsQjryTjKlc5aLWGVHPZLj5NeC6qMa0emYBDXOo6QBU0Wo=",
            },
            s3: {
                s3SchemaVersion: "1.0",
                configurationId: "828aa6fc-f7b5-4305-8584-487c791949c1",
                bucket: {
                    arn,
                    name: "DOC-EXAMPLE-BUCKET",
                    ownerIdentity: {
                        principalId: "A3I5XTEXAMAI3E",
                    },
                },
                object: {
                    key: "b21b84d653bb07b05b1e6b33684dc11b",
                    size: 1305107,
                    eTag: "b21b84d653bb07b05b1e6b33684dc11b",
                    sequencer: "0C0F6F405D6ED209E1",
                },
            },
        },
    ],
})

export const createSNSEvent = (arn: string): SNSEvent => ({
    Records: [
        {
            EventVersion: "1.0",
            EventSubscriptionArn:
                "arn:aws:sns:us-east-1:123456789012:sns-lambda:21be56ed-a058-49f5-8c98-aedd2564c486",
            EventSource: "aws:sns",
            Sns: {
                SignatureVersion: "1",
                Timestamp: "2019-01-02T12:45:07.000Z",
                Signature:
                    "tcc6faL2yUC6dgZdmrwh1Y4cGa/ebXEkAi6RibDsvpi+tE/1+82j...65r==",
                SigningCertUrl:
                    "https://sns.us-east-1.amazonaws.com/SimpleNotificationService-ac565b8b1a6c5d002d285f9598aa1d9b.pem",
                MessageId: "95df01b4-ee98-5cb9-9903-4c221d41eb5e",
                Message: "Hello from SNS!",
                MessageAttributes: {
                    Test: {
                        Type: "String",
                        Value: "TestString",
                    },
                    TestBinary: {
                        Type: "Binary",
                        Value: "TestBinary",
                    },
                },
                Type: "Notification",
                UnsubscribeUrl:
                    "https://sns.us-east-1.amazonaws.com/?Action=Unsubscribe&amp;SubscriptionArn=arn:aws:sns:us-east-1:123456789012:test-lambda:21be56ed-a058-49f5-8c98-aedd2564c486",
                TopicArn: arn,
                Subject: "TestInvoke",
            },
        },
    ],
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
