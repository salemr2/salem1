const board = document.getElementById('board');
const cells = document.querySelectorAll('.cell');
const currentPlayerDisplay = document.getElementById('current-player');
const restartButton = document.getElementById('restart');
const modeBtns = document.querySelectorAll('.mode-btn');

let currentPlayer = 'X';
let gameBoard = ['', '', '', '', '', '', '', '', ''];
let gameActive = true;
let isAIMode = false;
let currentDifficulty = 'easy';

const winningCombos = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
];

let winSound;

// تعريف الصوت كمتغير عام
const VICTORY_SOUND = 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3';

function initSounds() {
    winSound = new Audio(VICTORY_SOUND);
    winSound.preload = 'auto';
    winSound.volume = 0.6;
}

// تحديث نمط اللعب
modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        modeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        isAIMode = btn.dataset.mode === 'ai';
        if (isAIMode) {
            currentDifficulty = btn.dataset.difficulty;
        }
        restartGame();
    });
});

// معالجة النقر على الخلايا
cells.forEach(cell => {
    cell.addEventListener('click', handleCellClick);
});

// تحسين التفاعل مع الأجهزة اللمسية
cells.forEach(cell => {
    cell.addEventListener('touchstart', handleTouchStart, { passive: true });
});

function handleTouchStart(e) {
    e.preventDefault();
    const cell = e.target;
    
    // إضافة تأثير بصري للنقر
    cell.style.backgroundColor = '#e0e0e0';
    
    // إرجاع اللون بعد النقر
    setTimeout(() => {
        cell.style.backgroundColor = '';
    }, 200);
    
    handleCellClick(e);
}

// التأكد من عدم تكبير الشاشة عند النقر المزدوج
document.addEventListener('dblclick', (e) => {
    e.preventDefault();
}, { passive: false });

function handleCellClick(e) {
    const cell = e.target;
    const index = cell.dataset.index;

    if (gameBoard[index] === '' && gameActive) {
        makeMove(index);
        
        if (isAIMode && gameActive) {
            setTimeout(() => {
                makeAIMove();
            }, 500);
        }
    }
}

function makeMove(index) {
    gameBoard[index] = currentPlayer;
    const cell = cells[index];
    cell.textContent = currentPlayer;
    cell.dataset.symbol = currentPlayer;
    
    if (checkWin()) {
        highlightWinningCells();
        gameActive = false;
        currentPlayerDisplay.textContent = `الفائز: ${currentPlayer}!`;
        updateScore(currentPlayer);
        celebrateWin();
    } else if (gameBoard.every(cell => cell !== '')) {
        gameActive = false;
        currentPlayerDisplay.textContent = 'تعادل!';
    } else {
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        currentPlayerDisplay.textContent = currentPlayer;
    }
}

function makeAIMove() {
    if (!gameActive) return;
    
    // إظهار تأثير التفكير
    
    showThinking();
    
    // تأخير عشوائي لمحاكاة التفكير البشري
    const thinkingTime = getThinkingTime();
    
    setTimeout(() => {
        const move = calculateAIMove();
        hideThinking();
        if (move !== null) {
            makeMove(move);
        }
    }, thinkingTime);
}

function getThinkingTime() {
    switch(currentDifficulty) {
        case 'easy':
            return Math.random() * 1000 + 500; // 0.5-1.5 seconds
        case 'medium':
            return Math.random() * 800 + 400; // 0.4-1.2 seconds
        case 'hard':
            return Math.random() * 600 + 300; // 0.3-0.9 seconds
    }
}

function calculateAIMove() {
    switch(currentDifficulty) {
        case 'hard':
            return getBestMove(); // إزالة احتمالية الخطأ في المستوى الصعب
        case 'medium':
            if (Math.random() < 0.6) {
                return getSmartMove();
            } else {
                return getRandomMove();
            }
        default: // easy
            if (Math.random() < 0.3) {
                return getSmartMove();
            } else {
                return getRandomMove();
            }
    }
}

