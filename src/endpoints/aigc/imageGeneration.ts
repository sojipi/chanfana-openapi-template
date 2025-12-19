import { z } from "zod";
import { OpenAPIRoute, contentJson } from "chanfana";
import { AppContext } from "../../types";

export class ImageGeneration extends OpenAPIRoute {
  public schema = {
    tags: ["AIGC"],
    summary: "AI图像生成",
    description: "使用ModelScope的AIGC模型生成图像",
    request: {
      body: contentJson(
        z.object({
          model: z.string().default("Qwen/Qwen-Image"),
          prompt: z.string(),
          negative_prompt: z.string().optional(),
          loras: z.union([z.string(), z.record(z.number())]).optional()
        })
      )
    },
    responses: {
      "200": {
        description: "返回图像生成任务信息",
        ...contentJson(z.any())
      }
    }
  };

  public async handle(c: AppContext) {
    const data = await this.getValidatedData<typeof this.schema>();
    const { model, prompt, negative_prompt, loras } = data.body;
    const apiKey = c.env?.MODELSCOPE_API_KEY;

    if (!apiKey) {
      return c.json({ error: "ModelScope API key is missing" }, 400);
    }

    try {
      const response = await fetch("https://api-inference.modelscope.cn/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "X-ModelScope-Async-Mode": "true"
        },
        body: JSON.stringify({ model, prompt, negative_prompt, loras })
      });

      if (!response.ok) {
        const errorData = await response.json();
        return c.json({ error: errorData }, 500);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Image Generation Error:", error);
      return c.json({ error: "Failed to generate image" }, 500);
    }
  }
}
