import {
    APIGatewayProxyEvent,
    APIGatewayProxyResult,
    DynamoDBStreamEvent,
    EventBridgeEvent,
    KinesisStreamEvent,
    S3Event,
    ScheduledEvent,
    SNSEvent,
    SQSEvent,
} from "aws-lambda"
import { expect } from "chai"
import sinon, { assert } from "sinon"
import Controller from "../src/decorators/Controller"
import Route, {
    API,
    DELETE,
    DynamoDB,
    EventBridge,
    GET,
    Kinesis,
    PATCH,
    POST,
    PUT,
    S3,
    Schedule,
    SNS,
    SQS,
} from "../src/decorators/Route"
import Router from "../src/Router"
import RouterError from "../src/RouterError"
import {
    createAPIGatewayEvent,
    createAPIGatewayProxyEvent,
    createDynamoDbStreamEvent,
    createEventBridgeEvent,
    createKinesisStreamEvent,
    createLambdaContext as createLambdaContext,
    createS3Event,
    createScheduledEvent,
    createSNSEvent,
    createSQSEvent,
} from "./testUtil"

@Controller()
class TestController {
    @GET("test1")
    public test1(): Promise<APIGatewayProxyResult> {
        return new Promise((res) =>
            res({
                statusCode: 200,
                body: "test1",
            })
        )
    }

    @GET("/test2")
    public async test2(): Promise<APIGatewayProxyResult> {
        return {
            statusCode: 200,
            body: "test2",
        }
    }

    @POST("/test3")
    public async test3(
        event: APIGatewayProxyEvent
    ): Promise<APIGatewayProxyResult> {
        return {
            statusCode: 200,
            body: event.body ?? "",
        }
    }

    @DELETE("/test4")
    public async test4(): Promise<APIGatewayProxyResult> {
        return {
            statusCode: 200,
            body: "test4",
        }
    }

    @PATCH("/test5")
    public async test5(): Promise<APIGatewayProxyResult> {
        return {
            statusCode: 200,
            body: "test5",
        }
    }

    @PUT("/test6")
    public async test6(): Promise<APIGatewayProxyResult> {
        return {
            statusCode: 200,
            body: "test6",
        }
    }

    @SQS("arn:123")
    public async testSqs1(sqsEvent: SQSEvent): Promise<void> {
        expect(sqsEvent.Records).not.to.be.empty
        const record = sqsEvent.Records.find(
            ({ eventSourceARN }) => eventSourceARN === "arn:123"
        )
        expect(record?.eventSourceARN).to.equal("arn:123")
    }

    @SQS("arn:234")
    public async testSqs2(sqsEvent: SQSEvent): Promise<void> {
        expect(sqsEvent.Records).not.to.be.empty
        const record = sqsEvent.Records.find(
            ({ eventSourceARN }) => eventSourceARN === "arn:234"
        )
        expect(record?.eventSourceARN).to.equal("arn:234")
    }

    @Schedule("arn:123/schedule")
    public async testScheduled1(scheduledEvent: ScheduledEvent): Promise<void> {
        expect(scheduledEvent["detail-type"].toLowerCase()).to.equal(
            "scheduled event"
        )
        expect(scheduledEvent?.resources).to.include("arn:123/schedule")
    }

    @Schedule("arn:234/schedule")
    public async testScheduled2(scheduledEvent: ScheduledEvent): Promise<void> {
        expect(scheduledEvent["detail-type"].toLowerCase()).to.equal(
            "scheduled event"
        )
        expect(scheduledEvent?.resources).to.include("arn:234/schedule")
    }

    @DynamoDB("arn:aws:dynamodb:us-east-1:123:table/table-name")
    public async testDynamoDbStream1(
        dynamoDbStreamEvent: DynamoDBStreamEvent
    ): Promise<void> {
        expect(dynamoDbStreamEvent.Records.length).to.be.greaterThan(0)
        expect(dynamoDbStreamEvent.Records[0].eventSourceARN).to.equal(
            "arn:aws:dynamodb:us-east-1:123:table/table-name/stream/2022-02-24T22:37:34.890"
        )
    }

    @Kinesis("arn:aws:kinesis:us-east-1:123:test")
    public async testKinesisStream1(
        kinesisStreamEvent: KinesisStreamEvent
    ): Promise<void> {
        expect(kinesisStreamEvent.Records.length).to.be.greaterThan(0)
        expect(kinesisStreamEvent.Records[0].eventSourceARN).to.equal(
            "arn:aws:kinesis:us-east-1:123:test"
        )
    }

    @EventBridge("aws.rds", "RDS DB Instance Event")
    public async testEventBridgeEvent(
        eventBridgeEvent: EventBridgeEvent<string, unknown>
    ): Promise<void> {
        expect(eventBridgeEvent.source).to.equal("aws.rds")
        expect(eventBridgeEvent["detail-type"]).to.equal(
            "RDS DB Instance Event"
        )
    }

    @S3("arn:aws:s3:::123")
    public async testS3(s3Event: S3Event): Promise<void> {
        expect(s3Event.Records).not.to.be.empty
        expect(
            s3Event.Records.find(
                (record) => record.s3.bucket.arn === "arn:aws:s3:::123"
            )?.s3.bucket.arn
        ).to.equal("arn:aws:s3:::123")
    }

