function generatePrompt(goal, diet, restrictions, dislikes, likes, ingredients, suggestions, specialrequest, mealtype, preparetime, dishtype) {
    let template = "";

    function goalPrompt(goal) {
        return goal ? `My eating goal is to ${goal.join(', ')}.` : "I don't have any diet goals";
    }

    function dietTypePrompt(diet) {
        return diet ? `My diet type is ${diet.join(', ')}.` : "I don't have a diet type";
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

    function suggestionsPrompt(suggestions) {
        return suggestions ? `I would like to consider other ingredients not in my pantry.` : "I would not like to consider other ingredients not in my pantry.";
    }

    // Handle special requests
    function specialRequestPrompt(specialrequest) {
        return specialrequest ? specialrequest : "I don't have any special requests.";
    }

    function prepareTimePrompt(preparetime) {
        return preparetime ? `I have ${preparetime} to cook.` : "I don't have a time limit to cook.";
    }

    function mealTypePrompt(mealtype) {
        return mealtype ? `This is for ${mealtype}.` : "This is for any meal.";
    }

    function dishTypePrompt(dishtype) {
        return dishtype ? `I would like to have a ${dishtype} dish.` : "I don't have a preference for the type of dish.";
    }

    // Add all parts to the template
    template += goalPrompt(goal) + " ";
    template += dietTypePrompt(diet) + " ";
    template += restrictionPrompt(restrictions) + " ";
    template += dislikesPrompt(dislikes) + " ";
    template += likesPrompt(likes) + " ";
    template += ingredientsPrompt(ingredients) + " ";
    template += suggestionsPrompt(suggestions) + " ";
    template += specialRequestPrompt(specialrequest) + " ";
    template += prepareTimePrompt(preparetime) + " ";
    template += mealTypePrompt(mealtype) + " ";
    template += dishTypePrompt(dishtype) + "\n\n";

    // Add instructions for meal formatting
    template += "Give me a meal based on the information I gave you.";

    console.log(template);  // Or return the string if needed
    return template;
}

module.exports = {
    generatePrompt
};
