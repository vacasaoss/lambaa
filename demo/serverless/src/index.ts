import { Router } from "lambaa"
import PingController from "@controllers/PingController"
import UsersController from "@controllers/UsersController"

const router = new Router({
    controllers: [new PingController(), new UsersController()],
})

export const handler = router.getHandler()