function getSmartMove() {
    // محاولة الفوز
    const winMove = findWinningMove('O');
    if (winMove !== null) return winMove;
    
    // منع فوز الخصم
    const blockMove = findWinningMove('X');
    if (blockMove !== null) return blockMove;
    
    // اختيار المركز إذا كان متاحاً
    if (gameBoard[4] === '') return 4;
    
    // اختيار الزوايا
    const corners = [0, 2, 6, 8].filter(i => gameBoard[i] === '');
    if (corners.length > 0) {
        return corners[Math.floor(Math.random() * corners.length)];
    }
    
    return getRandomMove();
}

function findWinningMove(player) {
    for (let i = 0; i < gameBoard.length; i++) {
        if (gameBoard[i] === '') {
            gameBoard[i] = player;
            if (checkWinningMove()) {
                gameBoard[i] = '';
                return i;
            }
            gameBoard[i] = '';
        }
    }
    return null;
}

function getMistakeMove() {
    const goodMoves = [];
    const okayMoves = [];
    const badMoves = [];
    
    for (let i = 0; i < gameBoard.length; i++) {
        if (gameBoard[i] !== '') continue;
        
        // تصنيف الحركات
        if (isCorner(i)) {
            goodMoves.push(i);
        } else if (i === 4) { // المركز
            goodMoves.push(i);
        } else {
            okayMoves.push(i);
        }
    }
    
    // اختيار حركة بناءً على المستوى
    const rand = Math.random();
    if (rand < 0.5) {
        return getRandomFromArray(goodMoves) || getRandomFromArray(okayMoves);
    } else {
        return getRandomFromArray(okayMoves) || getRandomFromArray(goodMoves);
    }
}

function isCorner(index) {
    return [0, 2, 6, 8].includes(index);
}

function getRandomFromArray(arr) {
    return arr.length > 0 ? arr[Math.floor(Math.random() * arr.length)] : null;
}

function checkWinningMove() {
    return winningCombos.some(combo => {
        const [a, b, c] = combo;
        return gameBoard[a] !== '' && 
               gameBoard[a] === gameBoard[b] && 
               gameBoard[b] === gameBoard[c];
    });
}

function showThinking() {
    document.body.style.cursor = 'wait';
    cells.forEach(cell => {
        if (cell.textContent === '') {
            cell.style.backgroundColor = '#f8f8f8';
        }
    });
}

function hideThinking() {
    document.body.style.cursor = 'default';
    cells.forEach(cell => {
        if (cell.textContent === '') {
            cell.style.backgroundColor = '';
        }
    });
}

function getRandomMove() {
    const emptyCells = gameBoard
        .map((cell, index) => cell === '' ? index : null)
        .filter(cell => cell !== null);
    
    return emptyCells.length > 0 ? 
        emptyCells[Math.floor(Math.random() * emptyCells.length)] : 
        null;
}

function getBestMove() {
    let bestScore = -Infinity;
    let bestMove = null;
    
    // تحسين الحركة الأولى
    if (gameBoard.every(cell => cell === '')) {
        return 0; // ابدأ دائماً بالزاوية
    }
    
    // تحسين الأداء عن طريق تحديد الأولويات
    const moves = [];
    for (let i = 0; i < gameBoard.length; i++) {
        if (gameBoard[i] === '') {
            // تحقق من إمكانية الفوز المباشر
            gameBoard[i] = 'O';
            if (checkWinningMove()) {
                gameBoard[i] = '';
                return i;
            }
            gameBoard[i] = '';

            // تحقق من ضرورة منع فوز الخصم
            gameBoard[i] = 'X';
            if (checkWinningMove()) {
                gameBoard[i] = '';
                return i;
            }
            gameBoard[i] = '';

            moves.push(i);
        }
    }
    
    // تطبيق خوارزمية minimax مع تحسين الأداء
    for (const i of moves) {
        gameBoard[i] = 'O';
        let score = minimax(gameBoard, 0, false, -Infinity, Infinity);
        gameBoard[i] = '';
        
        if (score > bestScore) {
            bestScore = score;
            bestMove = i;
        }
    }
    
    return bestMove;
}

