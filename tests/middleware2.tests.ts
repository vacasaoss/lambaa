import {
    APIGatewayProxyEvent,
    APIGatewayProxyResult,
    Context,
} from "aws-lambda"
import { expect } from "chai"
import Controller from "../src/decorators/Controller"
import { GET } from "../src/decorators/Route"
import Router from "../src/Router"
import { Handler, Middleware } from "../src/types"
import { createAPIGatewayEvent, createLambdaContext } from "./testUtil"

/**
 * Track execution events, e.g. middleware execution, post/pre-response.
 */
let events: string[] = []

const context = createLambdaContext()

class TestMiddleware implements Middleware {
    constructor(private name: string) {}
    public async invoke(
        event: APIGatewayProxyEvent,
        context: Context,
        next: Handler
    ): Promise<APIGatewayProxyResult> {
        expect(this).to.exist
        events.push(`middleware-${this.name}-pre`)
        const response = await next(event, context)
        events.push(`middleware-${this.name}-post`)
        return response
    }
}

// @Controller()
// class TestControllerWithSingleMiddleware {
//     @GET("")
//     public ping() {
//         events.push("controller-1")
//         return { statusCode: 200, body: "" }
//     }
// }

// @Controller()
// class TestControllerWithMultipleMiddleware {
//     @GET("")
//     public ping() {
//         events.push("controller-2")
//         return { statusCode: 200, body: "" }
//     }
// }

@Controller()
class TestControllerWithNoMiddleware1 {
    @GET("/testControllerWithNoMiddleware1Ping1")
    public ping1() {
        events.push("testControllerWithNoMiddleware1Ping1")
        return { statusCode: 200, body: "" }
    }

    @GET("/testControllerWithNoMiddleware1Ping2")
    public ping2() {
        events.push("testControllerWithNoMiddleware1Ping2")
        return { statusCode: 200, body: "" }
    }

    @GET("testControllerWithNoMiddleware1Ping3")
    public ping3() {
        events.push("testControllerWithNoMiddleware1Ping3")
        return { statusCode: 200, body: "" }
    }
}

describe("middleware tests", () => {
    afterEach(() => {
        events = []
    })

    // describe("API Gateway proxy mode", () => {})

    describe("router", () => {
        it("routes through single middleware", async () => {
            const event = createAPIGatewayEvent({
                method: "GET",
                resource: "testControllerWithNoMiddleware1Ping1",
            })

            const router = new Router()

            router.registerController(new TestControllerWithNoMiddleware1())
            router.registerMiddleware(new TestMiddleware("1"))

            const response = await router.route(event, context)

            expect(response.statusCode).to.equal(200)
            expect(response.body).to.equal("")
            expect(events.shift()).to.equal("middleware-1-pre")
            expect(events.shift()).to.equal("testControllerWithNoMiddleware1Ping1") // prettier-ignore
            expect(events.shift()).to.equal("middleware-1-post")
        })

        it("routes through multiple middleware", async () => {
            const event = createAPIGatewayEvent({
                method: "GET",
                resource: "testControllerWithNoMiddleware1Ping2",
            })

            const router = new Router()

            router.registerController(new TestControllerWithNoMiddleware1())
            router.registerMiddleware(new TestMiddleware("1"))
            router.registerMiddleware(new TestMiddleware("2"))
            router.registerMiddleware(new TestMiddleware("3"))

            const response = await router.route(event, context)

            expect(response.statusCode).to.equal(200)
            expect(response.body).to.equal("")
            expect(events.shift()).to.equal("middleware-1-pre")
            expect(events.shift()).to.equal("middleware-2-pre")
            expect(events.shift()).to.equal("middleware-3-pre")
            expect(events.shift()).to.equal("testControllerWithNoMiddleware1Ping2") // prettier-ignore
            expect(events.shift()).to.equal("middleware-3-post")
            expect(events.shift()).to.equal("middleware-2-post")
            expect(events.shift()).to.equal("middleware-1-post")
        })

        it("routes through multiple middleware when multiple controller registered", async () => {
            const event = createAPIGatewayEvent({
                method: "GET",
                resource: "testControllerWithNoMiddleware1Ping3",
            })

            const router = new Router()

            router.registerController(new TestControllerWithNoMiddleware1())
            router.registerMiddleware(new TestMiddleware("1"))
            router.registerMiddleware(new TestMiddleware("2"))
            router.registerMiddleware(new TestMiddleware("3"))

            const response = await router.route(event, context)

            expect(response.statusCode).to.equal(200)
            expect(response.body).to.equal("")
            expect(events.shift()).to.equal("middleware-1-pre")
            expect(events.shift()).to.equal("middleware-2-pre")
            expect(events.shift()).to.equal("middleware-3-pre")
            expect(events.shift()).to.equal("testControllerWithNoMiddleware1Ping3") // prettier-ignore
            expect(events.shift()).to.equal("middleware-3-post")
            expect(events.shift()).to.equal("middleware-2-post")
            expect(events.shift()).to.equal("middleware-1-post")
        })
    })

    // describe("decorator", () => {})

    // describe("router + decorator", () => {})
})
