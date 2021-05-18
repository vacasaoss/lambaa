import {
    APIGatewayProxyEvent,
    APIGatewayProxyResult,
    ScheduledEvent,
    SQSEvent,
} from "aws-lambda"
import { expect } from "chai"
import sinon from "sinon"
import Controller from "../src/decorators/Controller"
import Route, {
    API,
    DELETE,
    GET,
    PATCH,
    POST,
    PUT,
    Schedule,
    SQS,
} from "../src/decorators/Route"
import Router from "../src/Router"
import {
    createAPIGatewayEvent,
    createLambdaContext as createLambdaContext,
    createScheduledEvent,
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
}

const router = new Router({
    controllers: [
        new TestController(),
        new TestController2(),
        new TestController3(),
    ],
})

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

        it("rotues when base path route has leading /", async () => {
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
})
