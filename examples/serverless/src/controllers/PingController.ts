import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { Controller, GET, Use } from "lambaa"
import apiErrorHandlerMiddleware from "../middleware/apiErrorHandlerMiddleware"
import logRequestMiddleware from "../middleware/logRequestMiddleware"

@Controller(apiErrorHandlerMiddleware)
export default class PingController {
    /**
     * Handle `GET` `/ping` requests.
     */
    @GET("/ping")
    @Use(logRequestMiddleware)
    public ping(_event: APIGatewayProxyEvent): APIGatewayProxyResult {
        return {
            statusCode: 200,
            body: "pong",
        }
    }
}
