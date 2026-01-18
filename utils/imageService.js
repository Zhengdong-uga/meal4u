// Image service for fetching recipe images from Pexels
// Pexels provides free, high-quality food photography

import { API_KEYS } from '../config/apiKeys';

/**
 * Fetch a food image from Pexels based on recipe name
 * @param {string} recipeName - Name of the recipe
 * @param {string} category - Category of the recipe (Meals, Drinks, Dessert)
 * @returns {Promise<string>} - URL of the image
 */
export const fetchRecipeImage = async (recipeName, category = 'food') => {
  try {
    // Create search query based on recipe name and category
    let searchQuery = recipeName;
    
    // Add category-specific keywords for better results
    if (category.toLowerCase().includes('drink')) {
      searchQuery += ' drink beverage';
    } else if (category.toLowerCase().includes('dessert')) {
      searchQuery += ' dessert sweet';
    } else {
      searchQuery += ' food dish meal';
    }

    // Check if Pexels API key is available
    if (!API_KEYS.PEXELS_API_KEY) {
      console.error('No Pexels API key configured');
      return null;
    }

    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(searchQuery)}&per_page=1&orientation=landscape`,
      {
        headers: {
          Authorization: API_KEYS.PEXELS_API_KEY,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch image from Pexels');
    }

    const data = await response.json();
    
    if (data.photos && data.photos.length > 0) {
      return data.photos[0].src.large;
    } else {
      // No results found
      console.warn('No images found for query:', searchQuery);
      return null;
    }
  } catch (error) {
    console.error('Error fetching recipe image:', error);
    // Return null on error instead of placeholder
    return null;
  }
};

