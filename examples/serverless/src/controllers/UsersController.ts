import { APIGatewayProxyResult } from "aws-lambda"
import { Controller, GET } from "lambaa"
import authorizationMiddleware from "src/middleware/authorizationMiddleware"

@Controller(authorizationMiddleware)
export default class UsersController {
    @GET("/users")
    public async getUsers(): Promise<APIGatewayProxyResult> {
        const users = await this.fetchUsers()

        return {
            statusCode: 200,
            body: JSON.stringify(users),
        }
    }

    private async fetchUsers() {
        return Promise.resolve([{ userId: 1, userName: "testuser" }])
    }
}
