/**
 * Renderer class for Slither.io game
 * Handles all drawing operations
 */

class Renderer {
    constructor(canvas, minimapCanvas, mapSize) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.minimapCanvas = minimapCanvas;
        this.minimapCtx = minimapCanvas.getContext('2d');
        this.mapSize = mapSize;
        this.viewportX = 0;
        this.viewportY = 0;
        this.scale = 1;
        this.backgroundPattern = null;
        
        // Initialize canvases
        this.resizeCanvases();
        this.createBackgroundPattern();
        
        // Bind resize event
        window.addEventListener('resize', () => this.resizeCanvases());
    }
    
    // Resize canvases to match window size
    resizeCanvases() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.minimapCanvas.width = Utils.MINIMAP_SIZE;
        this.minimapCanvas.height = Utils.MINIMAP_SIZE;
    }
    
    // Create hexagonal grid background pattern
    createBackgroundPattern() {
        const patternCanvas = document.createElement('canvas');
        const patternSize = 60;
        patternCanvas.width = patternSize * 2;
        patternCanvas.height = patternSize * Math.sqrt(3);
        
        const patternCtx = patternCanvas.getContext('2d');
        patternCtx.fillStyle = Utils.COLORS.background;
        patternCtx.fillRect(0, 0, patternCanvas.width, patternCanvas.height);
        
        patternCtx.strokeStyle = Utils.COLORS.grid;
        patternCtx.lineWidth = 1;
        
        // Draw hexagons
        const drawHexagon = (x, y, size) => {
            patternCtx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = Math.PI / 3 * i;
                const hx = x + size * Math.cos(angle);
                const hy = y + size * Math.sin(angle);
                if (i === 0) {
                    patternCtx.moveTo(hx, hy);
                } else {
                    patternCtx.lineTo(hx, hy);
                }
            }
            patternCtx.closePath();
            patternCtx.stroke();
        };
        
        // Draw first hexagon
        drawHexagon(patternSize / 2, patternSize * Math.sqrt(3) / 2, patternSize / 2);
        
        // Draw second hexagon
        drawHexagon(patternSize * 1.5, patternSize * Math.sqrt(3) / 2, patternSize / 2);
        
        // Create pattern
        this.backgroundPattern = this.ctx.createPattern(patternCanvas, 'repeat');
    }
    
    // Update viewport position to center on player
    updateViewport(playerX, playerY) {
        // Center viewport on player
        this.viewportX = playerX - this.canvas.width / 2;
        this.viewportY = playerY - this.canvas.height / 2;
    }
    
    // Convert world coordinates to screen coordinates
    worldToScreen(x, y) {
        // Handle map wrapping
        let screenX = x - this.viewportX;
        let screenY = y - this.viewportY;
        
        // Wrap coordinates if needed
        if (screenX < -this.canvas.width / 2) screenX += this.mapSize;
        if (screenX > this.mapSize - this.canvas.width / 2) screenX -= this.mapSize;
        if (screenY < -this.canvas.height / 2) screenY += this.mapSize;
        if (screenY > this.mapSize - this.canvas.height / 2) screenY -= this.mapSize;
        
        return { x: screenX, y: screenY };
    }
    
    // Clear the canvas
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.minimapCtx.clearRect(0, 0, this.minimapCanvas.width, this.minimapCanvas.height);
    }
    
    // Draw background
    drawBackground() {
        // Calculate pattern offset based on viewport
        const offsetX = -this.viewportX % 120;
        const offsetY = -this.viewportY % (60 * Math.sqrt(3));
        
        this.ctx.save();
        this.ctx.fillStyle = Utils.COLORS.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = this.backgroundPattern;
        this.ctx.translate(offsetX, offsetY);
        this.ctx.fillRect(-offsetX, -offsetY, this.canvas.width, this.canvas.height);
        this.ctx.restore();
    }
    
    // Draw food
    drawFood(food) {
        food.forEach(f => {
            const screenPos = this.worldToScreen(f.x, f.y);
            
            this.ctx.beginPath();
            this.ctx.arc(screenPos.x, screenPos.y, f.size / 2, 0, Math.PI * 2);
            this.ctx.fillStyle = f.color;
            this.ctx.fill();
        });
    }
    
    // Draw a snake (player or NPC)
    drawSnake(snake) {
        if (!snake.alive) return;
        
        // Draw segments (from tail to head)
        for (let i = snake.segments.length - 1; i >= 0; i--) {
            const segment = snake.segments[i];
            const screenPos = this.worldToScreen(segment.x, segment.y);
            
            // Skip if segment is outside viewport with padding
            if (screenPos.x < -Utils.VIEWPORT_PADDING || screenPos.x > this.canvas.width + Utils.VIEWPORT_PADDING ||
                screenPos.y < -Utils.VIEWPORT_PADDING || screenPos.y > this.canvas.height + Utils.VIEWPORT_PADDING) {
                continue;
            }
            
            // Draw segment
            this.ctx.beginPath();
            this.ctx.arc(screenPos.x, screenPos.y, segment.width / 2, 0, Math.PI * 2);
            
            // Alternate colors for segments
            if (i % 2 === 0) {
                this.ctx.fillStyle = snake.color;
            } else {
                this.ctx.fillStyle = snake.secondaryColor;
            }
            
            this.ctx.fill();
        }
        
        // Draw head
        const headPos = this.worldToScreen(snake.x, snake.y);
        
        this.ctx.beginPath();
        this.ctx.arc(headPos.x, headPos.y, snake.width / 2, 0, Math.PI * 2);
        this.ctx.fillStyle = snake.color;
        this.ctx.fill();
        
        // Draw eyes
        const eyeRadius = snake.width / 6;
        const eyeOffset = snake.width / 4;
        
        // Calculate eye positions based on snake angle
        const eyeX1 = headPos.x + Math.cos(snake.angle - Math.PI / 4) * eyeOffset;
        const eyeY1 = headPos.y + Math.sin(snake.angle - Math.PI / 4) * eyeOffset;
        const eyeX2 = headPos.x + Math.cos(snake.angle + Math.PI / 4) * eyeOffset;
        const eyeY2 = headPos.y + Math.sin(snake.angle + Math.PI / 4) * eyeOffset;
        
        // Draw eyes
        this.ctx.beginPath();
        this.ctx.arc(eyeX1, eyeY1, eyeRadius, 0, Math.PI * 2);
        this.ctx.arc(eyeX2, eyeY2, eyeRadius, 0, Math.PI * 2);
        this.ctx.fillStyle = 'white';
        this.ctx.fill();
        
        // Draw pupils
        const pupilRadius = eyeRadius / 2;
        const pupilOffset = eyeRadius / 4;
        
        const pupilX1 = eyeX1 + Math.cos(snake.angle) * pupilOffset;
        const pupilY1 = eyeY1 + Math.sin(snake.angle) * pupilOffset;
        const pupilX2 = eyeX2 + Math.cos(snake.angle) * pupilOffset;
        const pupilY2 = eyeY2 + Math.sin(snake.angle) * pupilOffset;
        
        this.ctx.beginPath();
        this.ctx.arc(pupilX1, pupilY1, pupilRadius, 0, Math.PI * 2);
        this.ctx.arc(pupilX2, pupilY2, pupilRadius, 0, Math.PI * 2);
        this.ctx.fillStyle = 'black';
        this.ctx.fill();
        
        // Draw name above snake if it's an NPC
        if (snake.id !== 'player') {
            this.ctx.font = '12px Arial';
            this.ctx.fillStyle = 'white';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'bottom';
            this.ctx.fillText(snake.name, headPos.x, headPos.y - snake.width / 2 - 5);
        }
    }
    
    // Draw minimap
    drawMinimap(player, npcs) {
        // Draw background
        this.minimapCtx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.minimapCtx.fillRect(0, 0, this.minimapCanvas.width, this.minimapCanvas.height);
        
        // Draw border
        this.minimapCtx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.minimapCtx.lineWidth = 1;
        this.minimapCtx.strokeRect(0, 0, this.minimapCanvas.width, this.minimapCanvas.height);
        
        // Calculate scale
        const scale = this.minimapCanvas.width / this.mapSize;
        
        // Draw viewport rectangle
        const viewX = this.viewportX * scale;
        const viewY = this.viewportY * scale;
        const viewWidth = this.canvas.width * scale;
        const viewHeight = this.canvas.height * scale;
        
        this.minimapCtx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        this.minimapCtx.lineWidth = 1;
        this.minimapCtx.strokeRect(viewX, viewY, viewWidth, viewHeight);
        
        // Draw NPCs
        npcs.forEach(npc => {
            if (!npc.alive) return;
            
            this.minimapCtx.fillStyle = npc.color;
            this.minimapCtx.beginPath();
            this.minimapCtx.arc(
                npc.x * scale,
                npc.y * scale,
                Math.max(2, npc.width * scale / 4),
                0, Math.PI * 2
            );
            this.minimapCtx.fill();
        });
        
        // Draw player
        if (player && player.alive) {
            this.minimapCtx.fillStyle = player.color;
            this.minimapCtx.beginPath();
            this.minimapCtx.arc(
                player.x * scale,
                player.y * scale,
                Math.max(3, player.width * scale / 3),
                0, Math.PI * 2
            );
            this.minimapCtx.fill();
        }
    }
    
    // Draw death animation
    drawDeathAnimation(x, y, segments, color, frame) {
        const maxFrame = 30;
        const progress = frame / maxFrame;
        
        // Draw exploding segments
        segments.forEach((segment, i) => {
            const angle = (i / segments.length) * Math.PI * 2;
            const distance = 100 * progress;
            
            const posX = x + Math.cos(angle) * distance;
            const posY = y + Math.sin(angle) * distance;
            const screenPos = this.worldToScreen(posX, posY);
            
            const size = segment.width * (1 - progress);
            
            this.ctx.beginPath();
            this.ctx.arc(screenPos.x, screenPos.y, size / 2, 0, Math.PI * 2);
            this.ctx.fillStyle = color;
            this.ctx.globalAlpha = 1 - progress;
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
        });
    }
    
    // Draw food collection animation
    drawFoodCollectionAnimation(x, y, color, frame) {
        const maxFrame = 10;
        const progress = frame / maxFrame;
        const screenPos = this.worldToScreen(x, y);
        
        this.ctx.beginPath();
        this.ctx.arc(screenPos.x, screenPos.y, (1 + progress * 2) * Utils.FOOD_SIZE, 0, Math.PI * 2);
        this.ctx.fillStyle = color;
        this.ctx.globalAlpha = 1 - progress;
        this.ctx.fill();
        this.ctx.globalAlpha = 1;
    }
}
