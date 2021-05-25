import Route from "../src/decorators/Route"
import FromPath from "../src/decorators/FromPath"
import FromQuery from "../src/decorators/FromQuery"
import FromBody from "../src/decorators/FromBody"
import FromHeader from "../src/decorators/FromHeader"
import Router from "../src/Router"
import { createLambdaContext, createAPIGatewayEvent , createAPIGatewayProxyEvent} from "./testUtil"
import { expect } from "chai"
import RequestError from "../src/RequestError"
import Controller from "../src/decorators/Controller"
import Use from "../src/decorators/Use"
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"

@Controller()
class TestController {
    @Route("GET", "from_path_test")
    public async fromPathTest(@FromPath("test") test: string) {
        return {
            statusCode: 200,
            body: test,
        }
    }

    // sorry about this, our proxy implementation doesn't not support snake cased urls at the moment
    @Route("GET", "from-path-proxy-test/{test}")
    public async fromPathProxyTest(@FromPath("test") test: string) {
        return {
            statusCode: 200,
            body: test,
        }
    }

    @Route("GET", "from_query_test")
    public async fromQueryTest(@FromQuery("test") test: string) {
        return {
            statusCode: 200,
            body: test,
        }
    }

    @Route("GET", "from_header_test")
    public async fromHeaderTest(@FromHeader("test") test: string) {
        return {
            statusCode: 200,
            body: test,
        }
    }

    @Route("GET", "from_body_test")
    public async fromBodyTest(@FromBody() body: unknown) {
        return {
            statusCode: 200,
            body: JSON.stringify(body),
        }
    }

    @Route("GET", "use_middleware_test")
    @Use<APIGatewayProxyEvent, APIGatewayProxyResult>({
        invoke: async (event, context, next) => {
            expect(event).to.have.property("resource")
            expect(event).to.have.property("httpMethod")
            const response = await next(event, context)
            expect(response).to.have.property("statusCode")
            expect(response).to.have.property("body")
            return response
        },
    })
    public async useMiddlewareTest(@FromQuery("test") test: string) {
        return {
            statusCode: 200,
            body: test,
        }
    }

    @Route("GET", "use_middleware_modify_test")
    @Use<APIGatewayProxyEvent, APIGatewayProxyResult>(
        async (event, context, next) => {
            event.queryStringParameters = { test: "modified" }
            const response = await next(event, context)
            expect(response.statusCode).to.equal(200)
            return response
        }
    )
    public async useMiddlewareModifyTest(@FromQuery("test") test: string) {
        return {
            statusCode: 200,
            body: test,
        }
    }
}

const router = new Router({ controllers: [new TestController()] })
const context = createLambdaContext()

describe("request parsing tests", () => {

    it("extracts path parameter from proxy request", async () => {
        const event = createAPIGatewayProxyEvent({
            path: "/from-path-proxy-test/test_path_param",
            method: "GET",
        })

        const response = await router.route(event, context)

        expect(response.statusCode).to.equal(200)
        expect(response.body).to.equal("test_path_param")
    })
    
    it("extracts path parameter from request", async () => {
        const event = createAPIGatewayEvent({
            resource: "from_path_test",
            method: "GET",
            pathParameters: {
                test: "test_path_param",
            },
        })

        const response = await router.route(event, context)

        expect(response.statusCode).to.equal(200)
        expect(response.body).to.equal("test_path_param")
    })

    it("extracts query string parameter from request", async () => {
        const event = createAPIGatewayEvent({
            resource: "from_query_test",
            method: "GET",
            queryStringParameters: {
                test: "test_query_param",
            },
        })

        const response = await router.route(event, context)

        expect(response.statusCode).to.equal(200)
        expect(response.body).to.equal("test_query_param")
    })

    it("extracts header from request", async () => {
        const event = createAPIGatewayEvent({
            resource: "from_header_test",
            method: "GET",
            headers: {
                test: "test_header",
            },
        })

        const response = await router.route(event, context)

        expect(response.statusCode).to.equal(200)
        expect(response.body).to.equal("test_header")
    })

    it("extracts JSON body from request", async () => {
        const event = createAPIGatewayEvent({
            resource: "from_body_test",
            method: "GET",
            body: JSON.stringify({ test: true }),
        })

        const response = await router.route(event, context)

        expect(response.statusCode).to.equal(200)
        expect(JSON.parse(response.body)).to.eql({ test: true })
    })

    it("throws error if path parameter is not provided", async () => {
        const event = createAPIGatewayEvent({
            resource: "from_path_test",
            method: "GET",
        })

        await expect(
            router.route(event, context)
        ).to.eventually.be.rejectedWith(RequestError)
    })

    it("throws error if query parameter is not provided", async () => {
        const event = createAPIGatewayEvent({
            resource: "from_query_test",
            method: "GET",
        })

        await expect(
            router.route(event, context)
        ).to.eventually.be.rejectedWith(RequestError)
    })

    it("throws error if header is not provided", async () => {
        const event = createAPIGatewayEvent({
            resource: "from_header_test",
            method: "GET",
        })

        await expect(
            router.route(event, context)
        ).to.eventually.be.rejectedWith(RequestError)
    })

    it("throws error if body is not provided", async () => {
        const event = createAPIGatewayEvent({
            resource: "from_body_test",
            method: "GET",
        })

        await expect(
            router.route(event, context)
        ).to.eventually.be.rejectedWith(RequestError)
    })

    it("passes correct args to controller when using middleware", async () => {
        const event = createAPIGatewayEvent({
            resource: "use_middleware_test",
            method: "GET",
            queryStringParameters: {
                test: "test",
            },
        })

        const response = await router.route(event, context)

        expect(response.statusCode).to.equal(200)
        expect(response.body).to.equal("test")
    })

    it("passes correct args to controller when event is modified using middleware", async () => {
        const event = createAPIGatewayEvent({
            resource: "use_middleware_modify_test",
            method: "GET",
            queryStringParameters: {
                test: "test",
            },
        })

        const response = await router.route(event, context)

        expect(response.statusCode).to.equal(200)
        expect(response.body).to.equal("modified")
    })
})
