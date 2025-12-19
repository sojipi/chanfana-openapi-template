import { contentJson, OpenAPIRoute } from "chanfana";
import { AppContext } from "../../types";
import { z } from "zod";

export class LLMCompletion extends OpenAPIRoute {
  public schema = {
    tags: ["LLM"],
    summary: "大语言模型文本生成",
    operationId: "llm-completion",
    request: {
      body: contentJson(
        z.object({
          model: z.string().default("Qwen/Qwen2.5-Coder-32B-Instruct"),
          messages: z.array(
            z.object({
              role: z.enum(["system", "user", "assistant"]),
              content: z.string()
            })
          ),
          stream: z.boolean().default(false)
        })
      )
    },
    responses: {
      "200": {
        description: "返回生成的文本",
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
      console.error("LLM 调用错误:", error);
      return c.json({ success: false, error: "模型调用失败" }, 500);
    }
  }
}