import { contentJson, OpenAPIRoute } from "chanfana";
import { AppContext } from "../../types";
import { z } from "zod";

export class VisionCompletion extends OpenAPIRoute {
  public schema = {
    tags: ["Vision"],
    summary: "视觉模型多模态生成",
    operationId: "vision-completion",
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
        description: "返回视觉模型生成的结果",
        ...contentJson({
          success: z.boolean(),
          result: z.any()
        })
      }
    }
  };

  public async handle(c: AppContext) {
    const data = await this.getValidatedData<typeof this.schema>();
    
    const { model, messages, stream } = data.body;
    const apiKey = c.env.MODELSCOPE_API_KEY;
    
    if (!apiKey) {
      return c.json({ success: false, error: "缺少 ModelScope API 密钥" }, 400);
    }

    try {
      const response = await fetch("https://api-inference.modelscope.cn/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ model, messages, stream })
      });

      const result = await response.json();
      
      return {
        success: true,
        result
      };
    } catch (error) {
      console.error("视觉模型调用错误:", error);
      return c.json({ success: false, error: "模型调用失败" }, 500);
    }
  }
}