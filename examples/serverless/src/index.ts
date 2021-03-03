import { Router } from "lambaa"
import PingController from "@controllers/PingController"
import UsersController from "@controllers/UsersController"
import errorHandlerMiddleware from "./middleware/errorHandlerMiddleware"

const router = new Router({
    controllers: [new PingController(), new UsersController()],
    middleware: [errorHandlerMiddleware],
})

export const handler = router.getHandler()
