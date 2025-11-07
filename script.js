document.addEventListener('DOMContentLoaded', () => {
    const categorySelect = document.getElementById('category');
    const areaSelect = document.getElementById('area');
    const searchButton = document.getElementById('search');
    const resultsDiv = document.getElementById('results');

    // Fetch and populate categories
    fetch('https://www.themealdb.com/api/json/v1/1/list.php?c=list')
        .then(response => response.json())
        .then(data => {
            data.meals.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.strCategory;
                option.textContent = cat.strCategory;
                categorySelect.appendChild(option);
            });
        })
        .catch(error => console.error('Error fetching categories:', error));

    // Fetch and populate areas
    fetch('https://www.themealdb.com/api/json/v1/1/list.php?a=list')
        .then(response => response.json())
        .then(data => {
            data.meals.forEach(area => {
                const option = document.createElement('option');
                option.value = area.strArea;
                option.textContent = area.strArea;
                areaSelect.appendChild(option);
            });
        })
        .catch(error => console.error('Error fetching areas:', error));

    // Search button event
    searchButton.addEventListener('click', async () => {
        const category = categorySelect.value;
        const area = areaSelect.value;
        
        if (!category || !area) {
            alert('Please select both a category and an area.');
            return;
        }
        
        resultsDiv.innerHTML = '<p>Loading...</p>';
        
        try {
            // Fetch both datasets concurrently
            const [categoryData, areaData] = await Promise.all([
                fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?c=${category}`).then(res => res.json()),
                fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?a=${area}`).then(res => res.json())
            ]);
            
            // Create a set of idMeals from category data
            const categoryMeals = new Set(categoryData.meals.map(meal => meal.idMeal));
            
            // Find intersection
            const fusionMeals = areaData.meals.filter(meal => categoryMeals.has(meal.idMeal));
            
            // Fetch full details for each fusion meal
            const detailedMeals = await fetchMealDetails(fusionMeals);
            
            // Display results
            displayResults(detailedMeals, area);
        } catch (error) {
            console.error('Error fetching recipes:', error);
            resultsDiv.innerHTML = '<p class="no-results">Error loading recipes. Please try again.</p>';
        }
    });

    // Function to fetch detailed info for multiple meals
    async function fetchMealDetails(meals) {
        const promises = meals.map(meal =>
            fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${meal.idMeal}`)
                .then(res => res.json())
                .then(data => data.meals ? data.meals[0] : null)
                .catch(error => {
                    console.error(`Error fetching details for ${meal.idMeal}:`, error);
                    return null;
                })
        );
        
        const results = await Promise.all(promises);
        return results.filter(meal => meal !== null); // Filter out failed fetches
    }

    function displayResults(meals, area) {
        resultsDiv.innerHTML = '';
        
        if (meals.length === 0) {
            resultsDiv.innerHTML = '<p class="no-results">No fusion recipes found for the selected category and area.</p>';
            return;
        }
        
        meals.forEach(meal => {
            const ingredients = getIngredients(meal);
            const instructions = meal.strInstructions || 'Instructions not available.';
            
            const card = document.createElement('div');
            card.className = 'recipe-card';
            card.innerHTML = `
                <img src="${meal.strMealThumb}" alt="${meal.strMeal}" loading="lazy">
                <h3>${meal.strMeal}</h3>
                <div class="ingredients">
                    <h4>Ingredients:</h4>
                    <ul>
                        ${ingredients.map(ing => `<li>${ing}</li>`).join('')}
                    </ul>
                </div>
                <div class="instructions">
                    <h4>Instructions:</h4>
                    <p>${instructions.replace(/\r\n/g, '<br>')}</p>
                </div>
                <button class="restaurant-btn" onclick="findRestaurants('${area}', '${meal.strMeal}')">Find Restaurants</button>
            `;
            resultsDiv.appendChild(card);
        });
    }

    // Helper function to extract and format ingredients
    function getIngredients(meal) {
        const ingredients = [];
        for (let i = 1; i <= 20; i++) {
            const ingredient = meal[`strIngredient${i}`];
            const measure = meal[`strMeasure${i}`];
            if (ingredient && ingredient.trim()) {
                ingredients.push(`${measure ? measure + ' ' : ''}${ingredient}`);
            }
        }
        return ingredients;
    }

    // Function to find restaurants (opens Google search)
    window.findRestaurants = function(area, mealName) {
        const query = encodeURIComponent(`${mealName} restaurants near me or in ${area}`);
        const url = `https://www.google.com/search?q=${query}&tbm=lcl&rlz=1C1CHBF_enUS851US851&oq=${query}`;
        window.open(url, '_blank');
    };
});