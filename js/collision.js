/**
 * Collision detection system for Slither.io game
 * Uses spatial partitioning for optimization
 */

class CollisionSystem {
    constructor(mapSize, cellSize = 250) {
        this.mapSize = mapSize;
        this.cellSize = cellSize;
        this.gridSize = Math.ceil(mapSize / cellSize);
        this.grid = this.createGrid();
    }
    
    // Create empty spatial grid
    createGrid() {
        const grid = [];
        for (let i = 0; i < this.gridSize; i++) {
            grid[i] = [];
            for (let j = 0; j < this.gridSize; j++) {
                grid[i][j] = {
                    snakes: [],
                    food: []
                };
            }
        }
        return grid;
    }
    
    // Clear all objects from the grid
    clearGrid() {
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                this.grid[i][j].snakes = [];
                this.grid[i][j].food = [];
            }
        }
    }
    
    // Get cell indices for a position
    getCellIndices(x, y) {
        // Ensure coordinates are within map bounds
        x = Utils.wrapCoordinate(x);
        y = Utils.wrapCoordinate(y);
        
        const i = Math.floor(x / this.cellSize);
        const j = Math.floor(y / this.cellSize);
        
        return {
            i: Math.min(i, this.gridSize - 1),
            j: Math.min(j, this.gridSize - 1)
        };
    }
    
    // Add a snake to the grid
    addSnake(snake) {
        // Add snake head to grid
        const headCell = this.getCellIndices(snake.x, snake.y);
        this.grid[headCell.i][headCell.j].snakes.push(snake);
        
        // Add snake body segments to grid
        for (let i = 0; i < snake.segments.length; i++) {
            const segment = snake.segments[i];
            const segmentCell = this.getCellIndices(segment.x, segment.y);
            
            // Avoid duplicate entries in the same cell
            if (segmentCell.i !== headCell.i || segmentCell.j !== headCell.j) {
                this.grid[segmentCell.i][segmentCell.j].snakes.push({
                    id: snake.id,
                    isSegment: true,
                    segmentIndex: i,
                    x: segment.x,
                    y: segment.y,
                    width: segment.width,
                    parent: snake
                });
            }
        }
    }
    
    // Add food to the grid
    addFood(food) {
        const cell = this.getCellIndices(food.x, food.y);
        this.grid[cell.i][cell.j].food.push(food);
    }
    
    // Update all objects in the grid
    updateGrid(snakes, food) {
        this.clearGrid();
        
        // Add all snakes to the grid
        snakes.forEach(snake => {
            this.addSnake(snake);
        });
        
        // Add all food to the grid
        food.forEach(f => {
            this.addFood(f);
        });
    }
    
    // Get neighboring cells for a position
    getNeighboringCells(x, y) {
        const center = this.getCellIndices(x, y);
        const cells = [];
        
        // Get 3x3 grid of cells around the center
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                const cellI = (center.i + i + this.gridSize) % this.gridSize;
                const cellJ = (center.j + j + this.gridSize) % this.gridSize;
                cells.push(this.grid[cellI][cellJ]);
            }
        }
        
        return cells;
    }
    
    // Check for collision between a snake head and other objects
    checkCollisions(snake) {
        const headX = snake.x;
        const headY = snake.y;
        const headRadius = snake.width / 2;
        
        // Get neighboring cells
        const cells = this.getNeighboringCells(headX, headY);
        
        const collisions = {
            food: [],
            snake: null
        };
        
        // Check for food collisions
        cells.forEach(cell => {
            cell.food.forEach(food => {
                const dist = Utils.shortestDistance(headX, headY, food.x, food.y);
                if (dist < headRadius + food.size / 2) {
                    collisions.food.push(food);
                }
            });
        });
        
        // Check for snake collisions
        cells.forEach(cell => {
            cell.snakes.forEach(otherSnake => {
                // Skip self head
                if (otherSnake.id === snake.id && !otherSnake.isSegment) {
                    return;
                }
                
                // Skip own segments if too close to head
                if (otherSnake.id === snake.id && otherSnake.isSegment && otherSnake.segmentIndex < 10) {
                    return;
                }
                
                let collisionX, collisionY, otherWidth;
                
                if (otherSnake.isSegment) {
                    collisionX = otherSnake.x;
                    collisionY = otherSnake.y;
                    otherWidth = otherSnake.width;
                } else {
                    collisionX = otherSnake.x;
                    collisionY = otherSnake.y;
                    otherWidth = otherSnake.width;
                }
                
                const dist = Utils.shortestDistance(headX, headY, collisionX, collisionY);
                const minDist = (headRadius + otherWidth / 2) * 0.8; // 0.8 for more forgiving collisions
                
                if (dist < minDist) {
                    collisions.snake = otherSnake.isSegment ? otherSnake.parent : otherSnake;
                }
            });
        });
        
        return collisions;
    }
    
    // Find nearby food for a snake
    findNearbyFood(x, y, radius) {
        const cells = this.getNeighboringCells(x, y);
        const nearbyFood = [];
        
        cells.forEach(cell => {
            cell.food.forEach(food => {
                const dist = Utils.shortestDistance(x, y, food.x, food.y);
                if (dist < radius) {
                    nearbyFood.push({
                        food: food,
                        distance: dist
                    });
                }
            });
        });
        
        // Sort by distance
        nearbyFood.sort((a, b) => a.distance - b.distance);
        
        return nearbyFood;
    }
    
    // Find nearby snakes for NPC decision making
    findNearbySnakes(snake, radius) {
        const cells = this.getNeighboringCells(snake.x, snake.y);
        const nearbySnakes = [];
        
        cells.forEach(cell => {
            cell.snakes.forEach(otherSnake => {
                // Skip self and segments
                if (otherSnake.id === snake.id || otherSnake.isSegment) {
                    return;
                }
                
                const dist = Utils.shortestDistance(snake.x, snake.y, otherSnake.x, otherSnake.y);
                if (dist < radius) {
                    nearbySnakes.push({
                        snake: otherSnake,
                        distance: dist
                    });
                }
            });
        });
        
        // Sort by distance
        nearbySnakes.sort((a, b) => a.distance - b.distance);
        
        return nearbySnakes;
    }
}
