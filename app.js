const GAME_VARIABLES = {
    canvasWidth: 800,
    canvasHeight: 600,
    inputKeys: [],
    p1Controls: { up: "w", down: "s" },
    p2Controls: { up: "ArrowUp", down: "ArrowDown" },
    bounceAngleRadians: (Math.PI / 180) * 45, // Max rebound angle.
    gameState: { "PREPARATION": 0, "PLAYING": 1, "GAMEOVER": 2 }
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

    class ArenaManager {
        constructor(ball, paddle1, paddle2, scoreBoard) {
            this.ball = ball;
            this.paddle1 = paddle1;
            this.paddle2 = paddle2;
            this.scoreBoard = scoreBoard;
            this.goalSize = { width: canvas.width * .1, height: canvas.height };
            this.nextBallDirection = 1;
            this.gameState = GAME_VARIABLES.gameState.PREPARATION;
        }
        updateArena() {
            if (this.gameState === GAME_VARIABLES.gameState.PLAYING) {
                paddle1.update();
                paddle2.update();
                ball.update();
                ball.collideLeft(paddle1);
                ball.collideRight(paddle2);
                this.checkScored();
            }
            if (this.gameState === GAME_VARIABLES.gameState.PREPARATION) {
                paddle1.update();
                paddle2.update();
            }
            if (this.gameState === GAME_VARIABLES.gameState.GAMEOVER) {
                ball.update();
            }
        }
        drawArena() {
            if (this.gameState === GAME_VARIABLES.gameState.PLAYING) {
                ball.draw();
                paddle1.draw();
                paddle2.draw();
            }
            if (this.gameState === GAME_VARIABLES.gameState.PREPARATION) {
                paddle1.draw();
                paddle2.draw();
            }
            if (this.gameState === GAME_VARIABLES.gameState.GAMEOVER) {
                ball.draw();
            }
            this.drawScreenDivider();
            scoreBoard.drawScores();
            this.drawGoals();
        }
        // Line dividing two players' sides.
        drawScreenDivider() {
            ctx.beginPath();
            ctx.moveTo(400, 0);
            ctx.lineTo(400, 600);
            ctx.strokeStyle = "#FFF";
            ctx.setLineDash([8]);
            ctx.lineWidth = 1.5;
            ctx.stroke();
        };
        // Scoring area behind each player.
        drawGoals() {
            ctx.fillStyle = "#000"
            ctx.fillRect(0, 0, this.goalSize.width, this.goalSize.height);
            ctx.fillRect(canvas.width - this.goalSize.width, 0, this.goalSize.width, this.goalSize.height);
        }
        // Check for player scoring a point.
        checkScored() {
            var scoredLeft = (this.ball.x <= 0);
            var scoredRight = (this.ball.x + this.ball.width >= canvas.width);
            if (scoredLeft || scoredRight) {
                this.gameState = GAME_VARIABLES.gameState.PREPARATION;
                if (scoredLeft) { 
                    this.scoreBoard.incrementPlayerTwo();
                    this.nextBallDirection = -1;
                }
                if (scoredRight) { 
                    this.scoreBoard.incrementPlayerOne();
                    this.nextBallDirection = 1;
                }
                if (this.scoreBoard.getHighestScore() >= 11) {
                    this.gameOver();
                } else {
                    this.spawnBall();
                }
            }
        }
        gameStart() {
            this.gameState = GAME_VARIABLES.gameState.PREPARATION;
            this.scoreBoard.resetScore();
            this.paddle1.reset();
            this.paddle2.reset();
            this.spawnBall();
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
            setTimeout(() => {
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
                this.ball.spawn(position, direction, ball.minSpeed);
                this.gameState = GAME_VARIABLES.gameState.PLAYING;
            }, 2000);
        }
        gameOver() {
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
        update() {
            // Reverse directions at screen edges.
            const passedLeftBound = (this.x < 0);
            const passedRightBound = (this.x + this.width >= canvas.width);
            const passedUpperBound = (this.y < 0);
            const passedLowerBound = (this.y + this.width >= canvas.height);
            if (passedLeftBound || passedRightBound) {
                if (passedLeftBound) { this.x = 0; }
                if (passedRightBound) { this.x = canvas.width - this.width; }
                this.direction.x = -this.direction.x;
            }
            if (passedUpperBound || passedLowerBound) {
                if (passedUpperBound) { this.y = 0; }
                if (passedLowerBound) { this.y = canvas.height - this.width; }
                this.direction.y = -this.direction.y;
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
            this.x += this.speed * this.direction.x * adjustSpeedRatio;
            this.y += this.speed * this.direction.y;
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
                    this.x = surfaceOfPaddleX + (surfaceOfPaddleX - this.x);
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
                    this.x = surfaceOfPaddleX - (surfaceOfBallX - surfaceOfPaddleX) - this.width;
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
        update() {
            // Update position.
            if (GAME_VARIABLES.inputKeys[this.controls.up]) {
                this.y -= this.speed;
            }
            if (GAME_VARIABLES.inputKeys[this.controls.down]) {
                this.y += this.speed;
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

    var ball = new Whale();
    var paddle1 = new Paddle(canvas.width * 0.2, canvas.height / 2, GAME_VARIABLES.p1Controls);
    var paddle2 = new Paddle(canvas.width * 0.8, canvas.height / 2, GAME_VARIABLES.p2Controls);
    var scoreBoard = new ScoreManager();
    var arena = new ArenaManager(ball, paddle1, paddle2, scoreBoard);

    function gameLoop() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Update game entities.
        arena.updateArena();

        // Draw game entities.
        arena.drawArena();

        // Call the next frame.
        loopId = requestAnimationFrame(gameLoop);
    }

    // Game entry point.
    arena.gameOver();
    var loopId = requestAnimationFrame(gameLoop);

    // Player inputs.
    document.addEventListener("keydown", (e) => {
        switch (e.key) {
            case GAME_VARIABLES.p1Controls.up:
            case GAME_VARIABLES.p1Controls.down:
            case GAME_VARIABLES.p2Controls.up:
            case GAME_VARIABLES.p2Controls.down:
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
                GAME_VARIABLES.inputKeys[e.key] = false;
                break;
        }
    });

    // Run test cases.
    try {
        testReboundAngle(ball, new Paddle());
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