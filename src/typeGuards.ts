import {
    APIGatewayProxyEvent,
    DynamoDBStreamEvent,
    ScheduledEvent,
    SQSEvent,
    KinesisStreamEvent,
    EventBridgeEvent,
    S3Event,
} from "aws-lambda"

export const isApiGatewayEvent = (
    event: unknown
): event is APIGatewayProxyEvent => {
    const e = event as APIGatewayProxyEvent
    return e.resource !== undefined && e.httpMethod !== undefined
}

export const isApiGatewayProxyEvent = (
    event: unknown
): event is APIGatewayProxyEvent => {
    const e = event as APIGatewayProxyEvent
    return e.resource?.includes("{proxy+}") || e.resource?.includes("{proxy*}")
}

export const isSqsEvent = (event: unknown): event is SQSEvent => {
    const e = event as SQSEvent
    return (
        e?.Records?.find(({ eventSource }) => eventSource === "aws:sqs") !==
        undefined
    )
}

export const isScheduledEvent = (event: unknown): event is ScheduledEvent => {
    const e = event as ScheduledEvent
    // https://docs.aws.amazon.com/lambda/latest/dg/services-cloudwatchevents.html
    return e?.["detail-type"]?.toLowerCase() === "scheduled event"
}

export const isDynamoDbStreamEvent = (
    event: unknown
): event is DynamoDBStreamEvent => {
    const e = event as DynamoDBStreamEvent
    return (
        e?.Records?.find(
            ({ eventSource }) => eventSource === "aws:dynamodb"
        ) !== undefined
    )
}

export const isKinesisStreamEvent = (
    event: unknown
): event is KinesisStreamEvent => {
    const e = event as DynamoDBStreamEvent
    return (
        e?.Records?.find(({ eventSource }) => eventSource === "aws:kinesis") !==
        undefined
    )
}

export const isEventBridgeEvent = (
    event: unknown
): event is EventBridgeEvent<string, unknown> => {
    const e = event as EventBridgeEvent<string, unknown>
    return e["detail-type"] !== undefined && e.source !== undefined
}

export const isS3event = (event: unknown): event is S3Event => {
    const e = event as S3Event
    return (
        e?.Records?.find(({ eventSource }) => eventSource === "aws:s3") !==
        undefined
    )
}