function minimax(board, depth, isMaximizing, alpha, beta) {
    const result = checkGameResult();
    if (result !== null) {
        if (result === 'O') return 10 - depth;
        if (result === 'X') return depth - 10;
        return 0;
    }

    if (isMaximizing) {
        let maxEval = -Infinity;
        for (let i = 0; i < board.length; i++) {
            if (board[i] === '') {
                board[i] = 'O';
                const eval = minimax(board, depth + 1, false, alpha, beta);
                board[i] = '';
                maxEval = Math.max(maxEval, eval);
                alpha = Math.max(alpha, eval);
                if (beta <= alpha) break; // Alpha-beta pruning
            }
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (let i = 0; i < board.length; i++) {
            if (board[i] === '') {
                board[i] = 'X';
                const eval = minimax(board, depth + 1, true, alpha, beta);
                board[i] = '';
                minEval = Math.min(minEval, eval);
                beta = Math.min(beta, eval);
                if (beta <= alpha) break; // Alpha-beta pruning
            }
        }
        return minEval;
    }
}

function checkGameResult() {
    if (checkWin()) {
        return currentPlayer;
    } else if (gameBoard.every(cell => cell !== '')) {
        return 'tie';
    }
    return null;
}

function checkWin() {
    return winningCombos.some(combo => {
        return combo.every(index => gameBoard[index] === currentPlayer);
    });
}

function highlightWinningCells() {
    winningCombos.forEach(combo => {
        if (combo.every(index => gameBoard[index] === currentPlayer)) {
            combo.forEach(index => {
                cells[index].classList.add('winner');
            });
        }
    });
}

function celebrateWin() {
    const startCelebration = async () => {
        createWinnerOverlay();
        createConfetti();
        createTrophy();
        createWinnerText();
        addSparkles();
        
        // محاولة تشغيل الصوت بعد تأخير قصير
        setTimeout(() => {
            playWinSound();
        }, 100);
    };

    startCelebration();
    
    // إزالة عناصر الاحتفال
    setTimeout(() => {
        const elements = document.querySelectorAll('.winner-overlay, .trophy, .winner-text, .celebration');
        elements.forEach(el => {
            el.style.opacity = '0';
            setTimeout(() => el.remove(), 500);
        });
    }, 3000);
}

function createWinnerOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'winner-overlay';
    document.body.appendChild(overlay);
}

function createConfetti() {
    const celebration = document.createElement('div');
    celebration.className = 'celebration';
    document.body.appendChild(celebration);
    
    const shapes = ['circle', 'ribbon', 'star'];
    
    for (let i = 0; i < 100; i++) { // تقليل عدد الكونفيتي
        const confetti = document.createElement('div');
        confetti.className = `confetti ${shapes[Math.floor(Math.random() * shapes.length)]}`;
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.animationDelay = Math.random() * 1.5 + 's'; // تقليل وقت التأخير
        confetti.style.backgroundColor = getRandomColor();
        confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
        
        const randomX = (Math.random() - 0.5) * 40;
        confetti.style.animation += `, confetti-sway ${Math.random() * 1.5 + 1}s ease-in-out infinite`; // تسريع الحركة
        confetti.style.marginLeft = `${randomX}vw`;
        
        celebration.appendChild(confetti);
    }
    
    setTimeout(() => celebration.remove(), 3000); // تقليل مدة العرض إلى 3 ثواني
}

function createTrophy() {
    const trophy = document.createElement('div');
    trophy.className = 'trophy';
    trophy.innerHTML = '🏆';
    document.body.appendChild(trophy);
}

