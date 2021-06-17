import {
    APIGatewayProxyEvent,
    APIGatewayProxyResult,
    Context,
} from "aws-lambda"
import Router from "../src/Router"
import Route, { GET } from "../src/decorators/Route"
import {
    createLambdaContext,
    createAPIGatewayEvent,
    createAPIGatewayProxyEvent,
} from "./testUtil"
import { expect } from "chai"
import Controller from "../src/decorators/Controller"
import { Middleware, Handler, MiddlewareFunction } from "../src/types"
import Use from "../src/decorators/Use"

/**
 * Track execution events, e.g. middleware execution, post/pre-response.
 */
let events: string[] = []

class TestMiddleware implements Middleware {
    constructor(private name: string) {}

    public async invoke(
        event: APIGatewayProxyEvent,
        context: Context,
        next: Handler
    ): Promise<APIGatewayProxyResult> {
        expect(this).to.exist
        events.push(`${this.name}_pre_response`)
        const response = await next(event, context)
        events.push(`${this.name}_post_response`)
        return response
    }
}

class ReturnEarlyMiddleware implements Middleware {
    public async invoke(
        _event: APIGatewayProxyEvent,
        _context: Context,
        _next: Handler
    ): Promise<APIGatewayProxyResult> {
        events.push("return_early_middleware")
        return new Promise((res) =>
            res({
                statusCode: 200,
                body: "return_early_middleware",
            })
        )
    }
}

const getFunctionalMiddleware =
    (name: string): MiddlewareFunction =>
    async (event, context, next) => {
        events.push(`${name}_pre_response`)
        const response = await next(event, context)
        events.push(`${name}_post_response`)
        return response
    }

@Controller(new TestMiddleware("middleware_1"))
class TestControllerWithSingleMiddleware {
    @GET("/test-controller-with-single-middleware/test1")
    public async test1(): Promise<APIGatewayProxyResult> {
        events.push("test_controller_with_single_middleware_test_1")
        return {
            statusCode: 200,
            body: "test1",
        }
    }
}

@Controller({
    middleware: [
        new TestMiddleware("middleware_1"),
        new TestMiddleware("middleware_2"),
    ],
})
class TestControllerWithMultipleMiddleware {
    @GET("/test-controller-with-multiple-middleware/test1")
    public async test1(): Promise<APIGatewayProxyResult> {
        events.push("test_controller_with_multiple_middleware_test_1")
        return {
            statusCode: 200,
            body: "test1",
        }
    }
}

@Controller()
class TestController1 {
    @Route("GET", "/test1")
    public async test1(): Promise<APIGatewayProxyResult> {
        events.push("controller_1_test_1")
        return new Promise((res) =>
            setTimeout(
                () =>
                    res({
                        statusCode: 200,
                        body: "test1",
                    }),
                100
            )
        )
    }

    @Route("GET", "/test2")
    @Use(new TestMiddleware("middleware_1"))
    public async test2(): Promise<APIGatewayProxyResult> {
        events.push("controller_1_test_2")
        return new Promise((res) =>
            setTimeout(
                () =>
                    res({
                        statusCode: 200,
                        body: "test2",
                    }),
                100
            )
        )
    }

    @Route("GET", "/test3")
    @Use(new TestMiddleware("middleware_1"))
    @Use(new TestMiddleware("middleware_2"))
    public async test3(): Promise<APIGatewayProxyResult> {
        events.push("controller_1_test_3")
        return new Promise((res) =>
            setTimeout(
                () =>
                    res({
                        statusCode: 200,
                        body: "test3",
                    }),
                100
            )
        )
    }
}

@Controller({
    middleware: [
        getFunctionalMiddleware("middleware_controller_1"),
        getFunctionalMiddleware("middleware_controller_2"),
        new TestMiddleware("middleware_controller_3"),
    ],
})
class TestController4 {
    @Route("GET", "/test1")
    @Use(new TestMiddleware("middleware_decorator_1"))
    @Use(getFunctionalMiddleware("middleware_decorator_2"))
    @Use(getFunctionalMiddleware("middleware_decorator_3"))
    public async test1(): Promise<APIGatewayProxyResult> {
        expect(this).to.exist
        events.push("controller_4_test_1")
        return {
            statusCode: 200,
            body: "test1",
        }
    }
}

