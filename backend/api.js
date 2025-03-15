/*
 * Install the Generative AI SDK
 *
 * $ npm install @google/generative-ai
 */


const prompting = require('./prompting.js');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const ask_gemini = async (goal, diet, restrictions, dislikes, likes, ingredients, suggestions, specialrequest, mealtype, preparetime, dishtype) => {

    let prompt = prompting.generatePrompt(goal, diet, restrictions, dislikes, likes, ingredients, suggestions, specialrequest, mealtype, preparetime, dishtype);

    const genAI = new GoogleGenerativeAI("AIzaSyDzU09ssDnIhzz3Yq21j7she_QERLIOp4A");

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
                description: { type: "string" },
                time: { type: "string" },
                difficulty: { type: "string" },
                ingredients: { type: "array", items: { type: "string" } },
                stepsOfPreparation: { type: "array", items: { type: "string" } },
                nutrition: {
                    type: "object",
                    properties: {
                        calories: { type: "string" },
                        protein: { type: "string" },
                        fat: { type: "string" },
                        carbohydrates: { type: "string" },
                    },
                    required: ["calories", "protein", "fat", "carbohydrates"]
                },
            },
            required: ["name", "ingredients", "stepsOfPreparation", "nutrition", "time", "difficulty", "description"],
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
