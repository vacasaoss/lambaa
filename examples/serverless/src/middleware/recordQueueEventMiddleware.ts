import { SQSEvent } from "aws-lambda"
import { MiddlewareFunction } from "lambaa"

const recordQueueEventMiddleware: MiddlewareFunction<SQSEvent, void> = async (
    event,
    context,
    next
) => {
    console.log(`Receivent event with ${event.Records.length} records`)
    return next(event, context)
}

export default recordQueueEventMiddleware
