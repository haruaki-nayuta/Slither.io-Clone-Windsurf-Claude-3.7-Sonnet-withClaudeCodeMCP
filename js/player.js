/**
 * Player snake class for Slither.io game
 */

class PlayerSnake {
    constructor(x, y) {
        this.id = 'player';
        this.name = 'You';
        this.type = 'player';
        this.x = x;
        this.y = y;
        this.angle = 0;
        this.targetAngle = 0;
        this.speed = 3;
        this.boosting = false;
        this.length = Utils.INITIAL_SNAKE_LENGTH;
        this.width = Utils.INITIAL_SNAKE_WIDTH;
        this.segments = [];
        this.color = Utils.getSnakeColor('player');
        this.secondaryColor = Utils.getSnakeColor('player', 1);
        this.alive = true;
        this.score = 0;
        this.maxScore = 0;
        this.killedNPCs = 0;
        
        // Initialize segments
        this.initializeSegments();
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
    
    // Set target angle based on mouse position
    setTargetAngle(targetX, targetY) {
        this.targetAngle = Math.atan2(targetY - this.y, targetX - this.x);
    }
    
    // Set boosting state
    setBoost(boosting) {
        this.boosting = boosting && this.length > Utils.INITIAL_SNAKE_LENGTH * 1.5;
    }
    
    // Update snake position and angle
    update(deltaTime) {
        if (!this.alive) return;
        
        // Smooth rotation towards target angle
        const angleDiff = this.targetAngle - this.angle;
        
        // Handle angle wrapping
        let wrappedAngleDiff = angleDiff;
        if (angleDiff > Math.PI) wrappedAngleDiff = angleDiff - Math.PI * 2;
        if (angleDiff < -Math.PI) wrappedAngleDiff = angleDiff + Math.PI * 2;
        
        this.angle += wrappedAngleDiff * Utils.SNAKE_TURN_SPEED;
        
        // Keep angle in [0, 2π] range
        if (this.angle > Math.PI * 2) this.angle -= Math.PI * 2;
        if (this.angle < 0) this.angle += Math.PI * 2;
        
        // Calculate speed
        let currentSpeed = this.speed;
        if (this.boosting) {
            currentSpeed *= Utils.BOOST_SPEED_MULTIPLIER;
            // Lose length while boosting
            this.length -= Utils.BOOST_CONSUMPTION_RATE;
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
        if (this.score > this.maxScore) {
            this.maxScore = this.score;
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
    
    // Reset player for a new game
    reset(x, y) {
        this.x = x;
        this.y = y;
        this.angle = 0;
        this.targetAngle = 0;
        this.length = Utils.INITIAL_SNAKE_LENGTH;
        this.width = Utils.INITIAL_SNAKE_WIDTH;
        this.alive = true;
        this.score = 0;
        this.killedNPCs = 0;
        this.boosting = false;
        this.initializeSegments();
    }
    
    // Increment killed NPCs counter
    addKill() {
        this.killedNPCs++;
    }
}
