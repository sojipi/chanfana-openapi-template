import { Hono } from "hono";
import { fromHono } from "chanfana";
import { ImageGeneration } from "./imageGeneration";
import { TaskStatus } from "./taskStatus";

export const aigcRouter = fromHono(new Hono());

aigcRouter.post("/images/generations", ImageGeneration);
aigcRouter.get("/tasks/:task_id", TaskStatus);
