/**
 * Main Game class for Slither.io single player
 * Coordinates all game systems and handles the game loop
 */

class Game {
    constructor() {
        // Canvas setup
        this.canvas = document.getElementById('game-canvas');
        this.minimapCanvas = document.getElementById('minimap');
        
        // Game systems
        this.foodSystem = new FoodSystem(Utils.MAP_SIZE);
        this.collisionSystem = new CollisionSystem(Utils.MAP_SIZE);
        this.npcManager = new NPCManager(Utils.MAP_SIZE);
        this.renderer = new Renderer(this.canvas, this.minimapCanvas, Utils.MAP_SIZE);
        this.uiManager = new UIManager();
        
        // Game state
        this.player = null;
        this.gameActive = false;
        this.lastTime = 0;
        this.difficulty = 'normal';
        this.mousePosition = { x: 0, y: 0 };
        this.mouseDown = false;
        
        // Animation effects
        this.deathAnimations = [];
        this.foodAnimations = [];
        
        // Initialize event listeners
        this.initializeEventListeners();
    }
    
    // Initialize event listeners
    initializeEventListeners() {
        // Mouse movement for player control
        this.canvas.addEventListener('mousemove', (e) => {
            this.handleMouseMove(e);
        });
        
        // Mouse down/up for boost
        this.canvas.addEventListener('mousedown', () => {
            this.mouseDown = true;
        });
        
        this.canvas.addEventListener('mouseup', () => {
            this.mouseDown = false;
        });
        
        // Game start event from UI
        document.addEventListener('gameStart', (e) => {
            this.startGame(e.detail.difficulty);
        });
        
        // Prevent context menu on right click
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }
    
    // Handle mouse movement
    handleMouseMove(e) {
        if (!this.gameActive || !this.player || !this.player.alive) return;
        
        // Get mouse position relative to canvas
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Store mouse position for rendering
        this.mousePosition = { x: mouseX, y: mouseY };
        
        // Convert to world coordinates
        const worldX = mouseX + this.renderer.viewportX;
        const worldY = mouseY + this.renderer.viewportY;
        
        // Set player target angle
        this.player.setTargetAngle(worldX, worldY);
    }
    
