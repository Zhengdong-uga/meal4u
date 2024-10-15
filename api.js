/*
 * Install the Generative AI SDK
 *
 * $ npm install @google/generative-ai
 */

// import { generatePrompt } from './prompting.js';
const prompting = require('./prompting.js');

let allergies = { 'peanut': 0, 'shellfish': 1, 'strawberries': 1, 'tomatoes': 1, 'chocolate': 0 };
let diet = 'keto';
let calorieRestriction = 1700;
let ingredients = ['Chicken', 'Broccoli', 'Onion'];
let specialRequests = null;
let time = '30 minutes';
let goal = 'gain muscle';
let dishType = "Indian";
let dislikes = ['Chickpeas', 'Apples'];

const ask_gemini = (allergies, diet, calorieRestriction, ingredients, specialRequests, time, goal, dishType, dislikes) => {

    let prompt = prompting.generatePrompt(allergies, diet, calorieRestriction, ingredients, specialRequests, time, goal, dishType, dislikes);



    const {
        GoogleGenerativeAI,
        HarmCategory,
        HarmBlockThreshold,
    } = require("@google/generative-ai");

    // const apiKey = process.env.AIzaSyCOhaAlL2kOFQnlDbHoDyCog_5ZjOyci_U;
    const genAI = new GoogleGenerativeAI("AIzaSyCOhaAlL2kOFQnlDbHoDyCog_5ZjOyci_U");

    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-pro",
        systemInstruction: "Professional Dietitian",
    });

    const generationConfig = {
        temperature: 0.1,
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
    }

    run();
}

ask_gemini(allergies, diet, calorieRestriction, ingredients, specialRequests, time, goal, dishType, dislikes);