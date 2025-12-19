import { z } from "zod";
import { OpenAPIRoute, contentJson } from "chanfana";
import { AppContext } from "../../types";

export class VisionCompletion extends OpenAPIRoute {
  public schema = {
    tags: ["Vision"],
    summary: "视觉模型推理",
    description: "使用ModelScope的视觉模型进行图像理解和分析",
    request: {
      body: contentJson(
        z.object({
          model: z.string().default("Qwen/QVQ-72B-Preview"),
          messages: z.array(
            z.object({
              role: z.enum(["system", "user", "assistant"]),
              content: z.array(
                z.union([
                  z.object({
                    type: z.literal("text"),
                    text: z.string()
                  }),
                  z.object({
                    type: z.literal("image_url"),
                    image_url: z.object({
                      url: z.string().url()
                    })
                  })
                ])
              )
            })
          ),
          stream: z.boolean().default(false)
        })
      )
    },
    responses: {
      "200": {
        description: "返回视觉模型分析结果",
        ...contentJson(z.any())
      }
    }
  };

  public async handle(c: AppContext) {
    const data = await this.getValidatedData<typeof this.schema>();
    const { model, messages, stream } = data.body;
    const apiKey = c.env?.MODELSCOPE_API_KEY;

    if (!apiKey) {
      return c.json({ error: "ModelScope API key is missing" }, 400);
    }

    try {
      const response = await fetch("https://api-inference.modelscope.cn/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({ model, messages, stream })
      });

      if (!response.ok) {
        const errorData = await response.json();
        return c.json({ error: errorData }, 500);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Vision Completion Error:", error);
      return c.json({ error: "Failed to process vision completion" }, 500);
    }
  }
}
