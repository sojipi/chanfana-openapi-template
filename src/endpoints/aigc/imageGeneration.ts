import { contentJson, OpenAPIRoute } from "chanfana";
import { AppContext } from "../../types";
import { z } from "zod";

export class ImageGeneration extends OpenAPIRoute {
  public schema = {
    tags: ["AIGC"],
    summary: "AIGC 图像生成",
    operationId: "image-generation",
    request: {
      body: contentJson(
        z.object({
          model: z.string().default("Qwen/Qwen-Image"),
          prompt: z.string(),
          negative_prompt: z.string().optional(),
          loras: z.union([z.string(), z.record(z.string(), z.number())]).optional()
        })
      )
    },
    responses: {
      "200": {
        description: "返回图像生成任务结果",
        ...contentJson({
          success: z.boolean(),
          result: z.any()
        })
      }
    }
  };

  public async handle(c: AppContext) {
    const data = await this.getValidatedData<typeof this.schema>();
    
    const { model, prompt, negative_prompt, loras } = data.body;
    const apiKey = c.env.MODELSCOPE_API_KEY;
    
    if (!apiKey) {
      return c.json({ success: false, error: "缺少 ModelScope API 密钥" }, 400);
    }

    try {
      const response = await fetch("https://api-inference.modelscope.cn/v1/images/generations", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "X-ModelScope-Async-Mode": "true"
        },
        body: JSON.stringify({ model, prompt, negative_prompt, loras })
      });

      const result = await response.json();
      
      return {
        success: true,
        result
      };
    } catch (error) {
      console.error("图像生成错误:", error);
      return c.json({ success: false, error: "图像生成失败" }, 500);
    }
  }
}