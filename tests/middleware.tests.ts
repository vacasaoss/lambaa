import {
    APIGatewayProxyEvent,
    APIGatewayProxyResult,
    Context,
} from "aws-lambda"
import { expect } from "chai"
import Controller from "../src/decorators/Controller"
import { GET } from "../src/decorators/Route"
import Use from "../src/decorators/Use"
import Router from "../src/Router"
import { Handler, Middleware } from "../src/types"
import {
    createAPIGatewayEvent,
    createAPIGatewayProxyEvent,
    createLambdaContext,
} from "./testUtil"

/**
 * Track execution events, e.g. middleware execution, post/pre-response.
 */
let events: (
    | `middleware-${string}-pre`
    | `middleware-${string}-post`
    | `testController${string}`
)[] = []

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

class TestMiddlewareReturns implements Middleware {
    public async invoke(
        _event: APIGatewayProxyEvent,
        _context: Context,
        _next: Handler
    ): Promise<APIGatewayProxyResult> {
        expect(this).to.exist
        events.push(`middleware-returns-pre`)
        return { statusCode: 200, body: "" }
    }
}

@Controller(new TestMiddleware("1"))
class TestControllerWithSingleMiddleware1 {
    @GET("testControllerWithSingleMiddleware1Ping1")
    public ping1() {
        events.push("testControllerWithSingleMiddleware1Ping1")
        return { statusCode: 200, body: "" }
    }

    @GET("testControllerWithSingleMiddleware1Ping2")
    public ping2() {
        events.push("testControllerWithSingleMiddleware1Ping2")
        return { statusCode: 200, body: "" }
    }

    @GET("testControllerWithUseMiddleware")
    @Use(new TestMiddleware("2"))
    public ping3() {
        events.push("testControllerWithUseMiddleware")
        return { statusCode: 200, body: "" }
    }
}

@Controller(async (event, context, next) => {
    events.push("middleware-functional-pre")
    const response = await next(event, context)
    events.push("middleware-functional-post")
    return response
})
class TestControllerWithFunctionalMiddleware {
    @GET("testControllerWithFuncionalMiddlewarePing1")
    public ping1() {
        events.push("testControllerWithFuncionalMiddlewarePing1")
        return { statusCode: 200, body: "" }
    }
}

@Controller([
    new TestMiddleware("1"),
    new TestMiddleware("2"),
    new TestMiddleware("3"),
])
class TestControllerWithMultipleMiddleware1 {
    @GET("testControllerWithMultipleMiddleware1Ping1")
    public ping1() {
        events.push("testControllerWithMultipleMiddleware1Ping1")
        return { statusCode: 200, body: "" }
    }
}

@Controller([
    new TestMiddleware("1"),
    new TestMiddleware("2"),
    new TestMiddleware("3"),
    new TestMiddlewareReturns(),
])
class TestControllerWithReturnEarlyMiddleware {
    @GET("testControllerWithReturnEarlyMiddlewarePing1")
    public ping1() {
        events.push("testControllerWithReturnEarlyMiddlewarePing1")
        return { statusCode: 200, body: "" }
    }
}

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

@Controller()
class TestControllerWithNoMiddleware2 {
    @GET("/testControllerWithNoMiddleware2Ping1")
    public ping1() {
        events.push("testControllerWithNoMiddleware2Ping1")
        return { statusCode: 200, body: "" }
    }
}

