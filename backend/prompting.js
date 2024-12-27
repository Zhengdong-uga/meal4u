function generatePrompt(allergies, diet, calorieRestriction, ingredients, specialRequests, time, goal, dishType, dislikes) {
    let template = "";

    // Handle allergies
    function allergiesPrompt(allergies) {
        if (Array.isArray(allergies)) {
            // Handle if allergies is an array
            if (allergies.length > 0) {
                return `I have allergies to ${allergies.join(', ')}.`;
            } else {
                return "I don't have any allergies.";
            }
        } else if (typeof allergies === 'object') {
            // Handle if allergies is an object
            const allergiesList = Object.keys(allergies).filter(key => allergies[key] === 1);
            if (allergiesList.length > 0) {
                return `I have allergies to ${allergiesList.join(', ')}.`;
            } else {
                return "I don't have any allergies.";
            }
        }
        return "I don't have any allergies."; // Default fallback
    }

    // Handle diet
    function dietPrompt(diet) {
        return diet ? `I'm on a ${diet} diet.` : "I'm not on any diet.";
    }

    // Handle calorie restriction
    function calorieRestrictionPrompt(calorieRestriction) {
        return calorieRestriction ? `I'm on a ${calorieRestriction} calorie restriction.` : "I'm not on any calorie restriction.";
    }

    // Handle ingredients
    function ingredientsPrompt(ingredients) {
        return ingredients.length ? `I have ${ingredients.join(', ')} in my pantry.` : "I don't have any ingredients in my pantry.";
    }

    // Handle time
    function timePrompt(time) {
        return time ? `I have ${time} to cook.` : "";
    }

    // Handle special requests
    function handleSpecialRequests(specialRequests) {
        return specialRequests ? specialRequests : "";
    }

    // Handle dish type
    function handleDishType(dishType) {
        return dishType ? `I would like a ${dishType} dish.` : "";
    }

    // Handle dislikes
    function handleDislikes(dislikes) {
        return dislikes.length ? `I don't like ${dislikes.join(', ')}.` : "";
    }

    // Handle goal
    function handleGoal(goal) {
        return goal ? `My goal is to ${goal}.` : "";
    }

    // Add all parts to the template
    template += allergiesPrompt(allergies) + " ";
    template += dietPrompt(diet) + " ";
    template += calorieRestrictionPrompt(calorieRestriction) + " ";
    template += ingredientsPrompt(ingredients) + " ";
    template += handleSpecialRequests(specialRequests) + " ";
    template += handleGoal(goal) + " ";
    template += handleDishType(dishType) + " ";
    template += handleDislikes(dislikes) + " ";
    template += timePrompt(time) + "\n\n";

    // Add instructions for meal formatting
    template += "Give me a meal in the format of:\nName:\nIngredients:\nSteps of preparation:\nNutritional information:";

    console.log(template);  // Or return the string if needed
    return template;
}

module.exports = {
    generatePrompt
};
