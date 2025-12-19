import { Hono } from "hono";
import { fromHono } from "chanfana";
import { LLMCompletion } from "./llmCompletion";

export const llmRouter = fromHono(new Hono());

llmRouter.post("/completions", LLMCompletion);