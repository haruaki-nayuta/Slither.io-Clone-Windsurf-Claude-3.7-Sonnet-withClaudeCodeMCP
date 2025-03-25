/**
 * NPC snake class for Slither.io game
 * Implements different behavior types: normal, aggressive, timid
 */

class NPCSnake {
    constructor(x, y, type = 'normal', id) {
        this.id = id || 'npc_' + Date.now() + Math.random();
        this.name = Utils.randomName();
        this.type = type; // 'normal', 'aggressive', or 'timid'
        this.x = x;
        this.y = y;
        this.angle = Math.random() * Math.PI * 2;
        this.targetAngle = this.angle;
        this.speed = 2.5;
        this.boosting = false;
        this.length = Utils.randomInt(
            Utils.INITIAL_SNAKE_LENGTH,
            Utils.INITIAL_SNAKE_LENGTH * 2
        );
        this.width = Utils.calculateSnakeWidth(this.length);
        this.segments = [];
        this.color = Utils.getSnakeColor(type);
        this.secondaryColor = Utils.getSnakeColor(type, 1);
        this.alive = true;
        this.score = 0;
        
        // AI state
        this.state = 'exploring';
        this.targetFood = null;
        this.targetSnake = null;
        this.dangerDirection = null;
        this.stateTimer = 0;
        this.reactionSpeed = 1.0; // Adjusted based on difficulty
        this.decisionInterval = Utils.randomInt(5, 15); // Frames between decisions
        this.frameCount = 0;
        
        // Behavior weights based on type
        this.behaviorWeights = this.getBehaviorWeights();
        
        // Initialize segments
        this.initializeSegments();
    }
    
    // Get behavior weights based on snake type
    getBehaviorWeights() {
        switch(this.type) {
            case 'normal':
                return {
                    exploring: 0.7,
                    attacking: 0.2,
                    fleeing: 0.1
                };
            case 'aggressive':
                return {
                    exploring: 0.3,
                    attacking: 0.6,
                    fleeing: 0.1
                };
            case 'timid':
                return {
                    exploring: 0.8,
                    attacking: 0.05,
                    fleeing: 0.15
                };
            default:
                return {
                    exploring: 0.7,
                    attacking: 0.2,
                    fleeing: 0.1
                };
        }
    }
    
    // Initialize body segments
    initializeSegments() {
        this.segments = [];
        
        // Create initial segments behind the head
        for (let i = 0; i < this.length; i++) {
            const distance = i * Utils.SNAKE_SEGMENT_SPACING;
            const segment = {
                x: this.x - Math.cos(this.angle) * distance,
                y: this.y - Math.sin(this.angle) * distance,
                width: this.width * (1 - i / (this.length * 2))
            };
            this.segments.push(segment);
        }
    }
    
    // Update NPC snake
    update(deltaTime, collisionSystem, player, npcs, foodSystem) {
        if (!this.alive) return;
        
        this.frameCount++;
        this.stateTimer -= deltaTime;
        
        // Make decisions at intervals to improve performance
        if (this.frameCount % this.decisionInterval === 0) {
            this.makeDecisions(collisionSystem, player, npcs, foodSystem);
        }
        
        // Smooth rotation towards target angle
        const angleDiff = this.targetAngle - this.angle;
        
        // Handle angle wrapping
        let wrappedAngleDiff = angleDiff;
        if (angleDiff > Math.PI) wrappedAngleDiff = angleDiff - Math.PI * 2;
        if (angleDiff < -Math.PI) wrappedAngleDiff = angleDiff + Math.PI * 2;
        
        this.angle += wrappedAngleDiff * Utils.SNAKE_TURN_SPEED * this.reactionSpeed;
        
        // Keep angle in [0, 2π] range
        if (this.angle > Math.PI * 2) this.angle -= Math.PI * 2;
        if (this.angle < 0) this.angle += Math.PI * 2;
        
        // Calculate speed
        let currentSpeed = this.speed;
        if (this.boosting) {
            currentSpeed *= Utils.BOOST_SPEED_MULTIPLIER;
            // Lose length while boosting
            this.length -= Utils.BOOST_CONSUMPTION_RATE * 0.7; // NPCs lose length slower than player
            if (this.length < Utils.INITIAL_SNAKE_LENGTH) {
                this.length = Utils.INITIAL_SNAKE_LENGTH;
                this.boosting = false;
            }
        }
        
        // Update position
        const dx = Math.cos(this.angle) * currentSpeed;
        const dy = Math.sin(this.angle) * currentSpeed;
        
        this.x += dx;
        this.y += dy;
        
        // Wrap around map boundaries
        this.x = Utils.wrapCoordinate(this.x);
        this.y = Utils.wrapCoordinate(this.y);
        
        // Update segments
        this.updateSegments();
        
        // Update width based on length
        this.width = Utils.calculateSnakeWidth(this.length);
        
        // Update score
        this.score = Math.floor(this.length - Utils.INITIAL_SNAKE_LENGTH);
    }
    
