import type { Message, Tool } from '../types';
import { generateText } from './generate-text';
import { allTools } from '../tools';
import { createOllamaCloud } from '../providers/ollamacloud';

const ollamaCloud = createOllamaCloud();
const modelId = process.env.OLLAMA_MODEL_ID ?? 'gemma4:31b-cloud';
const model = ollamaCloud(modelId);
const tools = allTools;

async function executeTool(tool: Tool, args: Record<string, unknown>): Promise<string> {
    return tool.execute(args);
}

export async function generate(userMessage: string): Promise<string> {

    const messages: Message[] = [
        { role: "system", content: "あなたはファイル操作ができるアシスタントです。" },
        { role: "user", content: userMessage }
    ];
    
    let finalText = '';
    
    while (true) {
    // ステップ1: LLMを呼び出す
    const response = await generateText({ model, messages, tools });
    if (response.text) {
        finalText = response.text;
        console.log(response.text);
    }
    
    // ステップ2: ツール呼び出しがあればassistantメッセージ追加
    if (response.toolCalls && response.toolCalls.length > 0) {
        messages.push({
            role: "assistant",
            content: response.text || "",
            toolCalls: response.toolCalls
        });
    
        for (const toolCall of response.toolCalls) {
            console.log(`[ツール実行] ${toolCall.name}`);
            
            // ステップ3: ツールを検索して実行
            const tool = tools.find(t => t.name === toolCall.name);
            if (!tool) {
                throw new Error(`Unknown tool: ${toolCall.name}`);
            }
            const result = await executeTool(tool, toolCall.args);
            
            // ステップ4: toolメッセージを会話履歴に追加
            messages.push({
                role: "tool",
                toolCallId: toolCall.toolCallId,// ここでtoolCallIdを紐付け
                name: toolCall.name,// ツール名も必須
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
    return finalText;
}

//await generate("README.mdの内容を教えて");
//bun run chapters/04-tools-demo.ts