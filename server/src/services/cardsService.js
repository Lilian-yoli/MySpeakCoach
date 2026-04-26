import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import * as userRepository from '../repositories/userRepository.js';
import * as cardsRepository from '../repositories/cardsRepository.js';
import { getFibonacciInterval } from '../utils/srs.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export const processBatchTranslation = async (inputs, currentUserId) => {
    let userId = currentUserId;

    // For development/testing, automatically create and use a default user if auth isn't provided yet
    if (!userId) {
        const defaultUser = await userRepository.upsertTestUser();
        userId = defaultUser.id;
    }

    const prompt = `You are a language learning card generator. For each sentence provided, generate exactly 3 review cards:

1. CLOZE: Identify the single most important keyword or phrase. Replace it with "___" in the sentence to form the question. The answer is that keyword/phrase.
2. L1_PROMPT: Translate the entire sentence into Traditional Chinese (zh-TW). The question is the Chinese translation. The answer is the original sentence.
3. CONTEXT: Write a short, natural Traditional Chinese situational prompt describing when someone would say this sentence (e.g. 「當你在餐廳想點餐時，你會怎麼說？」). The question is that context prompt. The answer is the original sentence.

Sentences:
${JSON.stringify(inputs)}`;

    const cardSchema = {
        type: SchemaType.OBJECT,
        properties: {
            cardType: { type: SchemaType.STRING, description: "One of: CLOZE, L1_PROMPT, CONTEXT" },
            question: { type: SchemaType.STRING, description: "The prompt shown to the learner" },
            answer:   { type: SchemaType.STRING, description: "The expected answer" },
        },
        required: ["cardType", "question", "answer"]
    };

    const responseSchema = {
        type: SchemaType.ARRAY,
        items: {
            type: SchemaType.OBJECT,
            properties: {
                original: { type: SchemaType.STRING, description: "The original input sentence" },
                cards:    { type: SchemaType.ARRAY, items: cardSchema }
            },
            required: ["original", "cards"]
        }
    };

    // Call AI API
    const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: responseSchema,
            temperature: 0.4,
        }
    });

    const responseText = result.response.text();
    const generated = JSON.parse(responseText);

    // Flatten: one input sentence → 3 card rows (CLOZE, L1_PROMPT, CONTEXT)
    const dataToInsert = generated.flatMap(item =>
        item.cards.map(card => ({
            originalText: item.original,
            question:     card.question,
            answer:       card.answer,
            cardType:     card.cardType,
            userId:       userId,
        }))
    );

    // Perform database operations via repositories
    await cardsRepository.createManyCards(dataToInsert);
    const savedCards = await cardsRepository.findRecentCardsByUserId(userId, dataToInsert.length);

    return savedCards;
};

export const fetchDueCards = async (currentUserId) => {
    let userId = currentUserId;
    if (!userId) {
        const defaultUser = await userRepository.upsertTestUser();
        userId = defaultUser.id;
    }
    return await cardsRepository.findDueCards(userId);
};

export const fetchAllCards = async (currentUserId) => {
    let userId = currentUserId;
    if (!userId) {
        const defaultUser = await userRepository.upsertTestUser();
        userId = defaultUser.id;
    }
    return await cardsRepository.findAllCardsByUserId(userId);
};

export const deleteCardGroup = async (cardId, currentUserId) => {
    let userId = currentUserId;
    if (!userId) {
        const defaultUser = await userRepository.upsertTestUser();
        userId = defaultUser.id;
    }
    const card = await cardsRepository.findCardById(cardId);
    if (!card) throw new Error('Card not found');
    if (card.userId !== userId) throw new Error('Unauthorized');
    return await cardsRepository.deleteCardsByOriginalText(card.originalText, userId);
};

export const updateCard = async (cardId, question, answer, currentUserId) => {
    let userId = currentUserId;
    if (!userId) {
        const defaultUser = await userRepository.upsertTestUser();
        userId = defaultUser.id;
    }
    const card = await cardsRepository.findCardById(cardId);
    if (!card) throw new Error('Card not found');
    if (card.userId !== userId) throw new Error('Unauthorized');
    return await cardsRepository.updateCardContent(cardId, question, answer);
};

