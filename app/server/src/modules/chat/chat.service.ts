import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ModelProviderService } from '../model-provider/model-provider.service';
import { ChatOpenAI } from '@langchain/openai';
import { StateGraph, MessagesAnnotation } from '@langchain/langgraph';
import { HumanMessage, AIMessage, SystemMessage, BaseMessage } from '@langchain/core/messages';
import { ChatMessage } from '@prisma/client';

@Injectable()
export class ChatService {
    constructor(
        private prisma: PrismaService,
        private modelProviderService: ModelProviderService,
    ) { }

    async getModels(tenantId: string) {
        return this.modelProviderService.getAvailableModels(tenantId);
    }

    async createSession(userId: string, tenantId: string, data: { title?: string; provider: string; model: string }) {
        return this.prisma.chatSession.create({
            data: {
                userId,
                tenantId,
                title: data.title || 'New Chat',
                provider: data.provider,
                model: data.model,
            },
        });
    }

    async getSessions(userId: string, tenantId: string) {
        return this.prisma.chatSession.findMany({
            where: { userId, tenantId },
            orderBy: { updatedAt: 'desc' },
        });
    }

    async getSession(id: string, userId: string) {
        const session = await this.prisma.chatSession.findUnique({
            where: { id },
            include: {
                messages: {
                    orderBy: { createdAt: 'asc' },
                },
            },
        });

        if (!session || session.userId !== userId) {
            throw new NotFoundException('Session not found');
        }

        return session;
    }

    async chat(sessionId: string, userId: string, message: string, provider?: string, model?: string) {
        const session = await this.getSession(sessionId, userId);

        // 1. Save User Message
        await this.prisma.chatMessage.create({
            data: {
                sessionId,
                role: 'user',
                content: message,
                usedProvider: provider,
                usedModel: model,
            },
        });

        // 2. Determine Provider & Model
        const targetProvider = provider || session.provider;
        const targetModel = model || session.model;

        // 3. Get Config & Initialize LLM
        const config = await this.modelProviderService.getDecryptedConfig(session.tenantId, targetProvider);
        if (!config) {
            throw new NotFoundException(`Provider configuration for ${targetProvider} not found`);
        }

        let llm;
        if (targetProvider === 'openai') {
            llm = new ChatOpenAI({
                openAIApiKey: config.api_key,
                modelName: targetModel,
                streaming: true,
            });
        } else if (targetProvider === 'openrouter') {
            llm = new ChatOpenAI({
                openAIApiKey: config.api_key,
                modelName: targetModel,
                configuration: {
                    baseURL: 'https://openrouter.ai/api/v1',
                },
                streaming: true,
            });
        } else {
            // Fallback for other providers or error
            // For now, assume compatible with OpenAI SDK (most are)
            llm = new ChatOpenAI({
                openAIApiKey: config.api_key,
                modelName: targetModel,
                configuration: {
                    baseURL: config.base_url, // If provider config has base_url
                },
                streaming: true,
            });
        }

        // 4. Build LangGraph
        const graph = new StateGraph(MessagesAnnotation)
            .addNode("agent", async (state: typeof MessagesAnnotation.State) => {
                const response = await llm.invoke(state.messages);
                return { messages: [response] };
            })
            .addEdge("__start__", "agent")
            .addEdge("agent", "__end__")
            .compile();

        // 5. Prepare History
        const history: BaseMessage[] = session.messages.map((m: ChatMessage) => {
            if (m.role === 'user') return new HumanMessage(m.content);
            if (m.role === 'assistant') return new AIMessage(m.content);
            return new SystemMessage(m.content);
        });

        // Add current message
        history.push(new HumanMessage(message));

        // 6. Stream & Accumulate
        const stream = await graph.streamEvents({ messages: history }, { version: 'v2' });

        // Return a generator that yields chunks and saves the final response
        const prisma = this.prisma; // Capture for closure

        async function* generator() {
            let fullResponse = '';

            for await (const event of stream) {
                if (event.event === 'on_chat_model_stream') {
                    const chunk = event.data.chunk;
                    if (chunk.content) {
                        fullResponse += chunk.content;
                        yield { content: chunk.content };
                    }
                }
            }

            // Save Assistant Message
            if (fullResponse) {
                await prisma.chatMessage.create({
                    data: {
                        sessionId,
                        role: 'assistant',
                        content: fullResponse,
                        usedProvider: targetProvider,
                        usedModel: targetModel,
                    },
                });
            }
        }

        return generator();
    }
}
