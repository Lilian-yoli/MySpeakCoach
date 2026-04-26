import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import * as userRepository from '../repositories/userRepository.js';
import * as cardsRepository from '../repositories/cardsRepository.js';
import { getFibonacciInterval } from '../utils/srs.js';
import { getLangName } from '../utils/languages.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export const processBatchTranslation = async (inputs, currentUserId, language = 'en') => {
    let userId = currentUserId;
    if (!userId) {
        const defaultUser = await userRepository.upsertTestUser();
        userId = defaultUser.id;
    }

    const langName = getLangName(language);

    const prompt = `You are a language learning card generator. For each ${langName} sentence provided, generate exactly 3 review cards:

1. CLOZE: Identify the single most important keyword or phrase. Replace it with "___" in the sentence to form the question. The answer is that keyword/phrase.
2. L1_PROMPT: Translate the entire sentence into Traditional Chinese (zh-TW). The question is the Chinese translation. The answer is the original ${langName} sentence.
3. CONTEXT: Write a short, natural Traditional Chinese situational prompt describing when someone would say this sentence (e.g. 「當你在餐廳想點餐時，你會怎麼說？」). The question is that context prompt. The answer is the original ${langName} sentence.

Sentences (in ${langName}):
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

    const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema,
            temperature: 0.4,
        }
    });

    const generated = JSON.parse(result.response.text());

    const dataToInsert = generated.flatMap(item =>
        item.cards.map(card => ({
            originalText: item.original,
            question:     card.question,
            answer:       card.answer,
            cardType:     card.cardType,
            language,
            userId,
        }))
    );

    await cardsRepository.createManyCards(dataToInsert);
    const savedCards = await cardsRepository.findRecentCardsByUserId(userId, dataToInsert.length);
    return savedCards;
};

export const fetchDueCards = async (currentUserId, language = 'en') => {
    let userId = currentUserId;
    if (!userId) {
        const defaultUser = await userRepository.upsertTestUser();
        userId = defaultUser.id;
    }
    return await cardsRepository.findDueCards(userId, language);
};

export const fetchAllCards = async (currentUserId, language = 'en') => {
    let userId = currentUserId;
    if (!userId) {
        const defaultUser = await userRepository.upsertTestUser();
        userId = defaultUser.id;
    }
    return await cardsRepository.findAllCardsByUserId(userId, language);
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

export const processLiveRefinement = async (utterances, currentUserId, language = 'en') => {
    let userId = currentUserId;
    if (!userId) {
        const defaultUser = await userRepository.upsertTestUser();
        userId = defaultUser.id;
    }

    const langName = getLangName(language);

    const refinementPrompt = `You are a fluent native ${langName} speaker helping a language learner sound more natural in casual conversation.

Your task is to "respeak" each sentence — imagine you are the learner, you understand exactly what they meant to say in that conversational moment, and you say it again the way a native speaker would naturally say it in that same context.

Read all the sentences together as a conversation to understand the context and flow before rewriting each one.

Guidelines:
- Prefer natural contractions and colloquial phrasing where appropriate
- Match the register and tone of the conversation — casual, energetic, hesitant, etc.
- If the original is already natural, still return it unchanged

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

    const refinedSentences = pairs
        .filter(p => p.refined && p.refined.trim() !== p.original.trim())
        .map(p => p.refined);

    let savedCards = [];
    if (refinedSentences.length > 0) {
        savedCards = await processBatchTranslation(refinedSentences, userId, language);
    }

    return { pairs, savedCards };
};

export const generateContinuations = async (sentence, language = 'en') => {
    const langName = getLangName(language);

    const prompt = `You are a helpful ${langName} conversation coach.
The user provides a ${langName} sentence. Suggest 5 natural, native-sounding ways to continue or respond to it in a real conversation.

Guidelines:
- Each continuation should be a complete sentence (or short exchange) in ${langName}
- Cover a variety of tones: empathetic, curious, lighthearted, supportive, etc.
- Sound like something a fluent speaker would say naturally
- Keep each response concise (1–2 sentences max)

Input sentence: "${sentence}"`;

    const responseSchema = {
        type: SchemaType.ARRAY,
        items: { type: SchemaType.STRING, description: `A natural ${langName} continuation or response` }
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

export const generateSentenceSuggestions = async (query, language = 'en') => {
    const langName = getLangName(language);

    const prompt = `You are a helpful ${langName} language learning assistant.
The user will describe in Chinese what they want to express in ${langName}.
Provide exactly 5 natural, commonly-used ${langName} sentences or phrases that convey that meaning.
Cover a range of styles — casual, neutral, and slightly more formal — so the learner has options.

User's request (in Chinese): ${query}`;

    const responseSchema = {
        type: SchemaType.ARRAY,
        items: { type: SchemaType.STRING, description: `A natural ${langName} sentence suggestion` }
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

export const moveCardGroupLanguage = async (originalText, newLanguage, currentUserId) => {
    let userId = currentUserId;
    if (!userId) {
        const defaultUser = await userRepository.upsertTestUser();
        userId = defaultUser.id;
    }
    return await cardsRepository.updateGroupLanguage(originalText, userId, newLanguage);
};

export const processCardReview = async (cardId, currentUserId) => {
    let userId = currentUserId;
    if (!userId) {
        const defaultUser = await userRepository.upsertTestUser();
        userId = defaultUser.id;
    }

    const card = await cardsRepository.findCardById(cardId);
    if (!card) throw new Error('Card not found');
    if (card.userId !== userId) throw new Error('Unauthorized');

    const newStage = card.reviewStage + 1;
    const daysToAdd = getFibonacciInterval(newStage);
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + daysToAdd);

    return await cardsRepository.updateReviewSchedule(cardId, newStage, nextReviewDate);
};
