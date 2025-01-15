function generatePrompt(goal, dietType, restrictions, dislikes, likes, ingredients, considerOthers, specialRequests, time) {
    let template = "";

    function goalPrompt(goal) {
        return `My eating goal is to ${goal}.`;
    }

    function dietTypePrompt(dietType) {
        return `My diet type is ${dietType}.`;
    }

    function restrictionPrompt(restrictions) {
        return restrictions ? `I have restrictions to ${restrictions.join(', ')}.` : "I do not have any food restrictions.";
    }

    function dislikesPrompt(dislikes) {
        return dislikes ? `I don't like ${dislikes.join(', ')}.` : "I don't have any ingredients that I dislike over others.";
    }

    function likesPrompt(likes) {
        return likes ? `I like ${likes.join(', ')}.` : "I don't have any ingredients that I favor over others.";
    }

    function ingredientsPrompt(ingredients) {
        return ingredients ? `I have ${ingredients.join(', ')} in my pantry.` : "I don't have any ingredients in my pantry.";
    }

    function considerOthersPrompt(considerOthers) {
        return considerOthers ? `I would like to consider other ingredients not in my pantry.` : "I would not like to consider other ingredients not in my pantry.";
    }

    // Handle special requests
    function handleSpecialRequests(specialRequests) {
        return specialRequests ? specialRequests : "I don't have any special requests.";
    }

    // Handle time
    function timePrompt(time) {
        return time ? `I have ${time} to cook.` : "I don't have a time limit to cook.";
    }

    // Add all parts to the template
    template += goalPrompt(goal) + " ";
    template += dietTypePrompt(dietType) + " ";
    template += restrictionPrompt(restrictions) + " ";
    template += dislikesPrompt(dislikes) + " ";
    template += likesPrompt(likes) + " ";
    template += ingredientsPrompt(ingredients) + " ";
    template += considerOthersPrompt(considerOthers) + " ";
    template += handleSpecialRequests(specialRequests) + " ";
    template += timePrompt(time) + "\n\n";


    // Add instructions for meal formatting
    // template += "Give me a meal in the format of:\nName:\nIngredients:\nSteps of preparation:\nNutritional information:";
    template += "Give me a meal based on the information I gave you.";

    console.log(template);  // Or return the string if needed
    return template;
}

module.exports = {
    generatePrompt
};
