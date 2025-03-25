/**
 * Utility functions for the Slither.io game
 */

const Utils = {
    // Constants
    MAP_SIZE: 5000,
    VIEWPORT_PADDING: 200,
    INITIAL_SNAKE_LENGTH: 10,
    INITIAL_SNAKE_WIDTH: 20,
    FOOD_SIZE: 10,
    FOOD_VALUE: 1,
    BOOST_SPEED_MULTIPLIER: 2,
    BOOST_CONSUMPTION_RATE: 0.3,
    SNAKE_SEGMENT_SPACING: 5,
    SNAKE_TURN_SPEED: 0.15,
    MINIMAP_SIZE: 150,
    
    // Difficulty settings
    DIFFICULTY: {
        easy: {
            npcCount: 20,
            aggressiveRatio: 0.1,
            timidRatio: 0.4,
            normalRatio: 0.5,
            reactionSpeed: 0.7,
            maxSize: 5,  // Multiplier of player's initial size
            foodDensity: 1.5,
            growthRate: 0.8
        },
        normal: {
            npcCount: 40,
            aggressiveRatio: 0.33,
            timidRatio: 0.33,
            normalRatio: 0.34,
            reactionSpeed: 1.0,
            maxSize: 10,
            foodDensity: 1.0,
            growthRate: 1.0
        },
        hard: {
            npcCount: 60,
            aggressiveRatio: 0.4,
            timidRatio: 0.2,
            normalRatio: 0.4,
            reactionSpeed: 1.2,
            maxSize: 20,
            foodDensity: 0.7,
            growthRate: 1.2
        }
    },
    
    // Colors
    COLORS: {
        player: ['#FF5722', '#FF9800', '#FFC107'],
        normal: ['#4CAF50', '#8BC34A', '#CDDC39'],
        aggressive: ['#F44336', '#E91E63', '#9C27B0'],
        timid: ['#2196F3', '#03A9F4', '#00BCD4'],
        food: ['#FFEB3B', '#FFC107', '#FF9800', '#FF5722'],
        background: '#111111',
        grid: '#1a1a1a'
    },
    
    // Helper functions
    randomInt: function(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    
    randomFloat: function(min, max) {
        return Math.random() * (max - min) + min;
    },
    
    distance: function(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
    },
    
    angle: function(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    },
    
    // Wrap coordinates to keep within map boundaries
    wrapCoordinate: function(value) {
        const size = this.MAP_SIZE;
        if (value < 0) return value + size;
        if (value >= size) return value - size;
        return value;
    },
    
    // Calculate shortest distance considering map wrapping
    shortestDistance: function(x1, y1, x2, y2) {
        const size = this.MAP_SIZE;
        const dx = Math.abs(x2 - x1);
        const dy = Math.abs(y2 - y1);
        
        // Consider wrapping around the map
        const wrappedDx = Math.min(dx, size - dx);
        const wrappedDy = Math.min(dy, size - dy);
        
        return Math.sqrt(wrappedDx * wrappedDx + wrappedDy * wrappedDy);
    },
    
    // Calculate angle considering map wrapping
    shortestAngle: function(x1, y1, x2, y2) {
        const size = this.MAP_SIZE;
        const dx = x2 - x1;
        const dy = y2 - y1;
        
        // Check if wrapping would be shorter
        const wrappedX = dx > size / 2 ? dx - size : (dx < -size / 2 ? dx + size : dx);
        const wrappedY = dy > size / 2 ? dy - size : (dy < -size / 2 ? dy + size : dy);
        
        return Math.atan2(wrappedY, wrappedX);
    },
    
    // Get a random position on the map
    randomPosition: function() {
        return {
            x: this.randomInt(0, this.MAP_SIZE),
            y: this.randomInt(0, this.MAP_SIZE)
        };
    },
    
    // Format time in MM:SS format
    formatTime: function(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    },
    
    // Lerp (Linear interpolation)
    lerp: function(start, end, amt) {
        return (1 - amt) * start + amt * end;
    },
    
    // Clamp a value between min and max
    clamp: function(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },
    
    // Check if a point is in the viewport
    isInViewport: function(x, y, viewportX, viewportY, width, height, padding = 0) {
        return x >= viewportX - padding && 
               x <= viewportX + width + padding && 
               y >= viewportY - padding && 
               y <= viewportY + height + padding;
    },
    
    // Generate a random color
    randomColor: function() {
        return `hsl(${this.randomInt(0, 360)}, 70%, 50%)`;
    },
    
    // Generate a random name for NPCs
    randomName: function() {
        const names = [
            "Slithery", "Wiggles", "Fangs", "Hissy", "Scales", 
            "Venom", "Coil", "Serpent", "Python", "Cobra", 
            "Mamba", "Viper", "Anaconda", "Boa", "Rattler",
            "Sidewinder", "Adder", "Krait", "Taipan", "Asp"
        ];
        return names[this.randomInt(0, names.length - 1)] + this.randomInt(1, 999);
    },
    
    // Get a color based on snake type
    getSnakeColor: function(type, index = 0) {
        return this.COLORS[type][index % this.COLORS[type].length];
    },
    
    // Get random food color
    getFoodColor: function() {
        return this.COLORS.food[this.randomInt(0, this.COLORS.food.length - 1)];
    },
    
    // Calculate snake width based on length
    calculateSnakeWidth: function(length) {
        return Math.min(40, this.INITIAL_SNAKE_WIDTH * Math.sqrt(length / this.INITIAL_SNAKE_LENGTH));
    }
};
