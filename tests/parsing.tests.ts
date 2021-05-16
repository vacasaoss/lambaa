import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { expect } from "chai"
import Controller from "../src/decorators/Controller"
import FromBody from "../src/decorators/FromBody"
import FromHeader from "../src/decorators/FromHeader"
import FromPath from "../src/decorators/FromPath"
import FromQuery from "../src/decorators/FromQuery"
import Route from "../src/decorators/Route"
import Use from "../src/decorators/Use"
import RequestError from "../src/RequestError"
import Router from "../src/Router"
import { createAPIGatewayEvent, createLambdaContext } from "./testUtil"

@Controller()
class TestController {
    @Route("GET", "from_path_test")
    public async fromPathTest(
        @FromPath("string") stringParam: string,
        @FromPath("number") numberParam: number,
        @FromPath("boolean") booleanParam: boolean
    ) {
        expect(typeof stringParam).to.equal("string")
        expect(typeof numberParam).to.equal("number")
        expect(typeof booleanParam).to.equal("boolean")
        return {
            statusCode: 200,
            body: JSON.stringify({
                string: stringParam,
                number: numberParam,
                boolean: booleanParam,
            }),
        }
    }

    @Route("GET", "from_query_test")
    public async fromQueryTest(
        @FromQuery("string") stringParam: string,
        @FromQuery("number") numberParam: number,
        @FromQuery("boolean") booleanParam: boolean
    ) {
        expect(typeof stringParam).to.equal("string")
        expect(typeof numberParam).to.equal("number")
        expect(typeof booleanParam).to.equal("boolean")
        return {
            statusCode: 200,
            body: JSON.stringify({
                string: stringParam,
                number: numberParam,
                boolean: booleanParam,
            }),
        }
    }

    @Route("GET", "from_header_test")
    public async fromHeaderTest(
        @FromHeader("string") stringParam: string,
        @FromHeader("number") numberParam: number,
        @FromHeader("boolean") booleanParam: boolean
    ) {
        expect(typeof stringParam).to.equal("string")
        expect(typeof numberParam).to.equal("number")
        expect(typeof booleanParam).to.equal("boolean")
        return {
            statusCode: 200,
            body: JSON.stringify({
                string: stringParam,
                number: numberParam,
                boolean: booleanParam,
            }),
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
    it("extracts path parameter from request", async () => {
        const event = createAPIGatewayEvent({
            resource: "from_path_test",
            method: "GET",
            pathParameters: {
                string: "string",
                number: "5",
                boolean: "true",
            },
        })

        const response = await router.route(event, context)

        expect(response.statusCode).to.equal(200)
        expect(response.body).to.equal(
            JSON.stringify({
                string: "string",
                number: 5,
                boolean: true,
            })
        )
    })

    it("extracts query string parameter from request", async () => {
        const event = createAPIGatewayEvent({
            resource: "from_query_test",
            method: "GET",
            queryStringParameters: {
                string: "string",
                number: "5",
                boolean: "true",
            },
        })

        const response = await router.route(event, context)

        expect(response.statusCode).to.equal(200)
        expect(response.body).to.equal(
            JSON.stringify({
                string: "string",
                number: 5,
                boolean: true,
            })
        )
    })

    it("extracts header from request", async () => {
        const event = createAPIGatewayEvent({
            resource: "from_header_test",
            method: "GET",
            headers: {
                string: "string",
                number: "5",
                boolean: "true",
            },
        })

        const response = await router.route(event, context)

        expect(response.statusCode).to.equal(200)
        expect(response.body).to.equal(
            JSON.stringify({
                string: "string",
                number: 5,
                boolean: true,
            })
        )
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