export const processLiveRefinement = async (utterances, currentUserId) => {
    let userId = currentUserId;
    if (!userId) {
        const defaultUser = await userRepository.upsertTestUser();
        userId = defaultUser.id;
    }

    const refinementPrompt = `You are a fluent American English speaker helping a language learner sound more natural in casual conversation.

Your task is to "respeak" each sentence — imagine you are the learner, you understand exactly what they meant to say in that conversational moment, and you say it again the way a native speaker would naturally say it in that same context.

Read all the sentences together as a conversation to understand the context and flow before rewriting each one. The respoken version should fit naturally within that conversation, not just be a grammar fix in isolation.

Guidelines:
- Prefer contractions (I'm, it's, don't, gonna, wanna) where natural
- Use common spoken phrases over formal equivalents (e.g. "I'm not sure" instead of "I am uncertain")
- Match the register and tone of the conversation — casual, energetic, hesitant, etc.
- If the original is already natural, still return it unchanged

Examples:
- Original: "I want to go to the store for buying some food."
  Respoken: "I want to go to the store to pick up some food."
- Original: "Yesterday I have met my friend and we are talking about movies."
  Respoken: "Yesterday I met up with my friend and we were talking about movies."
- Original: "This is very interesting for me."
  Respoken: "I find this really interesting."

Sentences (read as a conversation):
${JSON.stringify(utterances)}`;

    const refinementSchema = {
        type: SchemaType.ARRAY,
        items: {
            type: SchemaType.OBJECT,
            properties: {
                original: { type: SchemaType.STRING, description: "The original learner sentence" },
                refined:  { type: SchemaType.STRING, description: "The natural native-speaker version" },
            },
            required: ["original", "refined"]
        }
    };

    const refinementResult = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: refinementPrompt }] }],
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: refinementSchema,
            temperature: 0.3,
        }
    });

    const pairs = JSON.parse(refinementResult.response.text());

    // Only send sentences that actually changed
    const refinedSentences = pairs
        .filter(p => p.refined && p.refined.trim() !== p.original.trim())
        .map(p => p.refined);

    let savedCards = [];
    if (refinedSentences.length > 0) {
        savedCards = await processBatchTranslation(refinedSentences, userId);
    }

    return { pairs, savedCards };
};

export const generateContinuations = async (sentence) => {
    const prompt = `You are a helpful English conversation coach.
The user provides an English sentence. Suggest 5 natural, native-sounding ways to continue or respond to it in a real conversation.

Guidelines:
- Each continuation should be a complete sentence (or short exchange)
- Cover a variety of tones: empathetic, curious, lighthearted, supportive, etc.
- Sound like something a fluent speaker would say naturally, not textbook English
- Keep each response concise (1–2 sentences max)

Input sentence: "${sentence}"`;

    const responseSchema = {
        type: SchemaType.ARRAY,
        items: { type: SchemaType.STRING, description: "A natural English continuation or response" }
    };

    const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema,
            temperature: 0.8,
        }
    });

    return JSON.parse(result.response.text());
};

export const generateSentenceSuggestions = async (query) => {
    const prompt = `You are a helpful English language learning assistant.
The user will describe in Chinese what they want to express in English.
Provide exactly 5 natural, commonly-used English sentences or phrases that convey that meaning.
Cover a range of styles — casual, neutral, and slightly more formal — so the learner has options.

User's request (in Chinese): ${query}`;

    const responseSchema = {
        type: SchemaType.ARRAY,
        items: { type: SchemaType.STRING, description: "A natural English sentence suggestion" }
    };

    const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema,
            temperature: 0.7,
        }
    });

    return JSON.parse(result.response.text());
};

export const processCardReview = async (cardId, currentUserId) => {
    let userId = currentUserId;
    if (!userId) {
        const defaultUser = await userRepository.upsertTestUser();
        userId = defaultUser.id;
    }

    const card = await cardsRepository.findCardById(cardId);
    if (!card) {
        throw new Error('Card not found');
    }
    if (card.userId !== userId) {
        throw new Error('Unauthorized');
    }

    const newStage = card.reviewStage + 1;
    const daysToAdd = getFibonacciInterval(newStage);

    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + daysToAdd);

    return await cardsRepository.updateReviewSchedule(cardId, newStage, nextReviewDate);
};
