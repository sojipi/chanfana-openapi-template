import { OpenAPIRoute } from "chanfana";
import { AppContext } from "../../types";
import { z } from "zod";

export class TaskStatus extends OpenAPIRoute {
  public schema = {
    tags: ["AIGC"],
    summary: "查询 AIGC 任务状态",
    operationId: "task-status",
    request: {
      params: z.object({
        task_id: z.string()
      })
    },
    responses: {
      "200": {
        description: "返回任务状态信息",
        content: {
          "application/json": {
            schema: {
              success: z.boolean(),
              result: z.any()
            }
          }
        }
      }
    }
  };

  public async handle(c: AppContext) {
    const data = await this.getValidatedData<typeof this.schema>();
    
    const { task_id } = data.params;
    const apiKey = c.env.MODELSCOPE_API_KEY;
    
    if (!apiKey) {
      return c.json({ success: false, error: "缺少 ModelScope API 密钥" }, 400);
    }

    try {
      const response = await fetch(`https://api-inference.modelscope.cn/v1/tasks/${task_id}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "X-ModelScope-Task-Type": "image_generation"
        }
      });

      const result = await response.json();
      
      return {
        success: true,
        result
      };
    } catch (error) {
      console.error("任务状态查询错误:", error);
      return c.json({ success: false, error: "任务状态查询失败" }, 500);
    }
  }
}