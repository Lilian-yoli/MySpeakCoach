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
