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
            
            // Display results
            displayResults(fusionMeals);
        } catch (error) {
            console.error('Error fetching recipes:', error);
            resultsDiv.innerHTML = '<p class="no-results">Error loading recipes. Please try again.</p>';
        }
    });

    function displayResults(meals) {
        resultsDiv.innerHTML = '';
        
        if (meals.length === 0) {
            resultsDiv.innerHTML = '<p class="no-results">No fusion recipes found for the selected category and area.</p>';
            return;
        }
        
        meals.forEach(meal => {
            const card = document.createElement('div');
            card.className = 'recipe-card';
            card.innerHTML = `
                <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
                <h3>${meal.strMeal}</h3>
            `;
            resultsDiv.appendChild(card);
        });
    }
});