    @SNS("arn:aws:sns:123")
    public async testSns(snsEvent: SNSEvent): Promise<void> {
        expect(snsEvent.Records).not.to.be.empty
        expect(
            snsEvent.Records.find(
                (record) => record.Sns.TopicArn === "arn:aws:sns:123"
            )?.Sns.TopicArn
        ).to.equal("arn:aws:sns:123")
    }
}

@Controller("/test")
class TestController2 {
    @Route("GET", "/7")
    public async test7() {
        return {
            statusCode: 200,
            body: "test7",
        }
    }

    @Route("GET", "8")
    public async test8() {
        return {
            statusCode: 200,
            body: "test8",
        }
    }
}

@Controller("test")
class TestController3 {
    @Route("GET", "/9")
    public async test9(
        _event: APIGatewayProxyEvent
    ): Promise<APIGatewayProxyResult> {
        return {
            statusCode: 200,
            body: "test9",
        }
    }

    @API("GET", "10")
    public async test10(): Promise<APIGatewayProxyResult> {
        return {
            statusCode: 200,
            body: "test10",
        }
    }

    @API("PUT", "10")
    public async test10PUT(): Promise<APIGatewayProxyResult> {
        return {
            statusCode: 200,
            body: "test10PUT",
        }
    }

    @API("POST", "10")
    public async test10POST(): Promise<APIGatewayProxyResult> {
        return {
            statusCode: 200,
            body: "test10POST",
        }
    }
}

const router = new Router().registerControllers([
    new TestController(),
    new TestController2(),
    new TestController3(),
])

const handler = router.getHandler<APIGatewayProxyEvent, APIGatewayProxyResult>()
const context = createLambdaContext()

