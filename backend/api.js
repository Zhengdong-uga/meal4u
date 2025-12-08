/*
 * Install the Generative AI SDK
 *
 * $ npm install @google/generative-ai
 */

import Constants from 'expo-constants';
import { GoogleGenAI } from '@google/genai';

const prompting = require('./prompting.js');

// Initialize Gemini client with API key from Expo config
const ai = new GoogleGenAI({
    apiKey: Constants.expoConfig.extra.geminikey,
});

const ask_gemini = async (goal, diet, restrictions, dislikes, likes, ingredients, suggestions, specialrequest, mealtype, preparetime, dishtype) => {
    const prompt = prompting.generatePrompt(
        goal,
        diet,
        restrictions,
        dislikes,
        likes,
        ingredients,
        suggestions,
        specialrequest,
        mealtype,
        preparetime,
        dishtype
    );

    const response = await ai.models.generateContent({
        // Use a current Gemini model; adjust if you prefer a different one
        model: 'gemini-2.0-flash',
        contents: prompt,
        config: {
            temperature: 1,
            topP: 0.95,
            topK: 64,
            maxOutputTokens: 8192,
            responseMimeType: 'application/json',
            responseSchema: {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    description: { type: 'string' },
                    time: { type: 'string' },
                    difficulty: { type: 'string' },
                    ingredients: { type: 'array', items: { type: 'string' } },
                    stepsOfPreparation: { type: 'array', items: { type: 'string' } },
                    nutrition: {
                        type: 'object',
                        properties: {
                            calories: { type: 'string' },
                            protein: { type: 'string' },
                            fat: { type: 'string' },
                            carbohydrates: { type: 'string' },
                        },
                        required: ['calories', 'protein', 'fat', 'carbohydrates'],
                    },
                },
                required: ['name', 'ingredients', 'stepsOfPreparation', 'nutrition', 'time', 'difficulty', 'description'],
            },
        },
    });

    console.log(response.text);
    return response.text;
};

module.exports = { ask_gemini };
