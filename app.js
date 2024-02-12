const GAME_VARIABLES = {
    "canvasWidth": 800,
    "canvasHeight": 600,
    inputKeys: [],
    p1Controls: { up: "w", down: "s" },
    p2Controls: { up: "ArrowUp", down: "ArrowDown" },
    bounceAngleRadians: (Math.PI / 180) * 60
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

    const ball = {
        x: canvas.width / 2 ,
        y: canvas.height / 2 + 10,
        speed: 5,
        direction: { x: -1, y: 0 },
        width: 5,
        previous: { x: this.x, y: this.y},
        draw: function() {
            ctx.fillStyle = "#FFF";
            ctx.fillRect(this.x, this.y, this.width, this.width);
        },
        update: function() {
            // Reverse directions at screen edges.
            if (this.x + this.width >= canvas.width || this.x <= 0) {
                this.direction.x = -this.direction.x;
            }
            if (this.y + this.width >= canvas.height || this.y <= 0) {
                this.direction.y = -this.direction.y;
            }

            // Save previous position.
            this.previous.x = this.x;
            this.previous.y = this.y;

            // Update position.
            this.x += this.speed * this.direction.x;
            this.y += this.speed * this.direction.y;
        },
        collideLeft: function(leftPaddle) {
            var surfaceOfPaddleX = leftPaddle.x + leftPaddle.width;

            // Is paddle between current & previous position.
            if (this.x <= surfaceOfPaddleX && this.previous.x > surfaceOfPaddleX) {
                var dydx = (this.y - this.previous.y) / (this.x - this.previous.x);
                var c = this.y - dydx * this.x;
                var y = dydx * surfaceOfPaddleX + c;

                // Would ball have touched paddle when it was at the paddle's x-position.
                if (y <= leftPaddle.y + leftPaddle.height && y + this.width >= leftPaddle.y) {

                    // Adjust ball back to the surface of paddle.
                    this.x = surfaceOfPaddleX + (surfaceOfPaddleX - (this.x + this.width));
                    this.y = y;

                    var lowerPaddleStart = leftPaddle.y + leftPaddle.sectionSize * 2;
                    var upperPaddleStart = leftPaddle.y + leftPaddle.sectionSize;
                    // Derive rebound angle.
                    if (this.y > leftPaddle.y + leftPaddle.sectionSize * 2) {
                        // Ball is at lower section.
                        var angle = this.getReboundAngle(this.y, lowerPaddleStart, leftPaddle.y + leftPaddle.height);
                        this.direction.x = Math.cos(angle);
                        this.direction.y = Math.sin(angle);
                    } else if (this.y + this.width < leftPaddle.y + leftPaddle.sectionSize) {
                        // Ball is at upper section.
                        var angle = this.getReboundAngle(this.y + this.width, upperPaddleStart, leftPaddle.y);
                        this.direction.x = Math.cos(angle);
                        this.direction.y = -Math.sin(angle);
                    } else {
                        // Ball is at middle section.
                        // Rebound at 90 degrees.
                        this.direction.x = 1;
                        this.direction.y = 0;
                    }
                }
            }
        },
        collideRight: function(rightPaddle) {
            var surfaceOfPaddleX = rightPaddle.x;
            var surfaceOfBallX = this.x + this.width; // Right face of ball.
            var prevSurfaceOfBallX = this.previous.x + this.width;

            // Is paddle between current & previous position.
            if (surfaceOfBallX >= surfaceOfPaddleX && prevSurfaceOfBallX < surfaceOfPaddleX) {
                var dydx = (this.y - this.previous.y) / (surfaceOfBallX - prevSurfaceOfBallX);
                var c = this.y - dydx * this.x;
                var y = dydx * surfaceOfPaddleX + c;

                // Would ball have touched paddle when it was at the paddle's x-position.
                if (y <= rightPaddle.y + rightPaddle.height && y + this.width >= rightPaddle.y) {

                    // Adjust ball position.
                    this.x = surfaceOfPaddleX - (this.x - surfaceOfPaddleX) - this.width;
                    this.y = y;

                    var lowerPaddleStart = rightPaddle.y + rightPaddle.sectionSize * 2;
                    var upperPaddleStart = rightPaddle.y + rightPaddle.sectionSize;
                    // Derive rebound angle.
                    if (this.y > rightPaddle.y + rightPaddle.sectionSize * 2) {
                        // Ball is at lower section.
                        var angle = this.getReboundAngle(this.y, lowerPaddleStart, rightPaddle.y + rightPaddle.height);
                        this.direction.x = -Math.cos(angle);
                        this.direction.y = Math.sin(angle);
                    } else if (this.y + this.width < rightPaddle.y + rightPaddle.sectionSize) {
                        // Ball is at upper section.
                        var angle = this.getReboundAngle(this.y + this.width, upperPaddleStart, rightPaddle.y);
                        this.direction.x = -Math.cos(angle);
                        this.direction.y = -Math.sin(angle);
                    } else {
                        // Ball is at middle section.
                        // Rebound at 90 degrees.
                        this.direction.x = -1;
                        this.direction.y = 0;
                    }
                }
            }
        },
        getReboundAngle: function(ballStart, paddleStart, paddleEnd) {
            var ballDistance = Math.abs(paddleStart - ballStart);
            var paddleRegion = Math.abs(paddleEnd - paddleStart);
            var percentOfAngle = ballDistance / paddleRegion;
            return GAME_VARIABLES.bounceAngleRadians * percentOfAngle;
        }
    }

    class paddle {
        constructor(x, y, controls) {
            this.x = x;
            this.y = y;
            this.width = 5;
            this.height = 30;
            this.sectionSize = this.height / 3;
            this.controls = controls;
        }
        draw() {
            ctx.fillStyle = "#FFF";
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
        update() {
            // Update position.
            if (GAME_VARIABLES.inputKeys[this.controls.up]) {
                this.y -= 10;
            }
            if (GAME_VARIABLES.inputKeys[this.controls.down]) {
                this.y += 10;
            }

            // Hold paddle from travelling beyond intended bounds.
            if (this.y >= canvas.height * 0.9) {
                this.y = canvas.height * 0.9;
            } else if (this.y <= canvas.height * 0.05) {
                this.y = canvas.height * 0.05;
            };
        }
    }

    var paddle1 = new paddle(canvas.width * 0.2, canvas.height / 2, GAME_VARIABLES.p1Controls);
    var paddle2 = new paddle(canvas.width * 0.8, canvas.height / 2, GAME_VARIABLES.p2Controls);

    function gameLoop() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Update game entities.
        ball.update();
        paddle1.update();
        paddle2.update();
        ball.collideLeft(paddle1);
        ball.collideRight(paddle2);

        // Draw game entities.
        ball.draw();
        paddle1.draw();
        paddle2.draw();

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
        testReboundAngle(ball, new paddle());
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

    assert("positive angle", ball.getReboundAngle(40, 50, 50 - paddle.sectionSize) > 0);
    assert("max angle", ball.getReboundAngle(40, 50, 50 - paddle.sectionSize) <= GAME_VARIABLES.bounceAngleRadians);
    assert("min angle", ball.getReboundAngle(50 + ball.width, 50, 50 - paddle.sectionSize) >= (Math.PI / 180) * 1);

    var angleLowerSection = ball.getReboundAngle(315, 305, 305 + paddle.sectionSize);
    assert("lower section of paddle within bounds", angleLowerSection > 0 && angleLowerSection <= GAME_VARIABLES.bounceAngleRadians);

    var angleUpperSection = ball.getReboundAngle(290, 300, 300 - paddle.sectionSize);
    assert("upper section of paddle within bounds", angleUpperSection > 0 && angleUpperSection <= GAME_VARIABLES.bounceAngleRadians);

    var angleBallOutOfBoundsLower = ball.getReboundAngle(311, 300, 300 + paddle.sectionSize);
    assert("ball started out of bounds of upper section", angleBallOutOfBoundsLower > GAME_VARIABLES.bounceAngleRadians);

    var angleBallOutOfBoundsUpper = ball.getReboundAngle(289, 300, 300 - paddle.sectionSize);
    assert("ball started out of bounds of upper section", angleBallOutOfBoundsUpper > GAME_VARIABLES.bounceAngleRadians);
}