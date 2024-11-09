/*
 * Install the Generative AI SDK
 *
 * $ npm install @google/generative-ai
 */

// import { generatePrompt } from './prompting.js';
// const prompting = require('./prompting.js');

// let allergies = { 'peanut': 0, 'shellfish': 1, 'strawberries': 1, 'tomatoes': 1, 'chocolate': 0 };
// let diet = 'keto';
// let calorieRestriction = 1700;
// let ingredients = ['Chicken', 'Broccoli', 'Onion'];
// let specialRequests = null;
// let time = '30 minutes';
// let goal = 'gain muscle';
// let dishType = "Indian";
// let dislikes = ['Chickpeas', 'Apples'];
const prompting = require('./prompting.js');

const { GoogleGenerativeAI } = require("@google/generative-ai");

const ask_gemini = async (allergies, diet, calorieRestriction, ingredients, specialRequests, time, goal, dishType, dislikes) => {

    let prompt = prompting.generatePrompt(allergies, diet, calorieRestriction, ingredients, specialRequests, time, goal, dishType, dislikes);

    const apiKey = '-------';
    const genAI = new GoogleGenerativeAI(apiKey);

    // const {
    //     GoogleGenerativeAI,
    //     HarmCategory,
    //     HarmBlockThreshold,
    // } = require("@google/generative-ai");
    // Mocking the API response for demo purposes
    //     return new Promise((resolve) => {
    //         const mockRecipe = `
    //             Name: Keto Chicken & Broccoli Curry
    //             Ingredients: 
    //             - Chicken thighs: 1 lb
    //             - Broccoli: 1 large head
    //             - Curry powder: 1 tbsp
    //             Steps of preparation:
    //             1. Sauté chicken and broccoli.
    //             2. Add curry powder and cook until done.
    //             Nutritional information: 400 kcal per serving
    //         `;
    //         // Simulate a response delay and return the mock recipe
    //         setTimeout(() => resolve(mockRecipe), 500); // 500ms delay for generating
    //     });
    // }



    //     const apiKey = process.env.AIzaSyCOhaAlL2kOFQnlDbHoDyCog_5ZjOyci_U;
    //     const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-pro",
        systemInstruction: "Professional Dietitian",
    });

    const generationConfig = {
        temperature: 1,
        topP: 0.95,
        topK: 64,
        maxOutputTokens: 8192,
        responseMimeType: "text/plain",
    };

    async function run() {
        const chatSession = model.startChat({
            generationConfig,
            // safetySettings: Adjust safety settings
            // See https://ai.google.dev/gemini-api/docs/safety-settings
            history: [
            ],
        });

        const result = await chatSession.sendMessage(prompt);
        console.log(result.response.text());
        return result.response.text();
    }

    return await run();
}

module.exports = { ask_gemini }; 