describe("middleware tests", () => {
    afterEach(() => {
        events = []
    })

    describe("router.registerMiddleware(...)", () => {
        it("routes through single middleware", async () => {
            const event = createAPIGatewayEvent({
                method: "GET",
                resource: "testControllerWithNoMiddleware1Ping1",
            })

            const router = new Router()
                .registerController(new TestControllerWithNoMiddleware1())
                .registerMiddleware(new TestMiddleware("1"))

            const response = await router.route(event, context)

            expect(response.statusCode).to.equal(200)
            expect(response.body).to.equal("")
            expect(events.shift()).to.equal("middleware-1-pre")
            expect(events.shift()).to.equal("testControllerWithNoMiddleware1Ping1") // prettier-ignore
            expect(events.shift()).to.equal("middleware-1-post")
            expect(events.shift()).to.be.undefined
        })

        it("routes through single middleware into proxy mode", async () => {
            const event = createAPIGatewayProxyEvent({
                method: "GET",
                path: "/testControllerWithNoMiddleware1Ping1",
            })

            const router = new Router()
                .registerController(new TestControllerWithNoMiddleware1())
                .registerMiddleware(new TestMiddleware("1"))

            const response = await router.route(event, context)

            expect(response.statusCode).to.equal(200)
            expect(response.body).to.equal("")
            expect(events.shift()).to.equal("middleware-1-pre")
            expect(events.shift()).to.equal("testControllerWithNoMiddleware1Ping1") // prettier-ignore
            expect(events.shift()).to.equal("middleware-1-post")
            expect(events.shift()).to.be.undefined
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
            expect(events.shift()).to.be.undefined
        })

        it("routes through multiple middleware when multiple controllers are registered", async () => {
            const event = createAPIGatewayEvent({
                method: "GET",
                resource: "testControllerWithNoMiddleware2Ping1",
            })

            const router = new Router()
                .registerController(new TestControllerWithNoMiddleware1())
                .registerController(new TestControllerWithNoMiddleware2())
                .registerMiddleware(new TestMiddleware("1"))
                .registerMiddleware(new TestMiddleware("2"))
                .registerMiddleware(new TestMiddleware("3"))

            const response = await router.route(event, context)

            expect(response.statusCode).to.equal(200)
            expect(response.body).to.equal("")
            expect(events.shift()).to.equal("middleware-1-pre")
            expect(events.shift()).to.equal("middleware-2-pre")
            expect(events.shift()).to.equal("middleware-3-pre")
            expect(events.shift()).to.equal("testControllerWithNoMiddleware2Ping1") // prettier-ignore
            expect(events.shift()).to.equal("middleware-3-post")
            expect(events.shift()).to.equal("middleware-2-post")
            expect(events.shift()).to.equal("middleware-1-post")
            expect(events.shift()).to.be.undefined
        })

        it("executes middleware pipeline even if no route is found", async () => {
            const event = createAPIGatewayEvent({
                method: "GET",
                resource: "notFound",
            })

            const router = new Router()
                .registerController(new TestControllerWithNoMiddleware1())
                .registerMiddleware(new TestMiddleware("1"))
                .registerMiddleware(new TestMiddleware("2"))
                .registerMiddleware(new TestMiddleware("3"))
                .registerMiddleware(new TestMiddleware("4"))

            // This middleware terminate the pipeline early, before the controller method lookup happens
            router.registerMiddleware(new TestMiddlewareReturns())

            const response = await router.route(event, context)

            expect(response.statusCode).to.equal(200)
            expect(response.body).to.equal("")
            expect(events.shift()).to.equal("middleware-1-pre")
            expect(events.shift()).to.equal("middleware-2-pre")
            expect(events.shift()).to.equal("middleware-3-pre")
            expect(events.shift()).to.equal("middleware-4-pre")
            expect(events.shift()).to.equal("middleware-returns-pre")
            expect(events.shift()).to.equal("middleware-4-post")
            expect(events.shift()).to.equal("middleware-3-post")
            expect(events.shift()).to.equal("middleware-2-post")
            expect(events.shift()).to.equal("middleware-1-post")
            expect(events.shift()).to.be.undefined
        })
    })

    describe("@Controller([...])", () => {
        it("routes through single middleware", async () => {
            const event = createAPIGatewayEvent({
                resource: "testControllerWithSingleMiddleware1Ping1",
                method: "GET",
            })

            const router = new Router().registerController(
                new TestControllerWithSingleMiddleware1()
            )

            const response = await router.route(event, context)

            expect(response.statusCode).to.equal(200)
            expect(response.body).to.equal("")
            expect(events.shift()).to.equal("middleware-1-pre")
            expect(events.shift()).to.equal("testControllerWithSingleMiddleware1Ping1") // prettier-ignore
            expect(events.shift()).to.equal("middleware-1-post")
        })

        it("routes through multiple middleware", async () => {
            const event = createAPIGatewayEvent({
                resource: "testControllerWithMultipleMiddleware1Ping1",
                method: "GET",
            })

            const router = new Router().registerController(
                new TestControllerWithMultipleMiddleware1()
            )

            const response = await router.route(event, context)

            expect(response.statusCode).to.equal(200)
            expect(response.body).to.equal("")
            expect(events.shift()).to.equal("middleware-1-pre")
            expect(events.shift()).to.equal("middleware-2-pre")
            expect(events.shift()).to.equal("middleware-3-pre")
            expect(events.shift()).to.equal("testControllerWithMultipleMiddleware1Ping1") // prettier-ignore
            expect(events.shift()).to.equal("middleware-3-post")
            expect(events.shift()).to.equal("middleware-2-post")
            expect(events.shift()).to.equal("middleware-1-post")
        })

        it("returns early from controller middleware", async () => {
            const event = createAPIGatewayEvent({
                method: "GET",
                resource: "testControllerWithReturnEarlyMiddlewarePing1",
            })

            const router = new Router().registerController(
                new TestControllerWithReturnEarlyMiddleware()
            )

            const response = await router.route(event, context)

            expect(response.statusCode).to.equal(200)
            expect(response.body).to.equal("")
            expect(events.shift()).to.equal("middleware-1-pre")
            expect(events.shift()).to.equal("middleware-2-pre")
            expect(events.shift()).to.equal("middleware-3-pre")
            expect(events.shift()).to.equal("middleware-returns-pre")
            expect(events.shift()).to.equal("middleware-3-post")
            expect(events.shift()).to.equal("middleware-2-post")
            expect(events.shift()).to.equal("middleware-1-post")
        })

        it("routes through middleware applied using the functional style", async () => {
            const event = createAPIGatewayEvent({
                resource: "testControllerWithFuncionalMiddlewarePing1",
                method: "GET",
            })

            const router = new Router()
                .registerController(new TestControllerWithFunctionalMiddleware())
                .registerMiddleware(new TestMiddleware("1")) // prettier-ignore

            const response = await router.route(event, context)

            expect(response.statusCode).to.equal(200)
            expect(response.body).to.equal("")
            expect(events.shift()).to.equal("middleware-1-pre")
            expect(events.shift()).to.equal("middleware-functional-pre")
            expect(events.shift()).to.equal("testControllerWithFuncionalMiddlewarePing1") // prettier-ignore
            expect(events.shift()).to.equal("middleware-functional-post")
            expect(events.shift()).to.equal("middleware-1-post")
            expect(events.shift()).to.be.undefined
        })
    })

    describe("router.registerMiddleware(...) + @Controller(...)", () => {
        it("routes through multiple middleware", async () => {
            const event = createAPIGatewayEvent({
                resource: "testControllerWithMultipleMiddleware1Ping1",
                method: "GET",
            })

            const router = new Router()
                .registerController(new TestControllerWithMultipleMiddleware1())
                .registerMiddleware(new TestMiddleware("4"))
                .registerMiddleware(new TestMiddleware("5"))

            const response = await router.route(event, context)

            expect(response.statusCode).to.equal(200)
            expect(response.body).to.equal("")

            // Routes through router middleware first
            expect(events.shift()).to.equal("middleware-4-pre")
            expect(events.shift()).to.equal("middleware-5-pre")

            // Next routes through controller middleware
            expect(events.shift()).to.equal("middleware-1-pre")
            expect(events.shift()).to.equal("middleware-2-pre")
            expect(events.shift()).to.equal("middleware-3-pre")

            expect(events.shift()).to.equal("testControllerWithMultipleMiddleware1Ping1") // prettier-ignore

            // Back through controller middleware
            expect(events.shift()).to.equal("middleware-3-post")
            expect(events.shift()).to.equal("middleware-2-post")
            expect(events.shift()).to.equal("middleware-1-post")

            // Back through router middleware
            expect(events.shift()).to.equal("middleware-5-post")
            expect(events.shift()).to.equal("middleware-4-post")
            expect(events.shift()).to.be.undefined
        })

        it("routes through multiple middleware into proxy mode", async () => {
            const event = createAPIGatewayProxyEvent({
                path: "/testControllerWithMultipleMiddleware1Ping1",
                method: "GET",
            })

            const router = new Router()
                .registerController(new TestControllerWithMultipleMiddleware1())
                .registerMiddleware(new TestMiddleware("4"))
                .registerMiddleware(new TestMiddleware("5"))

            const response = await router.route(event, context)

            expect(response.statusCode).to.equal(200)
            expect(response.body).to.equal("")

            // Routes through router middleware first
            expect(events.shift()).to.equal("middleware-4-pre")
            expect(events.shift()).to.equal("middleware-5-pre")

            // Next routes through controller middleware
            expect(events.shift()).to.equal("middleware-1-pre")
            expect(events.shift()).to.equal("middleware-2-pre")
            expect(events.shift()).to.equal("middleware-3-pre")

            expect(events.shift()).to.equal("testControllerWithMultipleMiddleware1Ping1") // prettier-ignore

            // Back through controller middleware
            expect(events.shift()).to.equal("middleware-3-post")
            expect(events.shift()).to.equal("middleware-2-post")
            expect(events.shift()).to.equal("middleware-1-post")

            // Back through router middleware
            expect(events.shift()).to.equal("middleware-5-post")
            expect(events.shift()).to.equal("middleware-4-post")
            expect(events.shift()).to.be.undefined
        })

        it("returns early from middleware registered using the router", async () => {
            const event = createAPIGatewayEvent({
                resource: "testControllerWithSingleMiddleware1Ping1",
                method: "GET",
            })

            const router = new Router()
                .registerController(new TestControllerWithSingleMiddleware1())
                .registerMiddleware(new TestMiddleware("2"))
                .registerMiddleware(new TestMiddleware("3"))
                .registerMiddleware(new TestMiddlewareReturns())

            const response = await router.route(event, context)

            expect(response.statusCode).to.equal(200)
            expect(response.body).to.equal("")
            expect(events.shift()).to.equal("middleware-2-pre")
            expect(events.shift()).to.equal("middleware-3-pre")
            expect(events.shift()).to.equal("middleware-returns-pre")
            expect(events.shift()).to.equal("middleware-3-post")
            expect(events.shift()).to.equal("middleware-2-post")
            expect(events.shift()).to.be.undefined
        })

        it("returns early from middleware registered using the controller decorator", async () => {
            const event = createAPIGatewayEvent({
                resource: "testControllerWithReturnEarlyMiddlewarePing1",
                method: "GET",
            })

            const router = new Router()

            router.registerController(
                new TestControllerWithReturnEarlyMiddleware()
            )

            router
                .registerMiddleware(new TestMiddleware("4"))
                .registerMiddleware(new TestMiddleware("5"))

            const response = await router.route(event, context)

            expect(response.statusCode).to.equal(200)
            expect(response.body).to.equal("")
            expect(events.shift()).to.equal("middleware-4-pre")
            expect(events.shift()).to.equal("middleware-5-pre")
            expect(events.shift()).to.equal("middleware-1-pre")
            expect(events.shift()).to.equal("middleware-2-pre")
            expect(events.shift()).to.equal("middleware-3-pre")
            expect(events.shift()).to.equal("middleware-returns-pre")
            expect(events.shift()).to.equal("middleware-3-post")
            expect(events.shift()).to.equal("middleware-2-post")
            expect(events.shift()).to.equal("middleware-1-post")
            expect(events.shift()).to.equal("middleware-5-post")
            expect(events.shift()).to.equal("middleware-4-post")
            expect(events.shift()).to.be.undefined
        })
    })

    describe("router.registerMiddleware(...) + @Controller(...) + @Use(...)", () => {
        it("routes through multiple middleware", async () => {
            const event = createAPIGatewayEvent({
                resource: "testControllerWithUseMiddleware",
                method: "GET",
            })

            const router = new Router()
                .registerController(new TestControllerWithSingleMiddleware1())
                .registerMiddleware(new TestMiddleware("3"))

            const response = await router.route(event, context)

            expect(response.statusCode).to.equal(200)
            expect(response.body).to.equal("")
            expect(events.shift()).to.equal("middleware-3-pre")
            expect(events.shift()).to.equal("middleware-1-pre")
            expect(events.shift()).to.equal("middleware-2-pre")
            expect(events.shift()).to.equal("testControllerWithUseMiddleware") // prettier-ignore
            expect(events.shift()).to.equal("middleware-2-post")
            expect(events.shift()).to.equal("middleware-1-post")
            expect(events.shift()).to.equal("middleware-3-post")
            expect(events.shift()).to.be.undefined
        })
    })

    it("receives middleware context when added to router using .registerMiddleware(...)", async () => {
        const event = createAPIGatewayEvent({
            method: "GET",
            resource: "testControllerWithNoMiddleware1Ping1",
        })

        const router = new Router()
            .registerController(new TestControllerWithNoMiddleware1())
            .registerMiddleware(
                async (event, context, next, middlewareContext) => {
                    expect(middlewareContext).to.exist
                    expect(middlewareContext?.controller).to.exist
                    expect(middlewareContext?.method).to.equal("ping1")
                    return next(event, context)
                }
            )

        const response = await router.route(event, context)

        expect(response.statusCode).to.equal(200)
    })

    it("receives middleware context when added to method  using @Use(...)", async () => {
        const event = createAPIGatewayEvent({
            method: "GET",
            resource: "ping",
        })

        @Controller()
        class TestController {
            @Use(async (event, context, next, middlewareContext) => {
                expect(middlewareContext).to.exist
                expect(middlewareContext?.controller).to.exist
                expect(middlewareContext?.method).to.equal("ping")
                return next(event, context)
            })
            @GET("/ping")
            public ping(): APIGatewayProxyResult {
                return { statusCode: 200, body: "" }
            }
        }

        const router = new Router().registerController(new TestController())

        const response = await router.route(event, context)

        expect(response.statusCode).to.equal(200)
    })
})
