/**
 * UI Manager for Slither.io game
 * Handles all UI elements and interactions
 */

class UIManager {
    constructor() {
        // UI elements
        this.scoreDisplay = document.getElementById('current-score');
        this.leaderboardList = document.getElementById('leaderboard-list');
        this.gameMenu = document.getElementById('game-menu');
        this.gameOver = document.getElementById('game-over');
        this.difficultyButtons = document.querySelectorAll('.difficulty-btn');
        this.startButton = document.getElementById('start-game-btn');
        this.restartButton = document.getElementById('restart-btn');
        this.finalScore = document.getElementById('final-score');
        this.playTime = document.getElementById('play-time');
        this.killedNPCs = document.getElementById('killed-npcs');
        this.maxSize = document.getElementById('max-size');
        
        // Game state
        this.selectedDifficulty = 'normal';
        this.gameActive = false;
        this.gameStartTime = 0;
        this.gameContainer = document.getElementById('game-container');
        
        // Initialize event listeners
        this.initializeEventListeners();
        
        // Load high score from localStorage
        this.highScore = this.loadHighScore();
    }
    
    // Initialize event listeners for UI elements
    initializeEventListeners() {
        // Difficulty selection
        this.difficultyButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.selectDifficulty(button.dataset.difficulty);
            });
        });
        
        // Start game button
        this.startButton.addEventListener('click', () => {
            this.startGame();
        });
        
        // Restart game button
        this.restartButton.addEventListener('click', () => {
            this.hideGameOver();
            this.startGame();
        });
        
        // Select default difficulty
        this.selectDifficulty('normal');
    }
    
    // Select difficulty
    selectDifficulty(difficulty) {
        this.selectedDifficulty = difficulty;
        
        // Update UI
        this.difficultyButtons.forEach(button => {
            if (button.dataset.difficulty === difficulty) {
                button.classList.add('selected');
            } else {
                button.classList.remove('selected');
            }
        });
    }
    
    // Start game
    startGame() {
        this.gameActive = true;
        this.gameStartTime = Date.now();
        this.gameContainer.classList.add('game-active');
        this.hideMenu();
        
        // Dispatch custom event for game to handle
        const event = new CustomEvent('gameStart', {
            detail: { difficulty: this.selectedDifficulty }
        });
        document.dispatchEvent(event);
    }
    
    // Hide menu
    hideMenu() {
        this.gameMenu.style.display = 'none';
    }
    
    // Show menu
    showMenu() {
        this.gameMenu.style.display = 'block';
        this.gameContainer.classList.remove('game-active');
    }
    
    // Show game over screen
    showGameOver(stats) {
        this.gameActive = false;
        this.gameOver.style.display = 'block';
        
        // Update stats
        this.finalScore.textContent = stats.score;
        this.playTime.textContent = Utils.formatTime((Date.now() - this.gameStartTime) / 1000);
        this.killedNPCs.textContent = stats.killedNPCs;
        this.maxSize.textContent = stats.maxSize;
        
        // Check for high score
        if (stats.score > this.highScore) {
            this.highScore = stats.score;
            this.saveHighScore(this.highScore);
        }
    }
    
    // Hide game over screen
    hideGameOver() {
        this.gameOver.style.display = 'none';
    }
    
    // Update score display
    updateScore(score) {
        this.scoreDisplay.textContent = score;
    }
    
    // Update leaderboard
    updateLeaderboard(player, npcs) {
        // Clear current leaderboard
        this.leaderboardList.innerHTML = '';
        
        // Combine player and NPCs
        const entities = [...npcs];
        if (player && player.alive) {
            entities.push(player);
        }
        
        // Sort by score
        entities.sort((a, b) => b.score - a.score);
        
        // Take top 10
        const top10 = entities.slice(0, 10);
        
        // Add to leaderboard
        top10.forEach((entity, index) => {
            const listItem = document.createElement('li');
            listItem.textContent = `${index + 1}. ${entity.name}: ${entity.score}`;
            
            // Highlight player
            if (entity.id === 'player') {
                listItem.classList.add('player');
            }
            
            this.leaderboardList.appendChild(listItem);
        });
    }
    
    // Load high score from localStorage
    loadHighScore() {
        const highScore = localStorage.getItem('slitherHighScore');
        return highScore ? parseInt(highScore) : 0;
    }
    
    // Save high score to localStorage
    saveHighScore(score) {
        localStorage.setItem('slitherHighScore', score.toString());
    }
}
