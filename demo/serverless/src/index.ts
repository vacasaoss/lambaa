import { Router } from "lambaa";
import PingController from "./controllers/PingController";

const router = new Router({ controllers: [new PingController()] });

export const handler = router.getHandler();