function createWinnerText() {
    const text = document.createElement('div');
    text.className = 'winner-text';
    text.textContent = `مبروك يا ${currentPlayer} 🎉`;
    document.body.appendChild(text);
    
    // إزالة النص بعد 3 ثواني
    setTimeout(() => {
        text.style.opacity = '0';
        setTimeout(() => text.remove(), 500);
    }, 2500);
}

function addSparkles() {
    const winningCells = document.querySelectorAll('.cell.winner');
    winningCells.forEach(cell => {
        for (let i = 0; i < 4; i++) {
            const sparkle = document.createElement('div');
            sparkle.className = 'sparkle';
            sparkle.style.left = Math.random() * 100 + '%';
            sparkle.style.top = Math.random() * 100 + '%';
            sparkle.style.animationDelay = Math.random() * 1 + 's';
            cell.appendChild(sparkle);
        }
    });
}

function getRandomColor() {
    const colors = [
        '#FFD700', // ذهبي
        '#FF6B6B', // أحمر فاتح
        '#4ECDC4', // تركواز
        '#FFE66D', // أصفر
        '#FF8C42', // برتقالي
        '#A3A1FF', // بنفسجي فاتح
        '#FF69B4', // وردي
        '#7BED9F'  // أخضر فاتح
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

function updateScore(winner) {
    const scoreElement = document.getElementById(`score-${winner.toLowerCase()}`);
    scoreElement.textContent = parseInt(scoreElement.textContent) + 1;
}

function restartGame() {
    gameBoard = ['', '', '', '', '', '', '', '', ''];
    gameActive = true;
    currentPlayer = 'X';
    currentPlayerDisplay.textContent = currentPlayer;
    
    cells.forEach(cell => {
        cell.textContent = '';
        cell.classList.remove('winner');
        cell.dataset.symbol = '';
    });
    
    // إزالة أي احتفالات سابقة
    const celebrations = document.querySelectorAll('.celebration');
    celebrations.forEach(cel => cel.remove());
}

function playWinSound() {
    // محاولة 1: إنشاء نسخة جديدة من الصوت في كل مرة
    const sound = new Audio(VICTORY_SOUND);
    sound.volume = 0.6;
    
    // محاولة تشغيل الصوت بعدة طرق
    Promise.all([
        sound.play().catch(() => {
            // محاولة 2: استخدام التأخير
            setTimeout(() => sound.play().catch(() => {}), 100);
        }),
        // محاولة 3: استخدام الصوت الأصلي
        winSound.play().catch(() => {})
    ]).catch(() => {
        console.log('Victory sound failed to play');
    });
}

restartButton.addEventListener('click', restartGame);

// إزالة event listeners القديمة المكررة
window.addEventListener('load', () => {
    initSounds();
    
    // تفعيل الصوت عند أول تفاعل
    const activateAudio = async () => {
        try {
            const audio = new Audio(VICTORY_SOUND);
            audio.volume = 0;
            await audio.play();
            audio.pause();
            audio.remove();
        } catch (error) {
            console.log('Audio activation failed:', error);
        }
    };
    
    document.addEventListener('click', activateAudio, { once: true });
});

// تحسين أداء الرسوم المتحركة على الأجهزة الضعيفة
const isLowEndDevice = () => {
    return (
        !window.matchMedia('(min-resolution: 2dppx)').matches ||
        navigator.hardwareConcurrency < 4 ||
        navigator.deviceMemory < 4
    );
};

if (isLowEndDevice()) {
    // تقليل عدد الكونفيتي وتأثيرات الحركة على الأجهزة الضعيفة
    const originalCreateConfetti = createConfetti;
    createConfetti = () => {
        const celebration = document.createElement('div');
        celebration.className = 'celebration';
        document.body.appendChild(celebration);
        
        // تقليل عدد العناصر
        for (let i = 0; i < 30; i++) {
            // ...rest of confetti creation...
        }
    };
}
