/**
 * Food system for Slither.io game
 */

class FoodSystem {
    constructor(mapSize, foodDensity = 1.0) {
        this.mapSize = mapSize;
        this.foodDensity = foodDensity;
        this.foods = [];
        this.foodCount = Math.floor(mapSize * mapSize / 10000 * foodDensity);
        this.maxFood = this.foodCount;
        this.foodColors = Utils.COLORS.food;
    }
    
    // Initialize food on the map
    initialize() {
        this.foods = [];
        for (let i = 0; i < this.foodCount; i++) {
            this.addRandomFood();
        }
    }
    
    // Add a single random food item
    addRandomFood() {
        const position = Utils.randomPosition();
        const food = {
            id: Date.now() + Math.random(),
            x: position.x,
            y: position.y,
            size: Utils.FOOD_SIZE,
            value: Utils.FOOD_VALUE,
            color: Utils.getFoodColor()
        };
        
        this.foods.push(food);
        return food;
    }
    
    // Add food at a specific position (when a snake dies)
    addFoodAt(x, y, amount, value = Utils.FOOD_VALUE) {
        const newFood = [];
        
        for (let i = 0; i < amount; i++) {
            // Scatter food around the position
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 100;
            
            const food = {
                id: Date.now() + Math.random(),
                x: Utils.wrapCoordinate(x + Math.cos(angle) * distance),
                y: Utils.wrapCoordinate(y + Math.sin(angle) * distance),
                size: Utils.FOOD_SIZE * 1.5, // Slightly larger food from dead snakes
                value: value,
                color: Utils.getFoodColor()
            };
            
            this.foods.push(food);
            newFood.push(food);
        }
        
        return newFood;
    }
    
    // Remove a food item
    removeFood(food) {
        const index = this.foods.findIndex(f => f.id === food.id);
        if (index !== -1) {
            this.foods.splice(index, 1);
            return true;
        }
        return false;
    }
    
    // Update food system - maintain food count
    update() {
        // Add more food if below threshold
        const foodDeficit = this.foodCount - this.foods.length;
        if (foodDeficit > 0) {
            for (let i = 0; i < Math.min(foodDeficit, 5); i++) {
                this.addRandomFood();
            }
        }
    }
    
    // Get food in viewport for rendering optimization
    getFoodInViewport(viewX, viewY, width, height, padding = 100) {
        return this.foods.filter(food => {
            return Utils.isInViewport(food.x, food.y, viewX, viewY, width, height, padding);
        });
    }
    
    // Set food density based on difficulty
    setFoodDensity(density) {
        this.foodDensity = density;
        this.foodCount = Math.floor(this.mapSize * this.mapSize / 10000 * this.foodDensity);
        this.maxFood = this.foodCount;
        
        // Adjust current food count
        if (this.foods.length > this.foodCount) {
            this.foods = this.foods.slice(0, this.foodCount);
        } else if (this.foods.length < this.foodCount) {
            const deficit = this.foodCount - this.foods.length;
            for (let i = 0; i < deficit; i++) {
                this.addRandomFood();
            }
        }
    }
}
