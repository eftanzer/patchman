class PatchGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('scoreValue');
        this.vulnElement = document.getElementById('vulnCount');
        
        // Mobile detection and responsive setup
        this.isMobile = this.detectMobile();
        this.setupResponsiveCanvas();
        
        // Game settings - maintain better proportions
        this.calculateGridSize();
        this.rows = Math.floor(this.canvas.height / this.gridSize);
        this.cols = Math.floor(this.canvas.width / this.gridSize);
        
        // Touch controls
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchEndX = 0;
        this.touchEndY = 0;
        this.minSwipeDistance = 30;
        
        // Overlay elements
        this.overlay = document.getElementById('gameOverlay');
        this.overlayTitle = document.getElementById('overlayTitle');
        this.overlayMessage = document.getElementById('overlayMessage');
        
        // Load Patch sprite image
        this.patchImage = new Image();
        this.patchImage.src = 'patch_profile.png';
        this.imageLoaded = false;
        
        this.patchImage.onload = () => {
            this.imageLoaded = true;
        };
        
        // Load power-up images
        this.powerUpImages = {};
        this.powerUpImagesLoaded = 0;
        const powerUpFiles = ['os.png', 'code.png', 'container.png', 'iac.png'];
        
        powerUpFiles.forEach(file => {
            const img = new Image();
            img.src = file;
            img.onload = () => {
                this.powerUpImagesLoaded++;
            };
            this.powerUpImages[file.split('.')[0]] = img;
        });
        
        // Game state
        this.score = 0;
        this.vulnerabilitiesRemaining = 0;
        this.gameRunning = false;
        this.gameStarted = false; // Track if game has ever been started
        this.gameStartTime = 0;
        this.ghostsVulnerable = false;
        this.vulnerableTimeLeft = 0;
        
        // Player (Patch)
        this.player = {
            x: 1,
            y: 1,
            direction: 'right',
            nextDirection: null,
            horizontalOrientation: 'right' // Track last horizontal direction for sprite orientation
        };
        
        // Ghosts (Security Threats) - positioned with staggered activation times
        this.ghosts = [
            {
                id: 'prompt-injection',
                x: 9, y: 9,  // row 9, column 9
                direction: 'up',
                color: '#ff4757',
                name: 'Prompt Injection',
                moveCounter: 0,
                activationTime: 5000  // 5 seconds
            },
            {
                id: 'supply-chain',
                x: 10, y: 9,  // row 9, column 10
                direction: 'up',
                color: '#ff6b9d',
                name: 'Supply Chain',
                moveCounter: 0,
                activationTime: 8000  // 8 seconds
            },
            {
                id: 'data-poisoning',
                x: 8, y: 9,  // row 9, column 8
                direction: 'right',
                color: '#ffa726',
                name: 'Data & Model Poisoning',
                moveCounter: 0,
                activationTime: 11000  // 11 seconds
            },
            {
                id: 'prompt-leakage',
                x: 11, y: 9,  // row 9, column 11
                direction: 'left',
                color: '#26c6da',
                name: 'System Prompt Leakage',
                moveCounter: 0,
                activationTime: 14000  // 14 seconds
            }
        ];
        
        // Maze layout (1 = wall, 0 = path, 2 = vulnerability dot, 3 = power-up)
        // Classic Pacman-style maze - smaller and simpler
        // Central area kept open for ghost spawn point
        this.maze = [
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,3,1],
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
            [1,3,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,3,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
        ];
        
        this.init();
        this.setupEventListeners();
        this.setupOverlayListeners();
        this.gameLoop();
    }
    
    showOverlay(title, message) {
        this.overlayTitle.textContent = title;
        this.overlayMessage.textContent = message;
        this.overlay.classList.remove('hidden');
    }
    
    hideOverlay() {
        this.overlay.classList.add('hidden');
    }
    
    setupOverlayListeners() {
        // Spacebar restart from overlay
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !this.overlay.classList.contains('hidden')) {
                e.preventDefault();
                this.hideOverlay();
                this.startGame();
            }
        });
        
        // Click/tap overlay to restart
        this.overlay.addEventListener('click', () => {
            this.hideOverlay();
            this.startGame();
        });
        
        // Touch support for overlay
        this.overlay.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.hideOverlay();
            this.startGame();
        });
    }
    
    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
               ('ontouchstart' in window) || 
               (navigator.maxTouchPoints > 0) ||
               window.innerWidth <= 768;
    }
    
    setupResponsiveCanvas() {
        const container = this.canvas.parentElement;
        
        if (this.isMobile) {
            // For mobile, calculate optimal size while maintaining good visibility
            const screenWidth = window.innerWidth;
            const screenHeight = window.innerHeight;
            const availableWidth = screenWidth - 16; // Account for body padding
            
            // Calculate available height more generously
            // Header (~80px) + game-info (~40px) + controls (~220px) + margins (~60px) = ~400px
            const uiHeight = 400;
            const availableHeight = screenHeight - uiHeight;
            
            // Use most of the available space, but ensure it's not too small
            const minSize = Math.min(screenWidth * 0.75, 320);
            const maxSize = Math.min(availableWidth, 600);
            const idealSize = Math.min(availableWidth, availableHeight);
            
            // Choose size that gives good game experience
            const size = Math.max(minSize, Math.min(maxSize, idealSize));
            
            this.canvas.width = size;
            this.canvas.height = size;
        } else {
            // Desktop size
            this.canvas.width = 600;
            this.canvas.height = 600;
        }
        
        // Adjust canvas display size
        this.canvas.style.width = this.canvas.width + 'px';
        this.canvas.style.height = this.canvas.height + 'px';
    }
    
    calculateGridSize() {
        if (this.isMobile) {
            // For mobile, ensure grid size maintains good playability
            // The maze is 20x19, so we need to fit that properly
            const canvasSize = Math.min(this.canvas.width, this.canvas.height);
            
            // Calculate grid size to fit the 20x19 maze with some padding
            const potentialGridSize = Math.floor(canvasSize / 20);
            
            // Ensure minimum grid size for touch friendliness (at least 15px)
            this.gridSize = Math.max(15, Math.min(potentialGridSize, 35));
        } else {
            // Desktop standard grid size
            this.gridSize = 30;
        }
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
        // Keyboard controls (desktop)
        document.addEventListener('keydown', (e) => {
            if (!this.gameStarted && e.code === 'Space') {
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
        
        // Mobile touch controls
        this.setupMobileControls();
        this.setupSwipeControls();
        
        // Window resize handling
        window.addEventListener('resize', () => {
            if (this.isMobile) {
                this.setupResponsiveCanvas();
                this.calculateGridSize();
                this.rows = Math.floor(this.canvas.height / this.gridSize);
                this.cols = Math.floor(this.canvas.width / this.gridSize);
            }
        });
    }
    
    setupMobileControls() {
        // Touch control buttons
        const controlButtons = document.querySelectorAll('[data-direction]');
        const startButton = document.getElementById('startBtn');
        
        // Debug info for mobile controls setup
        if (this.isMobile) {
            console.log('Setting up mobile controls. Start button found:', !!startButton);
            console.log('Control buttons found:', controlButtons.length);
        }
        
        controlButtons.forEach(button => {
            const direction = button.getAttribute('data-direction');
            
            // Prevent default touch behavior
            button.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (this.gameRunning) {
                    this.player.nextDirection = direction;
                }
            });
            
            // Also support mouse clicks for testing
            button.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.gameRunning) {
                    this.player.nextDirection = direction;
                }
            });
        });
        
        // Start button with multiple event types for better compatibility
        if (startButton) {
            // Modern pointer events (works for both touch and mouse)
            if ('PointerEvent' in window) {
                startButton.addEventListener('pointerdown', (e) => {
                    e.preventDefault();
                    if (!this.gameStarted) {
                        this.startGame();
                    }
                });
            }
            
            // Touch events
            startButton.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (!this.gameStarted) {
                    this.startGame();
                }
            });
            
            startButton.addEventListener('touchend', (e) => {
                e.preventDefault();
                if (!this.gameStarted) {
                    this.startGame();
                }
            });
            
            // Mouse events
            startButton.addEventListener('click', (e) => {
                e.preventDefault();
                if (!this.gameStarted) {
                    this.startGame();
                }
            });
            
            startButton.addEventListener('mousedown', (e) => {
                e.preventDefault();
                if (!this.gameStarted) {
                    this.startGame();
                }
            });
            
            // Add visual feedback
            startButton.style.cursor = 'pointer';
            startButton.style.userSelect = 'none';
            
        } else {
            // Start button not found, retry after a short delay
            setTimeout(() => {
                this.setupMobileControls();
            }, 100);
        }
    }
    
    setupSwipeControls() {
        // Canvas swipe controls
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.touchStartX = touch.clientX;
            this.touchStartY = touch.clientY;
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (!this.gameRunning) return;
            
            const touch = e.changedTouches[0];
            this.touchEndX = touch.clientX;
            this.touchEndY = touch.clientY;
            
            this.handleSwipeGesture();
        });
        
        // Prevent scrolling on touch
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
        });
    }
    
    handleSwipeGesture() {
        const deltaX = this.touchEndX - this.touchStartX;
        const deltaY = this.touchEndY - this.touchStartY;
        
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);
        
        // Check if swipe is long enough
        if (Math.max(absX, absY) < this.minSwipeDistance) {
            return;
        }
        
        // Determine swipe direction
        if (absX > absY) {
            // Horizontal swipe
            if (deltaX > 0) {
                this.player.nextDirection = 'right';
            } else {
                this.player.nextDirection = 'left';
            }
        } else {
            // Vertical swipe
            if (deltaY > 0) {
                this.player.nextDirection = 'down';
            } else {
                this.player.nextDirection = 'up';
            }
        }
    }
    
    startGame() {
        this.hideOverlay(); // Hide any visible overlay
        this.gameRunning = true;
        this.gameStarted = true; // Mark that game has been started
        this.score = 0;
        this.gameStartTime = Date.now();
        
        // Reset player
        this.player.x = 1;
        this.player.y = 1;
        this.player.direction = 'right';
        this.player.nextDirection = null;
        this.player.horizontalOrientation = 'right';
        
        // Reset ghosts to home positions with staggered activation
        this.ghosts[0].x = 9; this.ghosts[0].y = 9; this.ghosts[0].direction = 'up'; this.ghosts[0].moveCounter = 0;    // row 9, col 9 - 5 seconds
        this.ghosts[1].x = 10; this.ghosts[1].y = 9; this.ghosts[1].direction = 'up'; this.ghosts[1].moveCounter = 0; // row 9, col 10 - 8 seconds
        this.ghosts[2].x = 8; this.ghosts[2].y = 9; this.ghosts[2].direction = 'right'; this.ghosts[2].moveCounter = 0; // row 9, col 8 - 11 seconds
        this.ghosts[3].x = 11; this.ghosts[3].y = 9; this.ghosts[3].direction = 'left'; this.ghosts[3].moveCounter = 0; // row 9, col 11 - 14 seconds
        
        // Reset maze vulnerabilities to original state
        this.maze = [
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,3,1],
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
            [1,3,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,3,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
        ];
        
        this.countVulnerabilities();
        this.updateUI();
    }
    
    canMove(x, y) {
        if (x < 0 || x >= this.maze[0].length || y < 0 || y >= this.maze.length) {
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
        if (newX < 0) newX = this.maze[0].length - 1;
        if (newX >= this.maze[0].length) newX = 0;
        
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
                        this.showOverlay('🎉 VICTORY! 🎉', 'All vulnerabilities have been remediated!');
                    }, 100);
                }
            }
            
            // Check for power-up collection
            if (this.maze[newY][newX] === 3) {
                this.maze[newY][newX] = 0; // Remove power-up
                this.score += 50;
                this.activatePowerUp();
            }
        }
        
        this.updateUI();
        
        // Check collision with ghosts
        this.checkGhostCollisions();
    }
    
    updateGhosts() {
        if (!this.gameRunning) return;
        
        const currentTime = Date.now() - this.gameStartTime;
        
        this.ghosts.forEach(ghost => {
            // Check if this ghost should be active based on its activation time
            if (currentTime < ghost.activationTime) {
                return; // Ghost not yet active
            }
            
            // Ghosts move at 80% speed of Patch (skip every 5th frame)
            ghost.moveCounter++;
            if (ghost.moveCounter % 5 === 0) {
                return; // Skip every 5th frame (move 4 out of 5 frames)
            }
            
            // Improved AI: fluid movement with smart pathfinding
            const directions = ['up', 'down', 'left', 'right'];
            const possibleMoves = [];
            
            // Check all possible directions
            directions.forEach(dir => {
                let newX = ghost.x;
                let newY = ghost.y;
                
                switch(dir) {
                    case 'up': newY--; break;
                    case 'down': newY++; break;
                    case 'left': newX--; break;
                    case 'right': newX++; break;
                }
                
                // Handle screen wrapping
                if (newX < 0) newX = this.maze[0].length - 1;
                if (newX >= this.maze[0].length) newX = 0;
                
                if (this.canMove(newX, newY)) {
                    possibleMoves.push({direction: dir, x: newX, y: newY});
                }
            });
            
            if (possibleMoves.length > 0) {
                let chosenMove;
                
                // Prefer to continue in current direction if possible
                const continueMove = possibleMoves.find(move => move.direction === ghost.direction);
                
                if (continueMove && possibleMoves.length > 1) {
                    // 70% chance to continue current direction for fluid movement
                    if (Math.random() < 0.7) {
                        chosenMove = continueMove;
                    }
                }
                
                if (!chosenMove) {
                    // Choose move toward player, but avoid reversing direction unless no choice
                    const oppositeDirection = this.getOppositeDirection(ghost.direction);
                    let filteredMoves = possibleMoves.filter(move => move.direction !== oppositeDirection);
                    
                    // If no non-reverse moves available, allow any move
                    if (filteredMoves.length === 0) {
                        filteredMoves = possibleMoves;
                    }
                    
                    // Find best move toward player from filtered moves
                    chosenMove = filteredMoves[0];
                    let bestDistance = this.getDistance(chosenMove.x, chosenMove.y, this.player.x, this.player.y);
                    
                    filteredMoves.forEach(move => {
                        const distance = this.getDistance(move.x, move.y, this.player.x, this.player.y);
                        if (distance < bestDistance) {
                            bestDistance = distance;
                            chosenMove = move;
                        }
                    });
                }
                
                ghost.x = chosenMove.x;
                ghost.y = chosenMove.y;
                ghost.direction = chosenMove.direction;
            }
        });
    }
    
    getDistance(x1, y1, x2, y2) {
        return Math.abs(x1 - x2) + Math.abs(y1 - y2);
    }
    
    getOppositeDirection(direction) {
        const opposites = {
            'up': 'down',
            'down': 'up',
            'left': 'right',
            'right': 'left'
        };
        return opposites[direction];
    }
    
    activatePowerUp() {
        this.ghostsVulnerable = true;
        this.vulnerableTimeLeft = 10000; // 10 seconds
        
        // Reset all ghosts' eaten state
        this.ghosts.forEach(ghost => {
            ghost.eaten = false;
        });
    }
    
    updatePowerUpTimer() {
        if (this.ghostsVulnerable && this.vulnerableTimeLeft > 0) {
            this.vulnerableTimeLeft -= 150; // Decrease by game loop interval
            
            if (this.vulnerableTimeLeft <= 0) {
                this.ghostsVulnerable = false;
                // Restore eaten ghosts to home
                this.ghosts.forEach(ghost => {
                    if (ghost.eaten) {
                        ghost.eaten = false;
                        // Reset to home position
                        const homePositions = [{x: 9, y: 9}, {x: 10, y: 9}, {x: 8, y: 9}, {x: 11, y: 9}];
                        const index = this.ghosts.indexOf(ghost);
                        ghost.x = homePositions[index].x;
                        ghost.y = homePositions[index].y;
                    }
                });
            }
        }
    }
    
    checkGhostCollisions() {
        this.ghosts.forEach(ghost => {
            if (ghost.x === this.player.x && ghost.y === this.player.y && !ghost.eaten) {
                if (this.ghostsVulnerable) {
                    // Eat the ghost
                    ghost.eaten = true;
                    this.score += 200;
                } else {
                    // Game over
                    this.gameRunning = false;
                    setTimeout(() => {
                        this.showOverlay('💀 GAME OVER 💀', `Patch was caught by ${ghost.name}!`);
                    }, 100);
                }
            }
        });
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
                    case 3: // Power-up
                        this.drawPowerUp(x, y, row, col);
                        break;
                }
            }
        }
    }
    
    drawPowerUp(x, y, row, col) {
        if (this.powerUpImagesLoaded < 4) {
            // Fallback: draw large yellow circle if images not loaded
            this.ctx.fillStyle = '#ffeb3b';
            this.ctx.beginPath();
            this.ctx.arc(x + this.gridSize/2, y + this.gridSize/2, 8, 0, Math.PI * 2);
            this.ctx.fill();
            return;
        }
        
        // Determine which power-up based on position
        let powerUpType;
        if (row === 1 && col === 18) {
            powerUpType = 'os'; // Upper right
        } else if (row === 17 && col === 1) {
            powerUpType = 'code'; // Lower left  
        } else if (row === 17 && col === 18) {
            powerUpType = 'iac'; // Lower right
        } else {
            powerUpType = 'container'; // Default fallback
        }
        
        const img = this.powerUpImages[powerUpType];
        if (img && img.complete) {
            const size = this.gridSize * 0.6;
            this.ctx.drawImage(img, 
                x + (this.gridSize - size) / 2, 
                y + (this.gridSize - size) / 2, 
                size, size);
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
    
    drawGhosts() {
        this.ghosts.forEach(ghost => {
            if (ghost.eaten) return; // Don't draw eaten ghosts
            
            const x = ghost.x * this.gridSize;
            const y = ghost.y * this.gridSize;
            const centerX = x + this.gridSize/2;
            const centerY = y + this.gridSize/2;
            const radius = this.gridSize * 0.35;
            
            // Draw ghost body - rounded top with wavy bottom
            // Blue when vulnerable, normal color otherwise
            this.ctx.fillStyle = this.ghostsVulnerable ? '#4169E1' : ghost.color;
            this.ctx.beginPath();
            
            // Top rounded part (semicircle)
            this.ctx.arc(centerX, centerY - radius/3, radius, Math.PI, 0, false);
            
            // Straight sides down
            this.ctx.lineTo(centerX + radius, centerY + radius/2);
            
            // Wavy bottom - create 3 small waves
            const waveWidth = radius * 2 / 3;
            const waveHeight = radius / 4;
            
            // First wave (right)
            this.ctx.lineTo(centerX + radius - waveWidth/3, centerY + radius/2 + waveHeight);
            this.ctx.lineTo(centerX + radius - waveWidth*2/3, centerY + radius/2);
            
            // Second wave (middle)
            this.ctx.lineTo(centerX, centerY + radius/2 + waveHeight);
            
            // Third wave (left)
            this.ctx.lineTo(centerX - radius + waveWidth*2/3, centerY + radius/2);
            this.ctx.lineTo(centerX - radius + waveWidth/3, centerY + radius/2 + waveHeight);
            
            // Complete left side
            this.ctx.lineTo(centerX - radius, centerY + radius/2);
            
            this.ctx.closePath();
            this.ctx.fill();
            
            // Draw ghost eyes
            this.ctx.fillStyle = '#ffffff';
            this.ctx.beginPath();
            this.ctx.arc(centerX - radius/2.5, centerY - radius/3, radius/4, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.beginPath();
            this.ctx.arc(centerX + radius/2.5, centerY - radius/3, radius/4, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Draw ghost pupils
            this.ctx.fillStyle = '#000000';
            this.ctx.beginPath();
            this.ctx.arc(centerX - radius/2.5, centerY - radius/3, radius/6, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.beginPath();
            this.ctx.arc(centerX + radius/2.5, centerY - radius/3, radius/6, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#0f0f23';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.drawMaze();
        this.drawGhosts();
        this.drawPlayer();
        
        // Draw start screen only if game has never been started
        if (!this.gameStarted) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = '#00d4aa';
            this.ctx.textAlign = 'center';
            
            // Draw "SNYK PA" in large font
            this.ctx.font = '36px Courier New';
            const largeText = 'SNYK PA';
            const largeTextWidth = this.ctx.measureText(largeText).width;
            
            // Draw "T" in tiny font
            this.ctx.font = '12px Courier New';
            const tinyT = 'T';
            const tinyTWidth = this.ctx.measureText(tinyT).width;
            
            // Draw "C" in large font
            this.ctx.font = '36px Courier New';
            const midText = 'C';
            const midTextWidth = this.ctx.measureText(midText).width;
            
            // Draw "H" in tiny font  
            this.ctx.font = '12px Courier New';
            const tinyH = 'H';
            const tinyHWidth = this.ctx.measureText(tinyH).width;
            
            // Draw "MAN" in large font
            this.ctx.font = '36px Courier New';
            const endText = 'MAN';
            const endTextWidth = this.ctx.measureText(endText).width;
            
            // Calculate total width for centering
            const totalWidth = largeTextWidth + tinyTWidth + midTextWidth + tinyHWidth + endTextWidth;
            const startX = this.canvas.width/2 - totalWidth/2;
            
            // Draw each part
            this.ctx.font = '36px Courier New';
            this.ctx.fillText(largeText, startX + largeTextWidth/2, this.canvas.height/2 - 40);
            
            this.ctx.font = '12px Courier New';
            this.ctx.fillText(tinyT, startX + largeTextWidth + tinyTWidth/2, this.canvas.height/2 - 35);
            
            this.ctx.font = '36px Courier New';
            this.ctx.fillText(midText, startX + largeTextWidth + tinyTWidth + midTextWidth/2, this.canvas.height/2 - 40);
            
            this.ctx.font = '12px Courier New';
            this.ctx.fillText(tinyH, startX + largeTextWidth + tinyTWidth + midTextWidth + tinyHWidth/2, this.canvas.height/2 - 35);
            
            this.ctx.font = '36px Courier New';
            this.ctx.fillText(endText, startX + largeTextWidth + tinyTWidth + midTextWidth + tinyHWidth + endTextWidth/2, this.canvas.height/2 - 40);
            
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '18px Courier New';
            this.ctx.fillText('Vulnerability Hunter', this.canvas.width/2, this.canvas.height/2 - 10);
            this.ctx.fillText('Press SPACE to start hunting!', this.canvas.width/2, this.canvas.height/2 + 20);
        }
    }
    
    gameLoop() {
        this.updatePlayer();
        this.updateGhosts();
        this.updatePowerUpTimer();
        this.draw();
        
        setTimeout(() => {
            requestAnimationFrame(() => this.gameLoop());
        }, 150); // Control game speed
    }
}

// Draw mini ghost icons in the legend
function drawLegendGhosts() {
    const ghostIcons = document.querySelectorAll('.ghost-icon');
    
    ghostIcons.forEach(canvas => {
        const ctx = canvas.getContext('2d');
        const color = canvas.getAttribute('data-color');
        
        // Set canvas actual size
        canvas.width = 16;
        canvas.height = 16;
        
        const centerX = 8;
        const centerY = 8;
        const radius = 6;
        
        // Draw mini ghost body - rounded top with wavy bottom
        ctx.fillStyle = color;
        ctx.beginPath();
        
        // Top rounded part (semicircle)
        ctx.arc(centerX, centerY - radius/3, radius, Math.PI, 0, false);
        
        // Straight sides down
        ctx.lineTo(centerX + radius, centerY + radius/2);
        
        // Wavy bottom - create 3 small waves
        const waveWidth = radius * 2 / 3;
        const waveHeight = radius / 4;
        
        // First wave (right)
        ctx.lineTo(centerX + radius - waveWidth/3, centerY + radius/2 + waveHeight);
        ctx.lineTo(centerX + radius - waveWidth*2/3, centerY + radius/2);
        
        // Second wave (middle)
        ctx.lineTo(centerX, centerY + radius/2 + waveHeight);
        
        // Third wave (left)
        ctx.lineTo(centerX - radius + waveWidth*2/3, centerY + radius/2);
        ctx.lineTo(centerX - radius + waveWidth/3, centerY + radius/2 + waveHeight);
        
        // Complete left side
        ctx.lineTo(centerX - radius, centerY + radius/2);
        
        ctx.closePath();
        ctx.fill();
        
        // Draw mini ghost eyes
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(centerX - radius/2.5, centerY - radius/3, radius/5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(centerX + radius/2.5, centerY - radius/3, radius/5, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw mini ghost pupils
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(centerX - radius/2.5, centerY - radius/3, radius/8, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(centerX + radius/2.5, centerY - radius/3, radius/8, 0, Math.PI * 2);
        ctx.fill();
    });
}

// Global fallback for start button
function setupGlobalStartButton() {
    const startBtn = document.getElementById('startBtn');
    if (startBtn && window.patchGame) {
        // Modern pointer events (preferred)
        if ('PointerEvent' in window) {
            startBtn.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                if (!window.patchGame.gameStarted) {
                    window.patchGame.startGame();
                }
            });
        }
        
        startBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (!window.patchGame.gameStarted) {
                window.patchGame.startGame();
            }
        });
        
        startBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (!window.patchGame.gameStarted) {
                window.patchGame.startGame();
            }
        });
        
        // Make sure button is interactive
        startBtn.style.cursor = 'pointer';
        startBtn.style.userSelect = 'none';
        startBtn.style.webkitUserSelect = 'none';
        startBtn.style.webkitTouchCallout = 'none';
    }
}

// Start the game when page loads - with better DOM readiness handling
function initializeGame() {
    drawLegendGhosts();
    window.patchGame = new PatchGame();
    
    // Setup global fallback after a short delay
    setTimeout(setupGlobalStartButton, 500);
}

// Try multiple initialization methods for better compatibility
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeGame);
} else {
    // DOM is already loaded
    initializeGame();
}

// Backup initialization on window load
window.addEventListener('load', () => {
    // Only initialize if game hasn't been created yet
    if (!window.patchGame) {
        initializeGame();
    }
});