const context = createLambdaContext()

describe("middleware tests", () => {
    afterEach(() => {
        events = []
    })

    describe("API Gateway proxy mode", () => {
        it("routes through single middleware into proxy mode", async () => {
            const event = createAPIGatewayProxyEvent({
                path: "/test-controller-with-single-middleware/test1",
                method: "GET",
            })

            const router = new Router().registerController(
                new TestControllerWithSingleMiddleware()
            )

            const response = await router.route(event, context)

            expect(response.statusCode).to.equal(200)
            expect(response.body).to.equal("test1")
            expect(events.shift()).to.equal("middleware_1_pre_response")
            expect(events.shift()).to.equal("test_controller_with_single_middleware_test_1") // prettier-ignore
            expect(events.shift()).to.equal("middleware_1_post_response")
            expect(events.shift()).to.equal(undefined)
        })

        it("routes through single middleware applied using the @Controller() decorator", async () => {
            const event = createAPIGatewayProxyEvent({
                path: "/test-controller-with-single-middleware/test1",
                method: "GET",
            })

            const router = new Router().registerController(
                new TestControllerWithSingleMiddleware()
            )

            const response = await router.route(event, context)

            expect(response.statusCode).to.equal(200)
            expect(response.body).to.equal("test1")
            expect(events.shift()).to.equal("middleware_1_pre_response")
            expect(events.shift()).to.equal("test_controller_with_single_middleware_test_1") // prettier-ignore
            expect(events.shift()).to.equal("middleware_1_post_response")
            expect(events.shift()).to.equal(undefined)
        })

        it("routes through multiple middleware, applied using the @Controller() decorator and the Router", async () => {
            const event = createAPIGatewayProxyEvent({
                path: "/test-controller-with-single-middleware/test1",
                method: "GET",
            })

            const router = new Router()

            router.registerController(new TestControllerWithSingleMiddleware())
            router.registerMiddleware(new TestMiddleware("middleware_2"))

            const response = await router.route(event, context)

            expect(response.statusCode).to.equal(200)
            expect(response.body).to.equal("test1")
            expect(events.shift()).to.equal("middleware_1_pre_response")
            expect(events.shift()).to.equal("middleware_2_pre_response")
            expect(events.shift()).to.equal("test_controller_with_single_middleware_test_1") // prettier-ignore
            expect(events.shift()).to.equal("middleware_2_post_response")
            expect(events.shift()).to.equal("middleware_1_post_response")
            expect(events.shift()).to.equal(undefined)
        })
    })

    it("routes through multiple middlewares applied using the Router", async () => {
        const event = createAPIGatewayEvent({
            resource: "/test1",
            method: "GET",
        })

        const router = new Router()

        router.registerController(new TestController1())
        router.registerMiddleware(
            new TestMiddleware("middleware_1"),
            new TestMiddleware("middleware_2")
        )

        const response = await router.route(event, context)

        expect(response.statusCode).to.equal(200)
        expect(response.body).to.equal("test1")
        expect(events.shift()).to.equal("middleware_1_pre_response")
        expect(events.shift()).to.equal("middleware_2_pre_response")
        expect(events.shift()).to.equal("controller_1_test_1")
        expect(events.shift()).to.equal("middleware_2_post_response")
        expect(events.shift()).to.equal("middleware_1_post_response")
        expect(events.shift()).to.equal(undefined)
    })

    it("routes through multiple middlewares applied using decorators", async () => {
        const event = createAPIGatewayEvent({
            resource: "/test-controller-with-multiple-middleware/test1",
            method: "GET",
        })

        const router = new Router().registerController(
            new TestControllerWithMultipleMiddleware()
        )

        const response = await router.route(event, context)

        expect(response.statusCode).to.equal(200)
        expect(response.body).to.equal("test1")
        expect(events.shift()).to.equal("middleware_1_pre_response")
        expect(events.shift()).to.equal("middleware_2_pre_response")
        expect(events.shift()).to.equal("test_controller_with_multiple_middleware_test_1") // prettier-ignore
        expect(events.shift()).to.equal("middleware_2_post_response")
        expect(events.shift()).to.equal("middleware_1_post_response")
        expect(events.shift()).to.equal(undefined)
    })

    it("routes through multiple middlewares applied using the @Controller() decorator and Router", async () => {
        const event = createAPIGatewayEvent({
            resource: "/test-controller-with-multiple-middleware/test1",
            method: "GET",
        })

        const router = new Router()
            .registerController(new TestControllerWithMultipleMiddleware())
            .registerMiddleware(
                new TestMiddleware("middleware_3"),
                new TestMiddleware("middleware_4")
            )

        const response = await router.route(event, context)

        expect(response.statusCode).to.equal(200)
        expect(response.body).to.equal("test1")
        expect(events.shift()).to.equal("middleware_3_pre_response")
        expect(events.shift()).to.equal("middleware_4_pre_response")
        expect(events.shift()).to.equal("middleware_1_pre_response")
        expect(events.shift()).to.equal("middleware_2_pre_response")
        expect(events.shift()).to.equal("test_controller_with_multiple_middleware_test_1") // prettier-ignore
        expect(events.shift()).to.equal("middleware_2_post_response")
        expect(events.shift()).to.equal("middleware_1_post_response")
        expect(events.shift()).to.equal("middleware_4_post_response")
        expect(events.shift()).to.equal("middleware_3_post_response")
        expect(events.shift()).to.equal(undefined)
    })

    it("terminated request processing early if middleware returns response", async () => {
        const event = createAPIGatewayEvent({
            resource: "/test1",
            method: "GET",
        })

        const router = new Router()

        router.registerController(new TestController1())
        router.registerMiddleware(
            new TestMiddleware("middleware_1"),
            new ReturnEarlyMiddleware(),
            new TestMiddleware("middleware_2")
        )

        const response = await router.route(event, context)

        expect(response.statusCode).to.equal(200)
        expect(response.body).to.equal("return_early_middleware")
        expect(events.shift()).to.equal("middleware_1_pre_response")
        expect(events.shift()).to.equal("return_early_middleware")
        expect(events.shift()).to.equal("middleware_1_post_response")
        expect(events.shift()).to.equal(undefined)
    })

    it("routes through multiple middlewares setup using a mix of functional style and class style", async () => {
        const event = createAPIGatewayEvent({
            resource: "/test1",
            method: "GET",
        })

        const handler = new Router()
            .registerController(new TestController4())
            .registerMiddleware(new TestMiddleware("middleware_1"))
            .getHandler<APIGatewayProxyEvent, APIGatewayProxyResult>()

        const response = await handler(event, context)

        expect(response.statusCode).to.equal(200)
        expect(response.body).to.equal("test1")
        expect(events.shift()).to.equal("middleware_1_pre_response")
        expect(events.shift()).to.equal("middleware_controller_1_pre_response")
        expect(events.shift()).to.equal("middleware_controller_2_pre_response")
        expect(events.shift()).to.equal("middleware_controller_3_pre_response")
        expect(events.shift()).to.equal("middleware_decorator_1_pre_response")
        expect(events.shift()).to.equal("middleware_decorator_2_pre_response")
        expect(events.shift()).to.equal("middleware_decorator_3_pre_response")
        expect(events.shift()).to.equal("controller_4_test_1")
        expect(events.shift()).to.equal("middleware_decorator_3_post_response")
        expect(events.shift()).to.equal("middleware_decorator_2_post_response")
        expect(events.shift()).to.equal("middleware_decorator_1_post_response")
        expect(events.shift()).to.equal("middleware_controller_3_post_response")
        expect(events.shift()).to.equal("middleware_controller_2_post_response")
        expect(events.shift()).to.equal("middleware_controller_1_post_response")
        expect(events.shift()).to.equal("middleware_1_post_response")
        expect(events.shift()).to.equal(undefined)
    })
})