describe("routing tests", () => {
    afterEach(() => {
        process.env = {}
        sinon.restore()
    })

    it("routes http get event when method returns promise", async () => {
        const event = createAPIGatewayEvent({
            resource: "/test1",
            method: "GET",
        })

        const response = await handler(event, context)

        expect(response.statusCode).to.equal(200)
        expect(response.body).to.equal("test1")
    })

    it("routes http get event", async () => {
        const event = createAPIGatewayEvent({
            resource: "/test2",
            method: "GET",
        })

        const response = await handler(event, context)

        expect(response.statusCode).to.equal(200)
        expect(response.body).to.equal("test2")
    })

    it("routes http post event", async () => {
        const event = createAPIGatewayEvent({
            resource: "/test3",
            method: "POST",
            body: "test",
        })

        const response = await handler(event, context)

        expect(response.statusCode).to.equal(200)
        expect(response.body).to.equal("test")
    })

    it("routes http delete event", async () => {
        const event = createAPIGatewayEvent({
            resource: "/test4",
            method: "DELETE",
        })

        const response = await handler(event, context)

        expect(response.statusCode).to.equal(200)
        expect(response.body).to.equal("test4")
    })

    it("routes http patch event", async () => {
        const event = createAPIGatewayEvent({
            resource: "/test5",
            method: "PATCH",
        })

        const response = await handler(event, context)

        expect(response.statusCode).to.equal(200)
        expect(response.body).to.equal("test5")
    })

    it("routes http put event", async () => {
        const event = createAPIGatewayEvent({
            resource: "/test6",
            method: "PUT",
        })

        const response = await handler(event, context)

        expect(response.statusCode).to.equal(200)
        expect(response.body).to.equal("test6")
    })

    it("throws error if no route is configured", async () => {
        const event = createAPIGatewayEvent({
            resource: "/wrong",
            method: "GET",
        })

        await expect(handler(event, context)).to.eventually.be.rejected
    })

    it("throws router error if no route is found", async () => {
        try {
            const event = createAPIGatewayEvent({
                resource: "/wrong",
                method: "GET",
            })

            await handler(event, context)
        } catch (err) {
            expect(err).instanceOf(RouterError)
            return
        }

        assert.fail("Expected error to be thrown")
    })

    it("logs debug message", async () => {
        const consoleDebugStub = sinon.stub(console, "debug")
        process.env.DEBUG = "true"
        const event = createAPIGatewayEvent({
            resource: "/test1",
            method: "GET",
        })

        const response = await handler(event, context)

        expect(response.statusCode).to.equal(200)
        expect(consoleDebugStub).to.be.calledOnce
    })

    it("routes http request when base path is defined on controller", async () => {
        const event = createAPIGatewayEvent({
            resource: "/test/7",
            method: "GET",
        })

        const response = await handler(event, context)

        expect(response.statusCode).to.equal(200)
        expect(response.body).to.equal("test7")
    })

    describe("it routes http get request when base path is defined on controller", () => {
        it("routes when method route has leading /", async () => {
            const event = createAPIGatewayEvent({
                resource: "/test/7",
                method: "GET",
            })

            const response = await handler(event, context)

            expect(response.statusCode).to.equal(200)
            expect(response.body).to.equal("test7")
        })

        it("routes when method route has no leading /", async () => {
            const event = createAPIGatewayEvent({
                resource: "/test/8",
                method: "GET",
            })

            const response = await handler(event, context)

            expect(response.statusCode).to.equal(200)
            expect(response.body).to.equal("test8")
        })

        it("routes when base path route has leading /", async () => {
            const event = createAPIGatewayEvent({
                resource: "/test/9",
                method: "GET",
            })

            const response = await handler(event, context)

            expect(response.statusCode).to.equal(200)
            expect(response.body).to.equal("test9")
        })

        it("routes when base path route has no leading /", async () => {
            const event = createAPIGatewayEvent({
                resource: "/test/10",
                method: "GET",
            })

            const response = await handler(event, context)

            expect(response.statusCode).to.equal(200)
            expect(response.body).to.equal("test10")
        })

        it("routes when basePath is included on proxy event", async () => {
            const event = createAPIGatewayProxyEvent({
                path: "/test/10",
                method: "GET",
            })

            const response = await handler(event, context)

            expect(response.statusCode).to.equal(200)
            expect(response.body).to.equal("test10")
        })

        it("routes PUT method when basePath is included on proxy event", async () => {
            const event = createAPIGatewayProxyEvent({
                path: "/test/10",
                method: "PUT",
            })

            const response = await handler(event, context)

            expect(response.statusCode).to.equal(200)
            expect(response.body).to.equal("test10PUT")
        })

        it("routes POST method when basePath is included on proxy event", async () => {
            const event = createAPIGatewayProxyEvent({
                path: "/test/10",
                method: "POST",
            })

            const response = await handler(event, context)

            expect(response.statusCode).to.equal(200)
            expect(response.body).to.equal("test10POST")
        })
    })

    describe("it routes SQS events", () => {
        it("routes event", async () => {
            const event = createSQSEvent("arn:123")
            const response = await router.route(event, context)
            expect(response).to.be.undefined
        })

        it("throws error if there is no handler for this arn", async () => {
            const event = createSQSEvent("arn:wrong")
            await expect(router.route(event, context)).to.eventually.be.rejected
        })

        it("routes event with multiple records", async () => {
            const event = createSQSEvent("arn:abc", "arn:234", "arn:123")
            const response = await router.route(event, context)
            expect(response).to.be.undefined
        })
    })

    describe("it routes Scheduled events", () => {
        it("routes event", async () => {
            const event = createScheduledEvent("arn:123/schedule")
            const response = await router.route(event, context)
            expect(response).to.be.undefined
        })

        it("throws error if there is no handler for this arn", async () => {
            const event = createScheduledEvent("arn:wrong")
            await expect(router.route(event, context)).to.eventually.be.rejected
        })

        it("routes event with multiple resources", async () => {
            const event = createScheduledEvent(
                "arn:abc",
                "arn:234/schedule",
                "arn:123/schedule"
            )
            const response = await router.route(event, context)
            expect(response).to.be.undefined
        })
    })

    describe("routes Dynamo DB stream events", () => {
        it("routes event", async () => {
            const event = createDynamoDbStreamEvent(
                "arn:aws:dynamodb:us-east-1:123:table/table-name"
            )

            const response = await router.route(event, context)
            expect(response).to.be.undefined
        })

        it("throws error if there is no handler for this arn", async () => {
            const event = createDynamoDbStreamEvent("arn:wrong")
            await expect(router.route(event, context)).to.eventually.be.rejected
        })
    })

    describe("routes Kinesis stream events", () => {
        it("routes event", async () => {
            const event = createKinesisStreamEvent(
                "arn:aws:kinesis:us-east-1:123:test"
            )

            const response = await router.route(event, context)
            expect(response).to.be.undefined
        })

        it("throws error if there is no handler for this arn", async () => {
            const event = createKinesisStreamEvent("arn:wrong")
            await expect(router.route(event, context)).to.eventually.be.rejected
        })
    })

    describe("routes EventBridge events", () => {
        it("routes event", async () => {
            const event = createEventBridgeEvent(
                "aws.rds",
                "RDS DB Instance Event"
            )

            const response = await router.route(event, context)
            expect(response).to.be.undefined
        })

        it("throws error if there is no handler for this source", async () => {
            const event = createEventBridgeEvent("aws.sns", "SNS Event")
            await expect(router.route(event, context)).to.eventually.be.rejected
        })
    })

    describe("routes S3 events", () => {
        it("routes event", async () => {
            const event = createS3Event("arn:aws:s3:::123")
            const response = await router.route(event, context)
            expect(response).to.be.undefined
        })

        it("throws error if there is no handler for this arn", async () => {
            const event = createS3Event("arn:aws:s3:::wrong")
            await expect(router.route(event, context)).to.eventually.be.rejected
        })
    })

    describe("routes SNS events", () => {
        it("routes event", async () => {
            const event = createSNSEvent("arn:aws:sns:123")
            const response = await router.route(event, context)
            expect(response).to.be.undefined
        })

        it("throws error if there is no handler for this arn", async () => {
            const event = createSNSEvent("arn:aws:sns:wrong")
            await expect(router.route(event, context)).to.eventually.be.rejected
        })
    })
})
