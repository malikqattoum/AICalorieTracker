import { Router } from 'express';
import { authenticateToken } from '../middleware/auth'; // Assuming auth middleware
import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/index.js';

const router = Router();

const apiKey = process.env.OPENAI_API_KEY || "";
const MODEL = "gpt-4o"; // Or your preferred model
const openai = new OpenAI({ apiKey });

interface ChatMessage {
    role: "user" | "assistant" | "system";
    content: string;
}

async function getAiChefReply(messages: ChatMessage[], userId?: number): Promise<string> {
    const systemPrompt =
        "You are a helpful and creative AI Chef Assistant. Your goal is to assist users with all things cooking-related. " +
        "You can suggest recipes based on ingredients they have, dietary restrictions, or desired cuisine. " +
        "You can provide cooking instructions, tips, and techniques. " +
        "You can help with meal planning, ingredient substitutions, and understanding cooking terms. " +
        "If a user asks for a recipe, try to provide a clear, step-by-step guide including ingredients, quantities, and instructions. " +
        "If nutritional information is relevant and can be estimated, you can include it. " +
        "Be friendly, encouraging, and practical in your advice. " +
        (userId ? `The user ID is ${userId}, you can use this to personalize suggestions if you have access to their data (though you likely don't directly).` : "");

    const chatMessages: ChatCompletionMessageParam[] = [
        { role: "system", content: systemPrompt },
        ...messages.map(m => ({ role: m.role as "user" | "assistant", content: m.content }))
    ];

    try {
        const response = await openai.chat.completions.create({
            model: MODEL,
            messages: chatMessages,
            max_tokens: 1000, // Increased token limit for potentially longer recipes
            temperature: 0.7,
        });
        return response.choices[0].message.content?.trim() || "Sorry, I couldn't come up with a reply right now.";
    } catch (error) {
        console.error("Error getting AI Chef reply:", error);
        return "I seem to be having trouble in the kitchen right now. Please try again in a moment.";
    }
}

router.post('/chat', authenticateToken, async (req, res) => {
    const { messages, userId } = req.body as { messages: ChatMessage[], userId?: number };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'Messages are required and must be a non-empty array.' });
    }

    try {
        // We can pass req.user.id if we want to ensure the userId is from the authenticated token
        const chefReply = await getAiChefReply(messages, req.user?.id || userId);
        res.json({ reply: chefReply });
    } catch (error) {
        console.error('AI Chef chat error:', error);
        res.status(500).json({ error: 'Failed to get response from AI Chef Assistant' });
    }
});

export default router;