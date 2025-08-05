class PatchGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('scoreValue');
        this.vulnElement = document.getElementById('vulnCount');
        
        // Game settings
        this.gridSize = 30;
        this.rows = this.canvas.height / this.gridSize;
        this.cols = this.canvas.width / this.gridSize;
        
        // Load Patch sprite image
        this.patchImage = new Image();
        this.patchImage.src = 'patch_profile.png';
        this.imageLoaded = false;
        
        this.patchImage.onload = () => {
            this.imageLoaded = true;
        };
        
        // Game state
        this.score = 0;
        this.vulnerabilitiesRemaining = 0;
        this.gameRunning = false;
        
        // Player (Patch)
        this.player = {
            x: 1,
            y: 1,
            direction: 'right',
            nextDirection: null,
            horizontalOrientation: 'right' // Track last horizontal direction for sprite orientation
        };
        
        // Maze layout (1 = wall, 0 = path, 2 = vulnerability dot)
        // Classic Pacman-style maze - smaller and simpler
        // Central area kept open for future ghost spawn point
        this.maze = [
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,1],
            [1,2,1,1,2,1,1,1,2,1,1,2,1,1,1,2,1,1,2,1],
            [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
            [1,2,1,1,2,1,2,1,1,1,1,1,1,2,1,2,1,1,2,1],
            [1,2,2,2,2,1,2,2,2,1,1,2,2,2,1,2,2,2,2,1],
            [1,1,1,1,2,1,1,1,2,1,1,2,1,1,1,2,1,1,1,1],
            [0,0,0,1,2,1,2,2,2,2,2,2,2,2,1,2,1,0,0,0],
            [1,1,1,1,2,1,2,1,1,0,0,1,1,2,1,2,1,1,1,1],
            [2,2,2,2,2,2,2,1,0,0,0,0,1,2,2,2,2,2,2,2],
            [1,1,1,1,2,1,2,1,1,1,1,1,1,2,1,2,1,1,1,1],
            [0,0,0,1,2,1,2,2,2,2,2,2,2,2,1,2,1,0,0,0],
            [1,1,1,1,2,1,1,1,2,1,1,2,1,1,1,2,1,1,1,1],
            [1,2,2,2,2,1,2,2,2,1,1,2,2,2,1,2,2,2,2,1],
            [1,2,1,1,2,1,2,1,1,1,1,1,1,2,1,2,1,1,2,1],
            [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
            [1,2,1,1,2,1,1,1,2,1,1,2,1,1,1,2,1,1,2,1],
            [1,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
        ];
        
        this.init();
        this.setupEventListeners();
        this.gameLoop();
    }
    
    init() {
        this.countVulnerabilities();
        this.updateUI();
    }
    
    countVulnerabilities() {
        this.vulnerabilitiesRemaining = 0;
        for (let row = 0; row < this.maze.length; row++) {
            for (let col = 0; col < this.maze[row].length; col++) {
                if (this.maze[row][col] === 2) {
                    this.vulnerabilitiesRemaining++;
                }
            }
        }
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (!this.gameRunning && e.code === 'Space') {
                this.startGame();
                return;
            }
            
            if (!this.gameRunning) return;
            
            switch(e.code) {
                case 'ArrowUp':
                case 'KeyW':
                    this.player.nextDirection = 'up';
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.player.nextDirection = 'down';
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    this.player.nextDirection = 'left';
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.player.nextDirection = 'right';
                    break;
            }
        });
    }
    
    startGame() {
        this.gameRunning = true;
        this.score = 0;
        this.player.x = 1;
        this.player.y = 1;
        this.player.direction = 'right';
        this.player.nextDirection = null;
        this.player.horizontalOrientation = 'right';
        
        // Reset maze vulnerabilities to original state
        this.maze = [
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,1],
            [1,2,1,1,2,1,1,1,2,1,1,2,1,1,1,2,1,1,2,1],
            [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
            [1,2,1,1,2,1,2,1,1,1,1,1,1,2,1,2,1,1,2,1],
            [1,2,2,2,2,1,2,2,2,1,1,2,2,2,1,2,2,2,2,1],
            [1,1,1,1,2,1,1,1,2,1,1,2,1,1,1,2,1,1,1,1],
            [0,0,0,1,2,1,2,2,2,2,2,2,2,2,1,2,1,0,0,0],
            [1,1,1,1,2,1,2,1,1,0,0,1,1,2,1,2,1,1,1,1],
            [2,2,2,2,2,2,2,1,0,0,0,0,1,2,2,2,2,2,2,2],
            [1,1,1,1,2,1,2,1,1,1,1,1,1,2,1,2,1,1,1,1],
            [0,0,0,1,2,1,2,2,2,2,2,2,2,2,1,2,1,0,0,0],
            [1,1,1,1,2,1,1,1,2,1,1,2,1,1,1,2,1,1,1,1],
            [1,2,2,2,2,1,2,2,2,1,1,2,2,2,1,2,2,2,2,1],
            [1,2,1,1,2,1,2,1,1,1,1,1,1,2,1,2,1,1,2,1],
            [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
            [1,2,1,1,2,1,1,1,2,1,1,2,1,1,1,2,1,1,2,1],
            [1,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
        ];
        
        this.countVulnerabilities();
        this.updateUI();
    }
    
    canMove(x, y) {
        if (x < 0 || x >= this.cols || y < 0 || y >= this.rows) {
            return false;
        }
        return this.maze[y][x] !== 1; // Can move if not a wall
    }
    
    updatePlayer() {
        if (!this.gameRunning) return;
        
        // Try to change direction if requested
        if (this.player.nextDirection) {
            let newX = this.player.x;
            let newY = this.player.y;
            
            switch(this.player.nextDirection) {
                case 'up': newY--; break;
                case 'down': newY++; break;
                case 'left': newX--; break;
                case 'right': newX++; break;
            }
            
            if (this.canMove(newX, newY)) {
                this.player.direction = this.player.nextDirection;
                this.player.nextDirection = null;
                
                // Update horizontal orientation only for left/right movement
                if (this.player.direction === 'left' || this.player.direction === 'right') {
                    this.player.horizontalOrientation = this.player.direction;
                }
            }
        }
        
        // Move in current direction
        let newX = this.player.x;
        let newY = this.player.y;
        
        switch(this.player.direction) {
            case 'up': newY--; break;
            case 'down': newY++; break;
            case 'left': newX--; break;
            case 'right': newX++; break;
        }
        
        // Handle screen wrapping
        if (newX < 0) newX = this.cols - 1;
        if (newX >= this.cols) newX = 0;
        
        if (this.canMove(newX, newY)) {
            this.player.x = newX;
            this.player.y = newY;
            
            // Check for vulnerability collection
            if (this.maze[newY][newX] === 2) {
                this.maze[newY][newX] = 0; // Remove vulnerability
                this.score += 10;
                this.vulnerabilitiesRemaining--;
                
                if (this.vulnerabilitiesRemaining === 0) {
                    this.gameRunning = false;
                    setTimeout(() => {
                        alert('Congratulations! All vulnerabilities have been remediated!');
                    }, 100);
                }
            }
        }
        
        this.updateUI();
    }
    
    updateUI() {
        this.scoreElement.textContent = this.score;
        this.vulnElement.textContent = this.vulnerabilitiesRemaining;
    }
    
    drawMaze() {
        for (let row = 0; row < this.maze.length; row++) {
            for (let col = 0; col < this.maze[row].length; col++) {
                const x = col * this.gridSize;
                const y = row * this.gridSize;
                
                switch(this.maze[row][col]) {
                    case 1: // Wall
                        this.ctx.fillStyle = '#00d4aa';
                        this.ctx.fillRect(x, y, this.gridSize, this.gridSize);
                        this.ctx.fillStyle = '#008a6b';
                        this.ctx.fillRect(x + 2, y + 2, this.gridSize - 4, this.gridSize - 4);
                        break;
                    case 2: // Vulnerability dot
                        this.ctx.fillStyle = '#ff4757';
                        this.ctx.beginPath();
                        this.ctx.arc(x + this.gridSize/2, y + this.gridSize/2, 3, 0, Math.PI * 2);
                        this.ctx.fill();
                        break;
                }
            }
        }
    }
    
    drawPlayer() {
        if (!this.imageLoaded) {
            // Fallback to simple circle if image hasn't loaded yet
            const x = this.player.x * this.gridSize;
            const y = this.player.y * this.gridSize;
            this.ctx.fillStyle = '#f39c12';
            this.ctx.beginPath();
            this.ctx.arc(x + this.gridSize/2, y + this.gridSize/2, this.gridSize/3, 0, Math.PI * 2);
            this.ctx.fill();
            return;
        }
        
        const x = this.player.x * this.gridSize;
        const y = this.player.y * this.gridSize;
        
        // Save the current context state
        this.ctx.save();
        
        // Move to the center of the grid cell
        this.ctx.translate(x + this.gridSize/2, y + this.gridSize/2);
        
        // Flip horizontally if facing right (image faces left by default)
        // Use horizontalOrientation to maintain facing direction when moving up/down
        if (this.player.horizontalOrientation === 'right') {
            this.ctx.scale(-1, 1);
        }
        
        // Draw the image centered in the grid cell
        const imageSize = this.gridSize * 0.8; // Make it slightly smaller than the grid cell
        this.ctx.drawImage(
            this.patchImage, 
            -imageSize/2, 
            -imageSize/2, 
            imageSize, 
            imageSize
        );
        
        // Restore the context state
        this.ctx.restore();
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#0f0f23';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.drawMaze();
        this.drawPlayer();
        
        // Draw game over message
        if (!this.gameRunning && this.vulnerabilitiesRemaining > 0) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = '#00d4aa';
            this.ctx.font = '36px Courier New';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('SNYK PATCH', this.canvas.width/2, this.canvas.height/2 - 40);
            
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '18px Courier New';
            this.ctx.fillText('Vulnerability Hunter', this.canvas.width/2, this.canvas.height/2 - 10);
            this.ctx.fillText('Press SPACE to start hunting!', this.canvas.width/2, this.canvas.height/2 + 20);
        }
    }
    
    gameLoop() {
        this.updatePlayer();
        this.draw();
        
        setTimeout(() => {
            requestAnimationFrame(() => this.gameLoop());
        }, 150); // Control game speed
    }
}

// Start the game when page loads
window.addEventListener('load', () => {
    new PatchGame();
});