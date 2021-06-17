import {
    APIGatewayProxyEvent,
    APIGatewayProxyResult,
    Context,
} from "aws-lambda"
import { expect } from "chai"
import Controller from "../src/decorators/Controller"
import Route from "../src/decorators/Route"
import Router from "../src/Router"
import { Handler, Middleware } from "../src/types"
import { createAPIGatewayProxyEvent, createLambdaContext } from "./testUtil"

// const testControllerWithNoMiddleware = "test_controller_with_no_middleware"
const testControllerWithMiddleware = "/test-controller-with-middleware"

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

// @Controller()
// class TestControllerWithNoMiddleware {
//     @Route("GET", testControllerWithNoMiddleware)
//     public ping() {
//         events.push(testControllerWithNoMiddleware)
//         return testControllerWithNoMiddleware
//     }
// }

@Controller(new TestMiddleware("middleware-1"))
class TestControllerWithMiddleware {
    @Route("GET", testControllerWithMiddleware)
    public ping() {
        events.push(testControllerWithMiddleware)
        return testControllerWithMiddleware
    }
}

const context = createLambdaContext()

describe("middleware tests", () => {
    afterEach(() => {
        events = []
    })

    describe("proxy mode", () => {
        it("routes through single middleware into proxy mode", async () => {
            const event = createAPIGatewayProxyEvent({
                path: testControllerWithMiddleware,
                method: "GET",
            })

            const router = new Router().registerController(
                new TestControllerWithMiddleware()
            )

            const response = await router.route(event, context)
            expect(response).to.equal(testControllerWithMiddleware)
            expect(events.shift()).to.equal("middleware-1-pre-response")
            expect(events.shift()).to.equal(testControllerWithMiddleware)
            expect(events.shift()).to.equal("middleware-1-post-response")
            expect(events.shift()).to.equal(undefined)
        })
    })
})
