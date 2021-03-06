import { APIGatewayProxyEvent, ScheduledEvent, SQSEvent } from "aws-lambda"

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
    return e.resource?.includes("{proxy+}")
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
