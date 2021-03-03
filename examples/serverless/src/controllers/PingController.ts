import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { Controller, GET, Use } from "lambaa"
import logRequestMiddleware from "src/middleware/logRequestMiddleware"

@Controller()
export default class PingController {
    @GET("/ping")
    @Use(logRequestMiddleware)
    public ping(_event: APIGatewayProxyEvent): APIGatewayProxyResult {
        return {
            statusCode: 200,
            body: "pong",
        }
    }
}
