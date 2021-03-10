import { SQSEvent } from "aws-lambda"
import { Controller, SQS } from "lambaa"
import recordQueueEventMiddleware from "src/middleware/recordQueueEventMiddleware"

@Controller(recordQueueEventMiddleware)
export default class QueueController {
    /**
     * Handle events coming from the example SQS queue.
     */
    @SQS(process.env.EXAMPLE_QUEUE_ARN)
    public async receiveQueueEvent(_event: SQSEvent): Promise<void> {
        console.log("Received queue event")
    }
}
