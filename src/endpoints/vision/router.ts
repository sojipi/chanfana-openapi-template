import { Hono } from "hono";
import { fromHono } from "chanfana";
import { VisionCompletion } from "./visionCompletion";

export const visionRouter = fromHono(new Hono());

visionRouter.post("/completions", VisionCompletion);