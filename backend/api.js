/*
 * Install the Generative AI SDK
 *
 * $ npm install @google/generative-ai
 */


const prompting = require('./prompting.js');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const ask_gemini = async (goal, dietType, restrictions, dislikes, likes, ingredients, considerOthers, specialRequests, time) => {

    let prompt = prompting.generatePrompt(goal, dietType, restrictions, dislikes, likes, ingredients, considerOthers, specialRequests, time);

    const apiKey = 'AIzaSyBAa8I0mMNTTlxtPrTW5CQB-CwmDDBMX5E';
    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-pro",
        systemInstruction: "Professional Dietitian",
    });

    const generationConfig = {
        temperature: 1,
        topP: 0.95,
        topK: 64,
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
        responseSchema: {
            type: "object",
            properties: {
                name: { type: "string" },
                ingredients: { type: "array", items: { type: "string" } },
                stepsOfPreparation: { type: "array", items: { type: "string" } },
                nutritionalInformation: { type: "string" },
            },
            required: ["name", "ingredients", "stepsOfPreparation", "nutritionalInformation"],
        }
    };

    async function run() {
        const chatSession = model.startChat({
            generationConfig,
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
