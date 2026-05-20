import type { Message, Tool } from '../types';
import { generateText } from './generate-text';
import { allTools } from '../tools';
import { createOllamaCloud } from '../providers/ollamacloud';

const ollamaCloud = createOllamaCloud();
const modelId = process.env.OLLAMA_MODEL_ID ?? 'gemma4:31b-cloud';
const model = ollamaCloud(modelId);
const tools = allTools;

import { requestApproval } from './approval';

async function executeTool(tool: Tool, args: Record<string, unknown>): Promise<string> {
    return tool.execute(args);
}

export async function generate(userMessage: string): Promise<string> {
    //++
    const messages: Message[] = [
     { role: "system", content: "あなたはファイル操作ができるアシスタントです。" },
     { role: "user", content: userMessage }
    ];

    let finalText = '';

    while (true) {
     const response = await generateText({ model, messages, tools });

     if (response.text) {
        finalText = response.text;
      console.log(response.text);
     }

     if (response.toolCalls && response.toolCalls.length > 0) {
      messages.push({
       role: "assistant",
       content: response.text || "",
       toolCalls: response.toolCalls
      });

      for (const toolCall of response.toolCalls) {
       const tool = tools.find(t => t.name === toolCall.name);

       if (!tool) {
        throw new Error(`Unknown tool: ${toolCall.name}`);
       }

       console.log(`[ツール実行] ${toolCall.name}`);

       // 承認が必要かチェック
       if (tool.needsApproval) {
        const approved = await requestApproval(
         toolCall.name,
         toolCall.args
        );

        if (!approved) {
         // ユーザーが拒否した場合、自然言語でLLMに通知
         messages.push({
          role: "tool",
          toolCallId: toolCall.toolCallId,
          name: toolCall.name,
          content: "ユーザーによってキャンセルされました。別の方法を検討してください。"
         });
         continue;
        }
       }

       // 承認された、または承認不要な場合は実行
       const result = await executeTool(tool, toolCall.args);

       messages.push({
        role: "tool",
        toolCallId: toolCall.toolCallId,
        name: toolCall.name,
        content: result
       });
      }

      continue;
     }

     messages.push({
      role: "assistant",
      content: response.text
     });

     if (response.finishReason === 'stop') {
      break;
     }
    }
    //++
    return finalText;
}

//await generate("README.mdの内容を教えて");
//bun run chapters/04-tools-demo.ts