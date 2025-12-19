import { OpenAPIRoute, contentJson } from "chanfana";
import { AppContext } from "../../types";
import { z } from "zod";

export class TaskStatus extends OpenAPIRoute {
  public schema = {
    tags: ["AIGC"],
    summary: "查询任务状态",
    description: "查询AIGC任务的执行状态和结果",
    request: {
      params: z.object({
        task_id: z.string()
      })
    },
    responses: {
      "200": {
        description: "返回任务状态信息",
        ...contentJson(z.any())
      }
    }
  };

  public async handle(c: AppContext) {
    const data = await this.getValidatedData<typeof this.schema>();
    const taskId = data.params.task_id;
    const apiKey = c.env?.MODELSCOPE_API_KEY;

    if (!apiKey) {
      return c.json({ error: "ModelScope API key is missing" }, 400);
    }

    if (!taskId) {
      return c.json({ error: "Task ID is required" }, 400);
    }

    try {
      const response = await fetch(`https://api-inference.modelscope.cn/v1/tasks/${taskId}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "X-ModelScope-Task-Type": "image_generation"
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        return c.json({ error: errorData }, 500);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Task Status Error:", error);
      return c.json({ error: "Failed to get task status" }, 500);
    }
  }
}