    // Make AI decisions
    makeDecisions(collisionSystem, player, npcs, foodSystem) {
        // Check for nearby food
        const nearbyFood = collisionSystem.findNearbyFood(this.x, this.y, 300);
        
        // Check for nearby snakes
        const nearbySnakes = collisionSystem.findNearbySnakes(this, 400);
        
        // Add player to nearby snakes if in range
        if (player && player.alive) {
            const distToPlayer = Utils.shortestDistance(this.x, this.y, player.x, player.y);
            if (distToPlayer < 400) {
                nearbySnakes.push({
                    snake: player,
                    distance: distToPlayer
                });
                
                // Sort by distance
                nearbySnakes.sort((a, b) => a.distance - b.distance);
            }
        }
        
        // Detect danger (larger snakes nearby)
        let danger = false;
        let dangerSnake = null;
        let dangerDirection = null;
        
        if (nearbySnakes.length > 0) {
            for (const nearby of nearbySnakes) {
                if (nearby.snake.length > this.length * 1.2) {
                    danger = true;
                    dangerSnake = nearby.snake;
                    dangerDirection = Utils.shortestAngle(
                        this.x, this.y, 
                        dangerSnake.x, dangerSnake.y
                    );
                    break;
                }
            }
        }
        
        // Detect opportunity (smaller snakes nearby)
        let opportunity = false;
        let targetSnake = null;
        
        if (nearbySnakes.length > 0 && this.length > Utils.INITIAL_SNAKE_LENGTH * 1.5) {
            for (const nearby of nearbySnakes) {
                if (nearby.snake.length < this.length * 0.8) {
                    opportunity = true;
                    targetSnake = nearby.snake;
                    break;
                }
            }
        }
        
        // Choose state based on weights and conditions
        if (danger && Math.random() < this.behaviorWeights.fleeing * 2) {
            this.state = 'fleeing';
            this.dangerDirection = dangerDirection;
            this.stateTimer = Utils.randomInt(3, 6);
            this.boosting = true;
        } else if (opportunity && Math.random() < this.behaviorWeights.attacking) {
            this.state = 'attacking';
            this.targetSnake = targetSnake;
            this.stateTimer = Utils.randomInt(5, 10);
            this.boosting = this.length > Utils.INITIAL_SNAKE_LENGTH * 2;
        } else if (nearbyFood.length > 0 && Math.random() < this.behaviorWeights.exploring) {
            this.state = 'collecting';
            this.targetFood = nearbyFood[0].food;
            this.stateTimer = Utils.randomInt(2, 5);
            this.boosting = false;
        } else if (Math.random() < 0.1) {
            // Occasionally change to exploring state
            this.state = 'exploring';
            this.targetAngle = Math.random() * Math.PI * 2;
            this.stateTimer = Utils.randomInt(5, 15);
            this.boosting = false;
        }
        
        // Execute current state
        switch (this.state) {
            case 'exploring':
                // Randomly change direction occasionally
                if (this.stateTimer <= 0 || Math.random() < 0.02) {
                    this.targetAngle = Math.random() * Math.PI * 2;
                    this.stateTimer = Utils.randomInt(5, 15);
                }
                
                // Avoid map edges
                const edgeBuffer = 100;
                if (this.x < edgeBuffer || this.x > Utils.MAP_SIZE - edgeBuffer ||
                    this.y < edgeBuffer || this.y > Utils.MAP_SIZE - edgeBuffer) {
                    // Turn towards center
                    this.targetAngle = Utils.shortestAngle(
                        this.x, this.y, 
                        Utils.MAP_SIZE / 2, Utils.MAP_SIZE / 2
                    );
                }
                break;
                
            case 'collecting':
                if (this.targetFood && foodSystem.foods.includes(this.targetFood)) {
                    // Move towards target food
                    this.targetAngle = Utils.shortestAngle(
                        this.x, this.y, 
                        this.targetFood.x, this.targetFood.y
                    );
                } else {
                    // Target food is gone, find new food or explore
                    if (nearbyFood.length > 0) {
                        this.targetFood = nearbyFood[0].food;
                    } else {
                        this.state = 'exploring';
                        this.targetAngle = Math.random() * Math.PI * 2;
                        this.stateTimer = Utils.randomInt(5, 15);
                    }
                }
                break;
                
            case 'attacking':
                if (this.targetSnake && this.targetSnake.alive) {
                    // Try to intercept target snake
                    const predictedX = this.targetSnake.x + Math.cos(this.targetSnake.angle) * this.targetSnake.speed * 10;
                    const predictedY = this.targetSnake.y + Math.sin(this.targetSnake.angle) * this.targetSnake.speed * 10;
                    
                    this.targetAngle = Utils.shortestAngle(
                        this.x, this.y, 
                        predictedX, predictedY
                    );
                    
                    // Boost if close enough
                    const distToTarget = Utils.shortestDistance(this.x, this.y, this.targetSnake.x, this.targetSnake.y);
                    this.boosting = distToTarget < 200 && this.length > Utils.INITIAL_SNAKE_LENGTH * 2;
                } else {
                    // Target is gone, go back to exploring
                    this.state = 'exploring';
                    this.targetSnake = null;
                }
                break;
                
            case 'fleeing':
                if (this.dangerDirection !== null) {
                    // Flee in opposite direction of danger
                    this.targetAngle = this.dangerDirection + Math.PI;
                    if (this.targetAngle > Math.PI * 2) {
                        this.targetAngle -= Math.PI * 2;
                    }
                    
                    // Boost while fleeing
                    this.boosting = this.length > Utils.INITIAL_SNAKE_LENGTH * 1.5;
                } else {
                    this.state = 'exploring';
                }
                break;
        }
        
        // Advanced behaviors for aggressive NPCs
        if (this.type === 'aggressive' && this.state === 'attacking' && this.targetSnake) {
            // Try to cut off the target
            const angleToTarget = Utils.shortestAngle(
                this.x, this.y, 
                this.targetSnake.x, this.targetSnake.y
            );
            
            // Adjust angle to try to intercept
            const interceptAngle = angleToTarget + Math.random() * 0.5 - 0.25;
            this.targetAngle = interceptAngle;
        }
        
        // Advanced behaviors for timid NPCs
        if (this.type === 'timid' && nearbySnakes.length > 0) {
            // Always try to keep distance from other snakes
            const closestSnake = nearbySnakes[0].snake;
            const angleToClosest = Utils.shortestAngle(
                this.x, this.y, 
                closestSnake.x, closestSnake.y
            );
            
            // Slightly adjust course away from other snakes
            if (nearbySnakes[0].distance < 200) {
                const avoidanceAngle = angleToClosest + Math.PI;
                this.targetAngle = Utils.lerp(this.targetAngle, avoidanceAngle, 0.3);
            }
        }
    }
    
