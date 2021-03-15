import {
    APIGatewayProxyEvent,
    APIGatewayProxyResult,
    Context,
} from "aws-lambda"
import Router from "../src/Router"
import Route from "../src/decorators/Route"
import { createLambdaContext, createAPIGatewayEvent } from "./testUtil"
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

const getFunctionalMiddleware = (name: string): MiddlewareFunction => async (
    event,
    context,
    next
) => {
    events.push(`${name}_pre_response`)
    const response = await next(event, context)
    events.push(`${name}_post_response`)
    return response
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

@Controller(new TestMiddleware("middleware_1"))
class TestController2 {
    @Route("GET", "/test1")
    public async test1(): Promise<APIGatewayProxyResult> {
        events.push("controller_2_test1")
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
}

@Controller({
    middleware: [
        new TestMiddleware("middleware_base_class_1"),
        new TestMiddleware("middleware_base_class_2"),
    ],
})
class TestController3 {
    @Route("GET", "/test1")
    public async test1(): Promise<APIGatewayProxyResult> {
        events.push("controller_3_test_1")
        return {
            statusCode: 200,
            body: "test1",
        }
    }

    @Route("GET", "/test2")
    @Use(new TestMiddleware("middleware_decorator_1"))
    @Use(new TestMiddleware("middleware_decorator_2"))
    public async test2(): Promise<APIGatewayProxyResult> {
        events.push("controller_3_test_2")
        return {
            statusCode: 200,
            body: "test2",
        }
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

    it("routes through single middleware applied in the constructor", async () => {
        const event = createAPIGatewayEvent({
            resource: "/test1",
            method: "GET",
        })

        const router = new Router({
            controllers: [new TestController1()],
            middleware: [new TestMiddleware("middleware_1")],
        })

        const response = await router.route(event, context)

        expect(response.statusCode).to.equal(200)
        expect(response.body).to.equal("test1")
        expect(events.shift()).to.equal("middleware_1_pre_response")
        expect(events.shift()).to.equal("controller_1_test_1")
        expect(events.shift()).to.equal("middleware_1_post_response")
        expect(events.shift()).to.equal(undefined)
    })

    it("routes through single middleware applied using the decorator", async () => {
        const event = createAPIGatewayEvent({
            resource: "/test2",
            method: "GET",
        })

        const router = new Router({
            controllers: [new TestController1()],
        })

        const response = await router.route(event, context)

        expect(response.statusCode).to.equal(200)
        expect(response.body).to.equal("test2")
        expect(events.shift()).to.equal("middleware_1_pre_response")
        expect(events.shift()).to.equal("controller_1_test_2")
        expect(events.shift()).to.equal("middleware_1_post_response")
        expect(events.shift()).to.equal(undefined)
    })

    it("routes through single middleware applied using the controller base class constructor", async () => {
        const event = createAPIGatewayEvent({
            resource: "/test1",
            method: "GET",
        })

        const router = new Router({
            controllers: [new TestController2()],
        })

        const response = await router.route(event, context)

        expect(response.statusCode).to.equal(200)
        expect(response.body).to.equal("test1")
        expect(events.shift()).to.equal("middleware_1_pre_response")
        expect(events.shift()).to.equal("controller_2_test1")
        expect(events.shift()).to.equal("middleware_1_post_response")
        expect(events.shift()).to.equal(undefined)
    })

    it("routes through multiple middlewares applied in the constructor", async () => {
        const event = createAPIGatewayEvent({
            resource: "/test1",
            method: "GET",
        })

        const router = new Router({
            controllers: [new TestController1()],
            middleware: [
                new TestMiddleware("middleware_1"),
                new TestMiddleware("middleware_2"),
            ],
        })

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
            resource: "/test3",
            method: "GET",
        })

        const router = new Router({
            controllers: [new TestController1()],
        })

        const response = await router.route(event, context)

        expect(response.statusCode).to.equal(200)
        expect(response.body).to.equal("test3")
        expect(events.shift()).to.equal("middleware_1_pre_response")
        expect(events.shift()).to.equal("middleware_2_pre_response")
        expect(events.shift()).to.equal("controller_1_test_3")
        expect(events.shift()).to.equal("middleware_2_post_response")
        expect(events.shift()).to.equal("middleware_1_post_response")
        expect(events.shift()).to.equal(undefined)
    })

    it("routes through multiple middlewares applied using the controller base class constructor", async () => {
        const event = createAPIGatewayEvent({
            resource: "/test1",
            method: "GET",
        })

        const router = new Router({
            controllers: [new TestController3()],
        })

        const response = await router.route(event, context)

        expect(response.statusCode).to.equal(200)
        expect(response.body).to.equal("test1")
        expect(events.shift()).to.equal("middleware_base_class_1_pre_response")
        expect(events.shift()).to.equal("middleware_base_class_2_pre_response")
        expect(events.shift()).to.equal("controller_3_test_1")
        expect(events.shift()).to.equal("middleware_base_class_2_post_response")
        expect(events.shift()).to.equal("middleware_base_class_1_post_response")
        expect(events.shift()).to.equal(undefined)
    })

    it("routes through multiple middlewares applied using the constructor, decorator, and base class constructor", async () => {
        const event = createAPIGatewayEvent({
            resource: "/test2",
            method: "GET",
        })

        const router = new Router({
            controllers: [new TestController3()],
            middleware: [
                new TestMiddleware("middleware_constructor_1"),
                new TestMiddleware("middleware_constructor_2"),
            ],
        })

        const response = await router.route(event, context)

        expect(response.statusCode).to.equal(200)
        expect(response.body).to.equal("test2")
        expect(events.shift()).to.equal("middleware_constructor_1_pre_response")
        expect(events.shift()).to.equal("middleware_constructor_2_pre_response")
        expect(events.shift()).to.equal("middleware_base_class_1_pre_response")
        expect(events.shift()).to.equal("middleware_base_class_2_pre_response")
        expect(events.shift()).to.equal("middleware_decorator_1_pre_response")
        expect(events.shift()).to.equal("middleware_decorator_2_pre_response")
        expect(events.shift()).to.equal("controller_3_test_2")
        expect(events.shift()).to.equal("middleware_decorator_2_post_response")
        expect(events.shift()).to.equal("middleware_decorator_1_post_response")
        expect(events.shift()).to.equal("middleware_base_class_2_post_response")
        expect(events.shift()).to.equal("middleware_base_class_1_post_response")
        expect(events.shift()).to.equal(
            "middleware_constructor_2_post_response"
        )
        expect(events.shift()).to.equal(
            "middleware_constructor_1_post_response"
        )
        expect(events.shift()).to.equal(undefined)
    })

    it("terminated request processing early if middleware returns response", async () => {
        const event = createAPIGatewayEvent({
            resource: "/test1",
            method: "GET",
        })

        const router = new Router({
            controllers: [new TestController1()],
            middleware: [
                new TestMiddleware("middleware_1"),
                new ReturnEarlyMiddleware(),
                new TestMiddleware("middleware_2"),
            ],
        })

        const response = await router.route(event, context)

        expect(response.statusCode).to.equal(200)
        expect(response.body).to.equal("return_early_middleware")
        expect(events.shift()).to.equal("middleware_1_pre_response")
        expect(events.shift()).to.equal("return_early_middleware")
        expect(events.shift()).to.equal("middleware_1_post_response")
        expect(events.shift()).to.equal(undefined)
    })

    it("routes through correct middleware when multiple registrations are provided to router constructor", async () => {
        const event = createAPIGatewayEvent({
            resource: "/test1",
            method: "GET",
        })

        const handler = new Router(
            {
                controllers: [new TestController1()],
                middleware: [new TestMiddleware("middleware_1")],
            },
            {
                controllers: [new TestController2()],
                middleware: [new TestMiddleware("middleware_2")],
            }
        ).getHandler<APIGatewayProxyEvent, APIGatewayProxyResult>()

        const response = await handler(event, context)

        expect(response.statusCode).to.equal(200)
        expect(response.body).to.equal("test1")
        expect(events.shift()).to.equal("middleware_1_pre_response")
        expect(events.shift()).to.equal("controller_1_test_1")
        expect(events.shift()).to.equal("middleware_1_post_response")
        expect(events.shift()).to.equal(undefined)
    })

    it("routes through multiple middlewares setup using a mix of functional style and class style", async () => {
        const event = createAPIGatewayEvent({
            resource: "/test1",
            method: "GET",
        })

        const handler = new Router({
            controllers: [new TestController4()],
            middleware: [new TestMiddleware("middleware_1")],
        }).getHandler<APIGatewayProxyEvent, APIGatewayProxyResult>()

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
