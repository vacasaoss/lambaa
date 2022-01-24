import { Router } from "lambaa"
import PingController from "@controllers/PingController"
import UsersController from "@controllers/UsersController"
import QueueController from "@controllers/QueueController"
import errorLoggerMiddleware from "./middleware/errorLoggerMiddleware"

const router = new Router().registerControllers([
        new PingController(),
        new UsersController(),
        new QueueController(),
]).registerMiddleware(
    errorLoggerMiddleware
);

export const handler = router.getHandler()