    // Update body segments
    updateSegments() {
        // Update existing segments
        for (let i = 0; i < this.segments.length; i++) {
            if (i === 0) {
                // First segment follows head
                const targetX = this.x - Math.cos(this.angle) * Utils.SNAKE_SEGMENT_SPACING;
                const targetY = this.y - Math.sin(this.angle) * Utils.SNAKE_SEGMENT_SPACING;
                
                this.segments[i].x = Utils.lerp(this.segments[i].x, targetX, 0.5);
                this.segments[i].y = Utils.lerp(this.segments[i].y, targetY, 0.5);
            } else {
                // Each segment follows the one in front of it
                const targetX = this.segments[i-1].x;
                const targetY = this.segments[i-1].y;
                const dx = targetX - this.segments[i].x;
                const dy = targetY - this.segments[i].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist > Utils.SNAKE_SEGMENT_SPACING) {
                    const ratio = Utils.SNAKE_SEGMENT_SPACING / dist;
                    this.segments[i].x += dx * ratio;
                    this.segments[i].y += dy * ratio;
                }
            }
            
            // Wrap segment coordinates
            this.segments[i].x = Utils.wrapCoordinate(this.segments[i].x);
            this.segments[i].y = Utils.wrapCoordinate(this.segments[i].y);
            
            // Update segment width
            const widthRatio = 1 - i / (this.segments.length * 1.5);
            this.segments[i].width = this.width * Math.max(0.3, widthRatio);
        }
        
        // Add or remove segments based on current length
        const targetSegmentCount = Math.floor(this.length);
        