    // Start a new game
    startGame(difficulty) {
        this.difficulty = difficulty;
        this.gameActive = true;
        
        // Initialize player
        this.player = new PlayerSnake(Utils.MAP_SIZE / 2, Utils.MAP_SIZE / 2);
        
        // Initialize game systems with difficulty settings
        this.foodSystem.setFoodDensity(Utils.DIFFICULTY[difficulty].foodDensity);
        this.foodSystem.initialize();
        this.npcManager.initialize(difficulty);
        
        // Start game loop
        this.lastTime = performance.now();
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    // Main game loop
    gameLoop(currentTime) {
        // Calculate delta time
        const deltaTime = (currentTime - this.lastTime) / 1000; // Convert to seconds
        this.lastTime = currentTime;
        
        // Update game state
        this.update(deltaTime);
        
        // Render game
        this.render();
        
        // Continue game loop if game is active
        if (this.gameActive) {
            requestAnimationFrame((time) => this.gameLoop(time));
        }
    }
    
    // Update game state
    update(deltaTime) {
        if (!this.gameActive) return;
        
        // Cap delta time to prevent large jumps
        const dt = Math.min(deltaTime, 0.1);
        
        // Update player
        if (this.player && this.player.alive) {
            // Update boost state
            this.player.setBoost(this.mouseDown);
            
            // Update player position
            this.player.update(dt);
            
            // Update viewport to follow player
            this.renderer.updateViewport(this.player.x, this.player.y);
            
            // Check for collisions
            const collisions = this.collisionSystem.checkCollisions(this.player);
            
            // Handle food collisions
            collisions.food.forEach(food => {
                if (this.player.eatFood(food)) {
                    this.foodSystem.removeFood(food);
                    
                    // Add food collection animation
                    this.foodAnimations.push({
                        x: food.x,
                        y: food.y,
                        color: food.color,
                        frame: 0
                    });
                }
            });
            
            // Handle snake collisions
            if (collisions.snake) {
                // Player died
                this.player.die();
                
                // Add death animation
                this.deathAnimations.push({
                    x: this.player.x,
                    y: this.player.y,
                    segments: [...this.player.segments],
                    color: this.player.color,
                    frame: 0
                });
                
                // Add food from dead player
                const foodAmount = Math.floor(this.player.length / 2);
                this.foodSystem.addFoodAt(this.player.x, this.player.y, foodAmount, 2);
                
                // Show game over screen after a delay
                setTimeout(() => {
                    this.uiManager.showGameOver({
                        score: this.player.maxScore,
                        killedNPCs: this.player.killedNPCs,
                        maxSize: Math.floor(this.player.maxScore + Utils.INITIAL_SNAKE_LENGTH)
                    });
                }, 2000);
            }
        }
        
        // Update NPCs
        this.npcManager.update(dt, this.collisionSystem, this.player, this.foodSystem);
        
        // Check NPC collisions
        this.npcManager.npcs.forEach(npc => {
            if (!npc.alive) return;
            
            const collisions = this.collisionSystem.checkCollisions(npc);
            
            // Handle food collisions
            collisions.food.forEach(food => {
                if (npc.eatFood(food)) {
                    this.foodSystem.removeFood(food);
                }
            });
            
            // Handle snake collisions
            if (collisions.snake) {
                // NPC died
                npc.die();
                
                // Add death animation
                this.deathAnimations.push({
                    x: npc.x,
                    y: npc.y,
                    segments: [...npc.segments],
                    color: npc.color,
                    frame: 0
                });
                
                // Add food from dead NPC
                const foodAmount = Math.floor(npc.length / 2);
                this.foodSystem.addFoodAt(npc.x, npc.y, foodAmount, 2);
                
                // If player killed the NPC, increment kill count
                if (collisions.snake.id === 'player' && this.player.alive) {
                    this.player.addKill();
                }
            }
        });
        
        // Update food system
        this.foodSystem.update();
        
        // Update collision system
        const allSnakes = [this.player, ...this.npcManager.npcs].filter(snake => snake && snake.alive);
        this.collisionSystem.updateGrid(allSnakes, this.foodSystem.foods);
        
        // Update UI
        if (this.player) {
            this.uiManager.updateScore(this.player.score);
            this.uiManager.updateLeaderboard(this.player, this.npcManager.getTopNPCs(9));
        }
        
        // Update animations
        this.updateAnimations(dt);
    }
    
    // Update animations
    updateAnimations(deltaTime) {
        // Update death animations
        for (let i = this.deathAnimations.length - 1; i >= 0; i--) {
            const anim = this.deathAnimations[i];
            anim.frame++;
            
            if (anim.frame >= 30) {
                this.deathAnimations.splice(i, 1);
            }
        }
        
        // Update food animations
        for (let i = this.foodAnimations.length - 1; i >= 0; i--) {
            const anim = this.foodAnimations[i];
            anim.frame++;
            
            if (anim.frame >= 10) {
                this.foodAnimations.splice(i, 1);
            }
        }
    }
    
    // Render game
    render() {
        // Clear canvas
        this.renderer.clear();
        
        // Draw background
        this.renderer.drawBackground();
        
        // Get visible food and NPCs for optimization
        const visibleFood = this.foodSystem.getFoodInViewport(
            this.renderer.viewportX, 
            this.renderer.viewportY,
            this.canvas.width,
            this.canvas.height,
            Utils.VIEWPORT_PADDING
        );
        
        const visibleNPCs = this.npcManager.getNPCsInViewport(
            this.renderer.viewportX, 
            this.renderer.viewportY,
            this.canvas.width,
            this.canvas.height,
            Utils.VIEWPORT_PADDING
        );
        
        // Draw food
        this.renderer.drawFood(visibleFood);
        
        // Draw NPCs
        visibleNPCs.forEach(npc => {
            this.renderer.drawSnake(npc);
        });
        
        // Draw player
        if (this.player && this.player.alive) {
            this.renderer.drawSnake(this.player);
        }
        
        // Draw animations
        this.deathAnimations.forEach(anim => {
            this.renderer.drawDeathAnimation(anim.x, anim.y, anim.segments, anim.color, anim.frame);
        });
        
        this.foodAnimations.forEach(anim => {
            this.renderer.drawFoodCollectionAnimation(anim.x, anim.y, anim.color, anim.frame);
        });
        
        // Draw minimap
        this.renderer.drawMinimap(this.player, this.npcManager.npcs);
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
});
