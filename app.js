const GAME_VARIABLES = {
    canvasWidth: 800,
    canvasHeight: 600,
    frameRate: 60,
    inputKeys: [],
    p1Controls: { up: "w", down: "s" },
    p2Controls: { up: "ArrowUp", down: "ArrowDown" },
    sharedControls: { pause: " " },
    bounceAngleRadians: (Math.PI / 180) * 45, // Max rebound angle.
    gameState: { "PREPARATION": 1, "PLAYING": 2, "GAMEOVER": 3, "CONTINUE": 4, "PAUSED": 5 },
    gameScreen: { "MENU": 0, "MODESELECT": 1, "GAME": 2, "CREDITS": 3 },
    gameMode: null,
    audioReboundWall: new Audio("./sounds/rebound-wall.wav"),
    audioReboundPaddle: new Audio("./sounds/rebound-paddle.wav"),
    audioScored: new Audio("./sounds/scored.wav"),
    canPlayAudio: false
}

if (document.readyState == "loading") {
    document.addEventListener("DOMContentLoaded", ready);
} else {
    ready();
}

function ready() {
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");

    canvas.style.width = GAME_VARIABLES.canvasWidth;
    canvas.style.height = GAME_VARIABLES.canvasHeight;
    canvas.width = GAME_VARIABLES.canvasWidth;
    canvas.height = GAME_VARIABLES.canvasHeight;
    
    function playAudio(audio) {
        if (GAME_VARIABLES.canPlayAudio) audio.play();
    }

    class Modes {
        constructor() {
            this.modeList = [];
            this.currentMode = 0;
        }
        addMode(name, ball, description) {
            this.modeList.push({
                name: name,
                ball: ball,
                description: description
            });
        }
        getMode() {
            if (this.modeList.length == 0) {
                throw new Error("No modes defined.");
            }
            var mode = this.modeList[this.currentMode];
            return {
                name: mode.name,
                ball: mode.ball,
                description: mode.description
            }
        }
        next() {
            const len = this.modeList.length;
            this.currentMode = (this.currentMode + 1) % len;
        }
        prev() {
            const len = this.modeList.length;
            this.currentMode--;
            if (this.currentMode < 0) {
                this.currentMode = len - 1;
            }
        }
    }

    class Button {
        constructor(x, y, width, height, clickFunc) {
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
            this.clickFunc = clickFunc;
        }
        getRect() {
            return {
                x: this.x,
                y: this.y,
                width: this.width,
                height: this.height
            }
        }
        isTargeted(position) {
            return Util.isInside(position, this.getRect());
        }
        doClickFunc() {
            this.clickFunc();
        }
    }

    class TextButton extends Button {
        constructor(text, font, x, y, clickFunc) {
            ctx.save();
            ctx.font = font;
            var metrics = ctx.measureText(text);
            var width = metrics.width;
            var height = 
                metrics.actualBoundingBoxAscent +
                metrics.actualBoundingBoxDescent;
            ctx.restore();
            super(x, y, width, height, clickFunc);
            this.text = text;
            this.font = font;
        }
        draw() {
            ctx.save();
            ctx.font = this.font;
            ctx.fillStyle = "#FFF";
            ctx.textAlign = "center";
            ctx.fillText(this.text, this.x, this.y);
            ctx.restore();
        }
        getRect() {
            return {
                x: this.x - this.width / 2,
                y: this.y - this.height / 2,
                width: this.width,
                height: this.height
            }
        }
    }

    class ArrowButton extends Button {
        constructor(x, y, width, height, direction, clickFunc) {
            super(x, y, width, height, clickFunc);
            this.direction = direction;
        }
        draw() {
            var beginX = this.x;
            var endX = this.x + this.width;
            if (this.direction == "left") {
                beginX = this.x + this.width;
                endX = this.x;
            } 
            ctx.save();
            ctx.strokeStyle = "#FFF";
            ctx.lineWidth = 10;
            ctx.beginPath();
            ctx.moveTo(beginX, this.y);
            ctx.lineTo(beginX, this.y + this.height);
            ctx.lineTo(endX, this.y + this.height / 2);
            ctx.closePath();
            ctx.stroke();
            ctx.restore();
        }
    }

    class ScreenManager {
        constructor() {
            this.screens = [];
            this.gameScreen = GAME_VARIABLES.gameScreen.MENU;
        }
        update(dt) {
            this.screens[this.gameScreen].update(dt);
        }
        draw() {
            this.screens[this.gameScreen].draw();
        }
        getCurrentScreen() {
            return this.screens[this.gameScreen];
        }
        requestScreen(gameScreen) {
            this.gameScreen = gameScreen;
            this.getCurrentScreen().begin();
        }
        addScreen(id, screen) {
            this.screens[id] = screen;
            screen.manager = this;
        }
    }

    class Screen {
        constructor() {
            this.buttons = [];
        }
        update() {
            return;
        }
        draw() {
            this.drawButtons();
        }
        drawButtons() {
            this.buttons.forEach((button) => {
                button.draw();
            });
        }
        handleMouseClick(position) {
            this.buttons.forEach((button) => {
                if (button.isTargeted(position)) button.doClickFunc();
            });
        }
        begin() {
            return;
        }
    }

    class MenuScreen extends Screen {
        constructor() {
            super();
            var that = this;
            var playButton = new TextButton(
                "Play",
                "30px Courier", 
                canvas.width / 2, 
                canvas.height / 2,
                function() { that.manager.requestScreen(GAME_VARIABLES.gameScreen.MODESELECT) }
                );
            var creditsButton = new TextButton(
                "Credits",
                "30px Courier", 
                canvas.width / 2, 
                playButton.y + playButton.height * 2,
                function() { that.manager.requestScreen(GAME_VARIABLES.gameScreen.CREDITS) }
            )
            this.buttons.push(playButton);
            this.buttons.push(creditsButton);
        }
    }

    class CreditsScreen extends Screen {
        constructor() {
            super();
            var that = this;
            var backButton = new TextButton(
                "Back",
                "20px Courier", 
                canvas.width / 2, 
                canvas.height * .9,
                function() { that.manager.requestScreen(GAME_VARIABLES.gameScreen.MENU) }
            );
            this.buttons.push(backButton);
            this.whale = new Whale();
        }
        draw() {
            super.draw();
            this.drawCredits();
        }
        drawCredits() {
            ctx.save();
            ctx.fillStyle = "#FFF"
            ctx.textAlign = "center";
            ctx.font = "30px Courier";
            // Title.
            ctx.fillText("Credits", canvas.width / 2, canvas.height * .1);
            this.whale.drawCenteredAt(canvas.width / 2, canvas.height * .22);
            ctx.font = "24px Courier";
            var fontSize = 24;
            // Art.
            ctx.fillText(
                "\"Blue Whale\" by RAPIDPUNCHES",
                canvas.width / 2,
                canvas.height * .3);
            ctx.fillText(
                "licensed CC BY-SA 4.0, CC BY-SA 3.0:",
                canvas.width / 2,
                canvas.height * .3 + fontSize);
            ctx.fillText(
                "https://opengameart.org/content/blue-whale",
                canvas.width / 2,
                canvas.height * .3 + fontSize * 2);

            // Sound.
            ctx.fillText(
                "\"Pro Sound Collection (v1.3)\" by GameMaster Audio:",
                canvas.width / 2,
                canvas.height * .5);
            ctx.fillText(
                "https://www.gamemasteraudio.com/product/",
                canvas.width / 2,
                canvas.height * .5 + fontSize);
            ctx.fillText(
                "pro-sound-collection/",
                canvas.width / 2,
                canvas.height * .5 + fontSize * 2);
            ctx.restore();
        }
    }

    class ModeSelectScreen extends Screen {
        constructor() {
            super();
            var that = this;
            var startGameButton = new TextButton(
                "Start game",
                "24px Courier", 
                canvas.width / 2, 
                canvas.height * .8,
                function() { that.manager.requestScreen(GAME_VARIABLES.gameScreen.GAME) }
            );
            var backButton = new TextButton(
                "Back",
                "20px Courier", 
                canvas.width / 2, 
                canvas.height * .9,
                function() { that.manager.requestScreen(GAME_VARIABLES.gameScreen.MENU) }
            );
            var selectLeftButton = new ArrowButton(
                canvas.width * .3,
                230,
                20,
                40,
                "left",
                function() {
                    GAME_VARIABLES.gameMode.prev();
                }
            );
            var selectRightButton = new ArrowButton(
                canvas.width * .7 - 20,
                230,
                20,
                40,
                "right",
                function() {
                    GAME_VARIABLES.gameMode.next();
                }
            );
            this.buttons.push(startGameButton);
            this.buttons.push(backButton);
            this.buttons.push(selectLeftButton);
            this.buttons.push(selectRightButton);
            // TODO: Add text description for selected mode.
        }
        draw() {
            super.draw(); // Buttons drawn here.
            this.drawSelectionTile();
            this.drawMode();
        }
        drawSelectionTile() {
            ctx.save();
            ctx.strokeStyle = "#FFF";
            ctx.beginPath();
            ctx.moveTo(350, 200);
            ctx.lineTo(450, 200);
            ctx.lineTo(450, 300);
            ctx.lineTo(350, 300);
            ctx.closePath();
            ctx.stroke();
            ctx.restore();
        }
        drawMode() {
            const modeInfo = GAME_VARIABLES.gameMode.getMode();
            var name = modeInfo.name;
            var ball = modeInfo.ball;
            var description = modeInfo.description;
            ball.drawCenteredAt(400, 250);
            ctx.fillStyle = "#FFF";
            ctx.textAlign = "center";
            ctx.font = "20px Courier";
            ctx.fillText(name, 400, 320);
            ctx.font = "16px Courier";
            ctx.fillText(description, 400, 360);
        }
    }

    class GameScreen extends Screen {
        constructor(paddle1, paddle2, scoreBoard) {
            super();
            this.ball = null;
            this.paddle1 = paddle1;
            this.paddle2 = paddle2;
            this.scoreBoard = scoreBoard;
            this.goalSize = { width: canvas.width * .1, height: canvas.height };
            this.nextBallDirection = 1;
            this.gameState = GAME_VARIABLES.gameState.PREPARATION; // The gameState specifies what things to update and draw.
            this.returnState = null;
            this.acceptPause = true;
            this.timer = 0;

            // Setup buttons.
            var that = this; // Reference for buttons to target this screen.
            var playAgainButton = new TextButton(
                "Play again", 
                "30px Courier", 
                canvas.width / 2, 
                canvas.height / 2,
                function () { that.preGame(); }
                );
            var returnToMenuButton = new TextButton(
                "Main menu", 
                "30px Courier", 
                canvas.width / 2, 
                playAgainButton.y 
                    + playAgainButton.height * 2,
                function() { that.manager.requestScreen(GAME_VARIABLES.gameScreen.MENU); }
                );
            // Store buttons.
            this.buttons.push(playAgainButton);
            this.buttons.push(returnToMenuButton);
        }
        update(dt) {
            if (this.gameState === GAME_VARIABLES.gameState.PLAYING) {
                this.paddle1.update(dt);
                this.paddle2.update(dt);
                this.ball.update(dt);
                this.ball.collideLeft(paddle1);
                this.ball.collideRight(paddle2);
                this.checkScored();
                this.checkPaused();
            }
            if (this.gameState === GAME_VARIABLES.gameState.PAUSED) {
                this.checkPaused();
            }
            if (this.gameState === GAME_VARIABLES.gameState.PREPARATION) {
                this.paddle1.update(dt);
                this.paddle2.update(dt);
                this.checkPaused();
                this.prepareNext(dt);
            }
            if (this.gameState === GAME_VARIABLES.gameState.GAMEOVER) {
                this.ball.update(dt);
            }
            if (this.gameState === GAME_VARIABLES.gameState.CONTINUE) {
                // Do not update.
            }
        }
        draw() {
            if (this.gameState === GAME_VARIABLES.gameState.PLAYING) {
                this.ball.draw();
                this.paddle1.draw();
                this.paddle2.draw();
            }
            if (this.gameState === GAME_VARIABLES.gameState.PAUSED) {
                this.ball.draw();
                this.paddle1.draw();
                this.paddle2.draw();
                this.drawOverlay();
                this.drawPausedText();
            }
            if (this.gameState === GAME_VARIABLES.gameState.PREPARATION) {
                this.paddle1.draw();
                this.paddle2.draw();
            }
            if (this.gameState === GAME_VARIABLES.gameState.GAMEOVER) {
                this.ball.draw();
            }
            if (this.gameState === GAME_VARIABLES.gameState.CONTINUE) {
                this.ball.draw();
                this.paddle1.draw();
                this.paddle2.draw();
            }
            this.drawScreenDivider();
            this.scoreBoard.drawScores();
            this.drawGoals();
            if (this.gameState === GAME_VARIABLES.gameState.CONTINUE) {
                // Draw these parts on top of rest of the game.
                this.drawOverlay();
                this.drawButtons();
            }
        }
        // Line dividing two players' sides.
        drawScreenDivider() {
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(400, 0);
            ctx.lineTo(400, 600);
            ctx.strokeStyle = "#FFF";
            ctx.setLineDash([8]);
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.restore();
        };
        // Scoring area behind each player.
        drawGoals() {
            ctx.fillStyle = "#000"
            ctx.fillRect(0, 0, this.goalSize.width, this.goalSize.height);
            ctx.fillRect(canvas.width - this.goalSize.width, 0, this.goalSize.width, this.goalSize.height);
        }
        // Darken out the rest of the game.
        drawOverlay() {
            ctx.save();
            ctx.fillStyle = "#000";
            ctx.globalAlpha = .5;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.restore();
        }
        // Text to tell player game is paused.
        drawPausedText() {
            ctx.save();
            ctx.font = "30px Courier"
            ctx.textAlign = "center";
            ctx.fillStyle = "#FFF";
            ctx.fillText("Paused", canvas.width / 2, canvas.height / 2);
            ctx.restore();
        }
        // Check for player scoring a point.
        checkScored() {
            var scoredLeft = (this.ball.x <= 0);
            var scoredRight = (this.ball.x + this.ball.width >= canvas.width);
            if (scoredLeft || scoredRight) {
                playAudio(GAME_VARIABLES.audioScored);
                if (scoredLeft) { 
                    this.scoreBoard.incrementPlayerTwo();
                    this.nextBallDirection = -1;
                }
                if (scoredRight) { 
                    this.scoreBoard.incrementPlayerOne();
                    this.nextBallDirection = 1;
                }
                if (this.scoreBoard.getHighestScore() >= 11) {
                    GAME_VARIABLES.canPlayAudio = false; // Audio should be disabled before post game.
                    this.postGame();
                } else {
                    this.gameState = GAME_VARIABLES.gameState.PREPARATION;
                }
            }
        }
        //
        prepareNext(dt) {
            this.timer += dt / GAME_VARIABLES.frameRate;
            if (this.timer >= 2) {
                this.gameState = GAME_VARIABLES.gameState.PLAYING;
                this.spawnBall();
                this.timer = 0;
            }
        }
        // Check if the game should be paused.
        checkPaused() {
            const spacebarPressed = GAME_VARIABLES.inputKeys[GAME_VARIABLES.sharedControls.pause];
            if (this.acceptPause && spacebarPressed) {
                this.acceptPause = false;

                if (this.gameState === GAME_VARIABLES.gameState.PAUSED) {
                    this.gameState = this.returnState;
                }
                else {
                    this.returnState = this.gameState;
                    this.gameState = GAME_VARIABLES.gameState.PAUSED;
                }
            }
            // Do not accept another pause call until spacebar is released.
            else if (!spacebarPressed) {
                this.acceptPause = true;
            } 
        }
        gameStart() {
            this.gameState = GAME_VARIABLES.gameState.PREPARATION;
            this.scoreBoard.resetScore();
            this.paddle1.reset();
            this.paddle2.reset();
            GAME_VARIABLES.canPlayAudio = true;
        }
        spawnBall() {
            // Possible starting positions and angles.
            const startPositionsY = [
                canvas.height * .1,
                canvas.height * .2,
                canvas.height * .8,
                canvas.height * .9];
            const startAngles = [0, 80, 80, 80].map((x) => {
                return x * Math.PI / 180; // Convert to radians.
            });
            
            var position = { 
                x: canvas.width / 2 - this.nextBallDirection * 20, // Slightly behind the line divider
                y: startPositionsY[Math.floor(Math.random() * startPositionsY.length)]
            }
            var angle = startAngles[Math.floor(Math.random() * startAngles.length)];
            var negativeOrPositive = Math.random() < 0.5 ? -1 : 1;
            var direction = { 
                x: Math.cos(angle) * this.nextBallDirection,
                y: Math.sin(angle) * negativeOrPositive
            }
            this.ball.spawn(position, direction, this.ball.minSpeed);
            this.gameState = GAME_VARIABLES.gameState.PLAYING;
        }
        preGame() {
            this.gameState = GAME_VARIABLES.gameState.GAMEOVER;
            var position = { 
                x: canvas.width * .38,
                y: this.ball.width
            }
            var angle = 60 * Math.PI / 180;
            var direction = { 
                x: Math.cos(angle),
                y: Math.sin(angle) * -1
            }
            this.ball.spawn(position, direction, 8);

            setTimeout(() => {
                this.gameStart();
            }, 5000);
        }
        postGame() {
            this.gameState = GAME_VARIABLES.gameState.GAMEOVER;
            var position = { 
                x: canvas.width * .38,
                y: this.ball.width
            }
            var angle = 60 * Math.PI / 180;
            var direction = { 
                x: Math.cos(angle),
                y: Math.sin(angle) * -1
            }
            this.ball.spawn(position, direction, 8);
            setTimeout(() => {
                this.gameState = GAME_VARIABLES.gameState.CONTINUE;
            }, 5000);
        }
        begin() {
            // Set the correct ball based on current mode.
            this.ball = GAME_VARIABLES.gameMode.getMode().ball;
            this.preGame();
        }
    }
    
    class ScoreManager {
        constructor() {
            this.screenSize = { x: GAME_VARIABLES.canvasWidth, y: GAME_VARIABLES.canvasHeight };
            this.playerScore = { p1: 0, p2: 0 };
            this.spec = { // Specifications on size of digit to be drawn.
                width: this.screenSize.x * .0375, 
                height: this.screenSize.y * .11, 
                thickness: this.screenSize.y * .11 / 9 
            }
            this.p1scorePosition = { x: this.screenSize.x * 0.31, y: this.screenSize.y * .05 };
            this.p2scorePosition = { x: this.screenSize.x * 0.76, y: this.screenSize.y * .05 };
            this.current = { x: 0, y: 0 }; // Will be set to p1 & p2 scorePositions when drawing.
        }
        drawScores() {
            ctx.save();
            ctx.fillStyle = "#CCC";

            // Draw for both players.
            this.current = this.p1scorePosition;
            this.drawNumber(this.playerScore.p1);
            this.current = this.p2scorePosition;
            this.drawNumber(this.playerScore.p2);

            ctx.restore();
        }
        drawNumber(number) {
            switch (number) {
                case 0:
                    this.drawZero();
                    break;
                case 1:
                    this.drawOne();
                    break;
                case 2:
                    this.drawTwo();
                    break;
                case 3:
                    this.drawThree();
                    break;
                case 4:
                    this.drawFour();
                    break;
                case 5:
                    this.drawFive();
                    break;
                case 6:
                    this.drawSix();
                    break;
                case 7:
                    this.drawSeven();
                    break;
                case 8:
                    this.drawEight();
                    break;
                case 9:
                    this.drawNine();
                    break;
                case 10:
                    this.drawTen();
                    break;
                case 11:
                    this.drawEleven();
                    break;
                default:
                    // Do nothing.
            }
        }
        incrementPlayerOne() {
            this.playerScore.p1++;
        }
        incrementPlayerTwo() {
            this.playerScore.p2++;
        }
        resetScore() {
            this.playerScore.p1 = 0;
            this.playerScore.p2 = 0;
        }
        getHighestScore() {
            return Math.max(this.playerScore.p1, this.playerScore.p2);
        }
        /*
        * Below are numbers to be drawn with helper functions.
        */
        drawZero() {
            this.horizontalBarTop();
            this.horizontalBarBottom();
            this.verticalBarLeft();
            this.verticalBarRight();
        }
        drawOne() {
            this.verticalBarRight();
        }
        drawTwo() {
            this.horizontalBarTop();
            this.horizontalBarMiddle();
            this.horizontalBarBottom();
            this.verticalBarBottomLeft();
            this.verticalBarTopRight();
        }
        drawThree() {
            this.horizontalBarTop();
            this.horizontalBarMiddle();
            this.horizontalBarBottom();
            this.verticalBarRight();
        }
        drawFour() {
            this.verticalBarTopLeft();
            this.verticalBarRight();
            this.horizontalBarMiddle();
        }
        drawFive() {
            this.horizontalBarTop();
            this.horizontalBarMiddle();
            this.horizontalBarBottom();
            this.verticalBarTopLeft();
            this.verticalBarBottomRight();
        }
        drawSix() {
            this.verticalBarLeft();
            this.horizontalBarMiddle();
            this.horizontalBarBottom();
            this.verticalBarBottomRight();
        }
        drawSeven() {
            this.horizontalBarTop();
            this.verticalBarRight();
        }
        drawEight() {
            this.horizontalBarTop();
            this.horizontalBarMiddle();
            this.horizontalBarBottom();
            this.verticalBarLeft();
            this.verticalBarRight();
        }
        drawNine() {
            this.verticalBarTopLeft();
            this.horizontalBarTop();
            this.horizontalBarMiddle();
            this.verticalBarRight();
        }
        drawTen() {
            this.drawZero();

            // Number one on left side.
            ctx.fillRect(
                this.current.x - this.spec.width - this.spec.thickness, 
                this.current.y, 
                this.spec.thickness, 
                this.spec.height);
        }
        drawEleven() {
            this.drawOne();

            // Number one on left side.
            ctx.fillRect(
                this.current.x - this.spec.width - this.spec.thickness, 
                this.current.y, 
                this.spec.thickness, 
                this.spec.height);
        }

        /*
        * Below are the helper functions to draw the score digits.
        */
        horizontalBarTop() {
            ctx.fillRect(
                this.current.x, 
                this.current.y, 
                this.spec.width, 
                this.spec.thickness);
        }
        horizontalBarBottom() {
            ctx.fillRect(
                this.current.x, 
                this.current.y + this.spec.height - this.spec.thickness, 
                this.spec.width, 
                this.spec.thickness);
        }
        horizontalBarMiddle() {
            ctx.fillRect(
                this.current.x, 
                this.current.y + this.spec.height / 2 - this.spec.thickness, 
                this.spec.width, 
                this.spec.thickness);
        }
        verticalBarLeft() {
            ctx.fillRect(
                this.current.x, 
                this.current.y, 
                this.spec.thickness, 
                this.spec.height);
        }
        verticalBarRight() {
            ctx.fillRect(
                this.current.x + this.spec.width - this.spec.thickness, 
                this.current.y, 
                this.spec.thickness, 
                this.spec.height);
        }
        verticalBarTopLeft() {
            ctx.fillRect(
                this.current.x, 
                this.current.y, 
                this.spec.thickness, 
                this.spec.height / 2);
        }
        verticalBarBottomLeft() {
            ctx.fillRect(
                this.current.x, 
                this.current.y + this.spec.height / 2, 
                this.spec.thickness, 
                this.spec.height / 2);
        }
        verticalBarTopRight() {
            ctx.fillRect(
                this.current.x + this.spec.width - this.spec.thickness, 
                this.current.y, 
                this.spec.thickness, 
                this.spec.height / 2);
        }
        verticalBarBottomRight() {
            ctx.fillRect(
                this.current.x + this.spec.width - this.spec.thickness, 
                this.current.y + this.spec.height / 2, 
                this.spec.thickness, 
                this.spec.height / 2);
        }
    }

    class Ball {
        constructor() {
            this.x = canvas.width / 2;
            this.y = canvas.height / 2 + 10;
            this.minSpeed = 4;
            this.maxSpeed = 10;
            this.fixedHorizontalSpeed = 4;
            this.speed = 4;
            this.direction = { x: -1, y: 0 };
            this.width = canvas.height * .11 / 10;
            this.previous = { x: this.x, y: this.y};
            this.edgeMultiplier = 1.1;
            this.centerMultiplier = .6;
        }
        draw() {
            ctx.fillStyle = "#FFF";
            ctx.fillRect(this.x, this.y, this.width, this.width);
        }
        drawCenteredAt(x, y) {
            this.x = x - this.width / 2;
            this.y = y - this.width / 2;
            this.draw();
        }
        update(dt) {
            // Reverse directions at screen edges.
            const passedLeftBound = (this.x < 0);
            const passedRightBound = (this.x + this.width >= canvas.width);
            const passedUpperBound = (this.y < 0);
            const passedLowerBound = (this.y + this.width >= canvas.height);
            if (passedLeftBound || passedRightBound) {
                if (passedLeftBound) { this.x = 0; }
                if (passedRightBound) { this.x = canvas.width - this.width; }
                this.direction.x = -this.direction.x;
                playAudio(GAME_VARIABLES.audioReboundWall);
            }
            if (passedUpperBound || passedLowerBound) {
                if (passedUpperBound) { this.y = 0; }
                if (passedLowerBound) { this.y = canvas.height - this.width; }
                this.direction.y = -this.direction.y;
                playAudio(GAME_VARIABLES.audioReboundWall);
            }

            // Save previous position.
            this.previous.x = this.x;
            this.previous.y = this.y;

            // Check if ball is too fast or slow.
            if (this.speed < this.minSpeed) this.speed = this.minSpeed;
            if (this.speed > this.maxSpeed) this.speed = this.maxSpeed;

            // Update position.
            const adjustSpeedRatio = Math.abs( // Ratio to adjust for constant horizontal speed.
                this.fixedHorizontalSpeed / (this.speed * this.direction.x)); 
            this.x += dt * this.speed * this.direction.x * adjustSpeedRatio;
            this.y += dt * this.speed * this.direction.y;
        }
        collideLeft(leftPaddle) {
            var surfaceOfPaddleX = leftPaddle.x + leftPaddle.width;
            var prevSurfaceOfBallX = this.previous.x + this.width; // Back face of previous position.

            // Is paddle between current & previous position.
            if (this.direction.x < 0 && this.x <= surfaceOfPaddleX && prevSurfaceOfBallX > surfaceOfPaddleX) {
                var dydx = (this.y - this.previous.y) / (this.x - prevSurfaceOfBallX);
                var c = this.y - dydx * this.x;
                var y = dydx * surfaceOfPaddleX + c;

                // Would ball have touched paddle when it was at the paddle's x-position.
                if (y <= leftPaddle.y + leftPaddle.height && y + this.width >= leftPaddle.y) {

                    // Adjust ball back to the surface of paddle.
                    this.x = surfaceOfPaddleX;
                    this.y = y;

                    var lowerPaddleStart = leftPaddle.y + leftPaddle.sectionSize * 5;
                    var upperPaddleStart = leftPaddle.y + leftPaddle.sectionSize * 3;
                    // Derive rebound angle.
                    if (this.y + this.width / 2 > lowerPaddleStart) {
                        // Ball is at lower section.
                        var angle = this.getReboundAngle(this.y + this.width / 2, lowerPaddleStart, leftPaddle.y + leftPaddle.height);
                        this.direction.x = Math.cos(angle);
                        this.direction.y = Math.sin(angle);
                        this.speed *= this.edgeMultiplier + leftPaddle.speed / leftPaddle.maxSpeed;
                    } else if (this.y + this.width / 2 < upperPaddleStart) {
                        // Ball is at upper section.
                        var angle = this.getReboundAngle(this.y + this.width / 2, upperPaddleStart, leftPaddle.y);
                        this.direction.x = Math.cos(angle);
                        this.direction.y = -Math.sin(angle);
                        this.speed *= this.edgeMultiplier + leftPaddle.speed / leftPaddle.maxSpeed;
                    } else {
                        // Ball is at middle section.
                        // Rebound at 90 degrees.
                        this.direction.x = 1;
                        this.direction.y = 0;
                        this.speed *= this.centerMultiplier;
                    }

                    if (GAME_VARIABLES.canPlayAudio) GAME_VARIABLES.audioReboundPaddle.play();
                }
            }
        }
        collideRight(rightPaddle) {
            var surfaceOfPaddleX = rightPaddle.x;
            var surfaceOfBallX = this.x + this.width; // Right face of ball.
            var prevSurfaceOfBallX = this.previous.x; // Back face of previous position.

            // Is paddle between current & previous position.
            if (this.direction.x > 0 && surfaceOfBallX >= surfaceOfPaddleX && prevSurfaceOfBallX < surfaceOfPaddleX) {
                var dydx = (this.y - this.previous.y) / (surfaceOfBallX - prevSurfaceOfBallX);
                var c = this.y - dydx * this.x;
                var y = dydx * surfaceOfPaddleX + c;

                // Would ball have touched paddle when it was at the paddle's x-position.
                if (y <= rightPaddle.y + rightPaddle.height && y + this.width >= rightPaddle.y) {

                    // Adjust ball position.
                    this.x = surfaceOfPaddleX - this.width;
                    this.y = y;

                    var lowerPaddleStart = rightPaddle.y + rightPaddle.sectionSize * 5;
                    var upperPaddleStart = rightPaddle.y + rightPaddle.sectionSize * 3;
                    // Derive rebound angle.
                    if (this.y + this.width / 2 > lowerPaddleStart) {
                        // Ball is at lower section.
                        var angle = this.getReboundAngle(this.y + this.width / 2, lowerPaddleStart, rightPaddle.y + rightPaddle.height);
                        this.direction.x = -Math.cos(angle);
                        this.direction.y = Math.sin(angle);
                        this.speed *= this.edgeMultiplier + rightPaddle.speed / rightPaddle.maxSpeed;
                    } else if (this.y + this.width / 2 < upperPaddleStart) {
                        // Ball is at upper section.
                        var angle = this.getReboundAngle(this.y + this.width / 2, upperPaddleStart, rightPaddle.y);
                        this.direction.x = -Math.cos(angle);
                        this.direction.y = -Math.sin(angle);
                        this.speed *= this.edgeMultiplier + rightPaddle.speed / rightPaddle.maxSpeed;
                    } else {
                        // Ball is at middle section.
                        // Rebound at 90 degrees.
                        this.direction.x = -1;
                        this.direction.y = 0;
                        this.speed *= this.centerMultiplier;
                    }

                    if (GAME_VARIABLES.canPlayAudio) GAME_VARIABLES.audioReboundPaddle.play();
                }
            }
        }
        getReboundAngle(ballStart, paddleStart, paddleEnd) {
            var ballDistance = Math.abs(paddleStart - ballStart);
            var paddleRegion = Math.abs(paddleEnd - paddleStart);
            var percentOfAngle = ballDistance / paddleRegion;
            return GAME_VARIABLES.bounceAngleRadians * percentOfAngle;
        }
        spawn(position, direction, speed) {
            this.x = position.x;
            this.y = position.y;
            this.speed = speed;
            this.direction.x = direction.x;
            this.direction.y = direction.y
            this.active = true;
        }
    }

    class Paddle {
        constructor(x, y, controls) {
            this.initialX = x;
            this.initialY = y;
            this.x = x;
            this.y = y;
            this.width = canvas.height * .11 / 9;
            this.height = 30;
            this.speed = 2;
            this.maxSpeed = 20;
            this.minSpeed = 2;
            this.sectionSize = this.height / 8;
            this.controls = controls;
        }
        draw() {
            ctx.fillStyle = "#FFF";
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
        update(dt) {
            // Update position.
            if (GAME_VARIABLES.inputKeys[this.controls.up]) {
                this.y -= dt * this.speed;
            }
            if (GAME_VARIABLES.inputKeys[this.controls.down]) {
                this.y += dt * this.speed;
            }
            
            // Accelerate the paddle.
            if (this.speed < 10) { this.speed += 1; }
            else if (this.speed < 5 ) { this.speed += .12; }
            if (this.speed >= this.maxSpeed) { this.speed = this.maxSpeed; }

            // Return to original speed when not pressing movement keys.
            if (!GAME_VARIABLES.inputKeys[this.controls.up] && !GAME_VARIABLES.inputKeys[this.controls.down]) {
                this.speed = this.minSpeed;
            }

            // Hold paddle from travelling beyond intended bounds.
            if (this.y >= canvas.height * 0.9) {
                this.y = canvas.height * 0.9;
            } else if (this.y <= canvas.height * 0.05) {
                this.y = canvas.height * 0.05;
            };
        }
        reset() {
            this.x = this.initialX;
            this.y = this.initialY;
        }
    }

    // New ball type: whale.
    class Whale extends Ball {
        constructor() {
            super();
            this.width = 64;
            this.spriteLeft = new Image();
            this.spriteRight = new Image();
            this.spriteLeft.src = "./graphics/blue-whale-left.png";
            this.spriteRight.src = "./graphics/blue-whale-right.png";
        }
        // Override draw.
        draw() {
            if (this.direction.x >= 0) {
                ctx.drawImage(this.spriteRight, 0, 0, 64, 64, this.x, this.y, this.width, this.width);
            } else {
                ctx.drawImage(this.spriteLeft, 576, 0, 64, 64, this.x, this.y, this.width, this.width);
            }
        }
    }

    var modes = new Modes();
    modes.addMode("Classic", new Ball(), "No add-ons.");
    modes.addMode("Whale", new Whale(), "It does not like to be stopped.");
    GAME_VARIABLES.gameMode = modes;
    var paddle1 = new Paddle(canvas.width * 0.2, canvas.height / 2, GAME_VARIABLES.p1Controls);
    var paddle2 = new Paddle(canvas.width * 0.8, canvas.height / 2, GAME_VARIABLES.p2Controls);
    var scoreBoard = new ScoreManager();
    var gameScreen = new GameScreen(paddle1, paddle2, scoreBoard);
    var menuScreen = new MenuScreen();
    var creditsScreen = new CreditsScreen();
    var modeSelectScreen = new ModeSelectScreen();
    var screenManager = new ScreenManager();
    screenManager.addScreen(GAME_VARIABLES.gameScreen.MENU, menuScreen);
    screenManager.addScreen(GAME_VARIABLES.gameScreen.CREDITS, creditsScreen);
    screenManager.addScreen(GAME_VARIABLES.gameScreen.MODESELECT, modeSelectScreen);
    screenManager.addScreen(GAME_VARIABLES.gameScreen.GAME, gameScreen);
    screenManager.requestScreen(GAME_VARIABLES.gameScreen.MENU);

    var lastTime = Date.now();
    var interval = 1000 / GAME_VARIABLES.frameRate;
    function gameLoop() {
        var now = Date.now();
        var dt = (now - lastTime) / interval;
        lastTime = now;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Update game entities.
        screenManager.update(dt);

        // Draw game entities.
        screenManager.draw();

        // Call the next frame.
        loopId = requestAnimationFrame(gameLoop);
    }

    // Game entry point.
    var loopId = requestAnimationFrame(gameLoop);

    // Player inputs.
    document.addEventListener("keydown", (e) => {
        switch (e.key) {
            case GAME_VARIABLES.p1Controls.up:
            case GAME_VARIABLES.p1Controls.down:
            case GAME_VARIABLES.p2Controls.up:
            case GAME_VARIABLES.p2Controls.down:
            case GAME_VARIABLES.sharedControls.pause:
                GAME_VARIABLES.inputKeys[e.key] = true;
                break;
        }
    });
    document.addEventListener("keyup", (e) => {
        switch (e.key) {
            case GAME_VARIABLES.p1Controls.up:
            case GAME_VARIABLES.p1Controls.down:
            case GAME_VARIABLES.p2Controls.up:
            case GAME_VARIABLES.p2Controls.down:
            case GAME_VARIABLES.sharedControls.pause:
                GAME_VARIABLES.inputKeys[e.key] = false;
                break;
        }
    });
    canvas.addEventListener("click", (e) => {
        e.preventDefault();
        var pos = Util.getMousePos(canvas, e);
        screenManager
            .getCurrentScreen()
            .handleMouseClick(pos);
    });

    const Util = {
        getMousePos: function(canvas, event) {
            var rect = canvas.getBoundingClientRect();
            return {
                x: event.clientX - rect.x,
                y: event.clientY - rect.y
            };
        },
        isInside: function(pos, rect) {
            if (pos.x >= rect.x && 
                pos.x <= rect.x + rect.width &&
                pos.y >= rect.y &&
                pos.y <= rect.y + rect.height) {
                    return true;
                }
            return false;
        }
    }

    // Run test cases.
    try {
        testReboundAngle(new Ball(), new Paddle());
    } catch(e) {
        console.log(e);
    } finally {
        console.log("Running tests complete.")
    }
}

function testReboundAngle(ball, paddle) {
    function assert(name, x) {
        if (!x) {
            throw "Assertion failed: " + name;
        }
    }

    var positionFar = paddle.sectionSize * 4; // Dist from center of paddle to the end.

    assert("positive angle", ball.getReboundAngle(40, 50, 50 - positionFar) > 0);
    assert("max angle", ball.getReboundAngle(50 - positionFar, 50, 50 - positionFar) <= GAME_VARIABLES.bounceAngleRadians);
    assert("min angle", ball.getReboundAngle(50 + ball.width, 50, 50 + positionFar) >= (Math.PI / 180) * 1);

    var angleLowerSection = ball.getReboundAngle(315, 305, 305 + positionFar);
    assert("lower section of paddle within bounds", angleLowerSection > 0 && angleLowerSection <= GAME_VARIABLES.bounceAngleRadians);

    var angleUpperSection = ball.getReboundAngle(290, 300, 300 - positionFar);
    assert("upper section of paddle within bounds", angleUpperSection > 0 && angleUpperSection <= GAME_VARIABLES.bounceAngleRadians);

    var angleBallOutOfBoundsLower = ball.getReboundAngle(300 + positionFar + 1, 300, 300 + positionFar);
    assert("ball started out of bounds of lower section", angleBallOutOfBoundsLower > GAME_VARIABLES.bounceAngleRadians);

    var angleBallOutOfBoundsUpper = ball.getReboundAngle(300 - positionFar - 1, 300, 300 - positionFar);
    assert("ball started out of bounds of upper section", angleBallOutOfBoundsUpper > GAME_VARIABLES.bounceAngleRadians);
}