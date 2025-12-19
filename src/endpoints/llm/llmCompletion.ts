import { z } from "zod";
import { OpenAPIRoute, contentJson } from "chanfana";
import { AppContext } from "../../types";

export class LLMCompletion extends OpenAPIRoute {
  public schema = {
    tags: ["LLM"],
    summary: "大语言模型文本生成",
    description: "使用ModelScope的大语言模型生成文本",
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
      console.error("LLM Completion Error:", error);
      return c.json({ error: "Failed to generate completion" }, 500);
    }
  }
}
