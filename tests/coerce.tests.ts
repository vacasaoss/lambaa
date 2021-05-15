import { expect } from "chai"
import Controller from "../src/decorators/Controller"
import FromHeader from "../src/decorators/FromHeader"
import FromPath from "../src/decorators/FromPath"
import FromQuery from "../src/decorators/FromQuery"
import Route from "../src/decorators/Route"
import Router from "../src/Router"
import { createAPIGatewayEvent, createLambdaContext } from "./testUtil"

@Controller()
class TestController {
    @Route("GET", "from_path_test")
    public async fromPathTest(
        @FromPath("string") stringParam: string,
        @FromPath("number") numberParam: number,
        @FromPath("boolean") booleanParam: boolean,
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
        @FromQuery("boolean") booleanParam: boolean,
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
        @FromHeader("boolean") booleanParam: boolean,
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
}

const router = new Router({ controllers: [new TestController()] })
const context = createLambdaContext()

describe("request parsing tests", () => {
    const expected = JSON.stringify({
        string: "string",
        number: 5,
        boolean: true,
    })
    it("coerces path parameters", async () => {
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
        expect(response.body).to.deep.equal(expected)
    })

    it("coerces query string parameters", async () => {
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
        expect(response.body).to.deep.equal(expected)
    })

    it("coerces header values", async () => {
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
        expect(response.body).to.deep.equal(expected)
    })
})