        if (this.segments.length < targetSegmentCount) {
            // Add new segments at the end
            const lastSegment = this.segments[this.segments.length - 1];
            const secondLastSegment = this.segments.length > 1 ? this.segments[this.segments.length - 2] : null;
            
            let angle = this.angle;
            if (secondLastSegment) {
                angle = Math.atan2(
                    lastSegment.y - secondLastSegment.y,
                    lastSegment.x - secondLastSegment.x
                );
            }
            
            const newSegment = {
                x: lastSegment.x - Math.cos(angle) * Utils.SNAKE_SEGMENT_SPACING,
                y: lastSegment.y - Math.sin(angle) * Utils.SNAKE_SEGMENT_SPACING,
                width: lastSegment.width * 0.9
            };
            
            this.segments.push(newSegment);
        } else if (this.segments.length > targetSegmentCount) {
            // Remove segments from the end
            this.segments = this.segments.slice(0, targetSegmentCount);
        }
    }
    
    // Handle food collection
    eatFood(food) {
        this.length += food.value;
        return true;
    }
    
    // Handle collision with another snake
    die() {
        this.alive = false;
    }
    
    // Set reaction speed based on difficulty
    setReactionSpeed(speed) {
        this.reactionSpeed = speed;
    }
}

// NPC Manager class to handle all NPCs
class NPCManager {
    constructor(mapSize) {
        this.mapSize = mapSize;
        this.npcs = [];
        this.maxNPCs = 40; // Default, will be set based on difficulty
        this.difficultySettings = null;
        this.spawnTimer = 0;
        this.maxSize = 10; // Maximum NPC size multiplier
        this.growthRate = 1.0; // How fast NPCs grow over time
        this.gameTime = 0; // Time since game started
    }
    
    // Initialize NPCs based on difficulty
    initialize(difficulty) {
        this.npcs = [];
        this.difficultySettings = Utils.DIFFICULTY[difficulty];
        this.maxNPCs = this.difficultySettings.npcCount;
        this.maxSize = this.difficultySettings.maxSize;
        this.growthRate = this.difficultySettings.growthRate;
        this.gameTime = 0;
        
        // Create initial NPCs
        const initialCount = Math.floor(this.maxNPCs * 0.7);
        for (let i = 0; i < initialCount; i++) {
            this.spawnNPC();
        }
    }
    
    // Spawn a new NPC
    spawnNPC() {
        if (this.npcs.length >= this.maxNPCs) return null;
        
        // Determine NPC type based on difficulty settings
        let type = 'normal';
        const rand = Math.random();
        
        if (rand < this.difficultySettings.aggressiveRatio) {
            type = 'aggressive';
        } else if (rand < this.difficultySettings.aggressiveRatio + this.difficultySettings.timidRatio) {
            type = 'timid';
        }
        
        // Random position away from player (center)
        const angle = Math.random() * Math.PI * 2;
        const distance = Utils.randomInt(1000, 2000);
        const x = Utils.wrapCoordinate(this.mapSize / 2 + Math.cos(angle) * distance);
        const y = Utils.wrapCoordinate(this.mapSize / 2 + Math.sin(angle) * distance);
        
        // Create NPC
        const npc = new NPCSnake(x, y, type);
        
        // Set reaction speed based on difficulty
        npc.setReactionSpeed(this.difficultySettings.reactionSpeed);
        
        // Adjust initial size based on game time (later NPCs are larger)
        const sizeMultiplier = 1 + Math.min(2, this.gameTime / 300) * this.growthRate;
        npc.length *= sizeMultiplier;
        
        // Cap size based on difficulty
        const maxLength = Utils.INITIAL_SNAKE_LENGTH * this.maxSize;
        if (npc.length > maxLength) {
            npc.length = maxLength;
        }
        
        npc.width = Utils.calculateSnakeWidth(npc.length);
        npc.initializeSegments();
        
        this.npcs.push(npc);
        return npc;
    }
    
    // Update all NPCs
    update(deltaTime, collisionSystem, player, foodSystem) {
        this.gameTime += deltaTime;
        this.spawnTimer -= deltaTime;
        
        // Spawn new NPCs if below max
        if (this.spawnTimer <= 0 && this.npcs.length < this.maxNPCs) {
            this.spawnNPC();
            this.spawnTimer = Utils.randomInt(3, 8);
        }
        
        // Update each NPC
        for (let i = this.npcs.length - 1; i >= 0; i--) {
            const npc = this.npcs[i];
            
            if (npc.alive) {
                npc.update(deltaTime, collisionSystem, player, this.npcs, foodSystem);
            } else {
                // Remove dead NPCs
                this.npcs.splice(i, 1);
            }
        }
    }
    
    // Get NPCs in viewport for rendering optimization
    getNPCsInViewport(viewX, viewY, width, height, padding = 200) {
        return this.npcs.filter(npc => {
            return Utils.isInViewport(npc.x, npc.y, viewX, viewY, width, height, padding);
        });
    }
    
    // Get top scoring NPCs for leaderboard
    getTopNPCs(count = 10) {
        return [...this.npcs]
            .sort((a, b) => b.score - a.score)
            .slice(0, count);
    }
}
