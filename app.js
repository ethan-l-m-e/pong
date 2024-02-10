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
        x: canvas.width / 2,
        y: canvas.height / 2,
        speed: 3,
        direction: { x: -1, y: 0 },
        width: 5,
        collideOn: true,
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

            // Update position.
            this.x += this.speed * this.direction.x;
            this.y += this.speed * this.direction.y;
        },
        collideLeft: function(leftPaddle) {
            if (!this.collideOn) return;

            // If one point of ball exists within the bounds of paddle.
            if (this.x <= leftPaddle.x + leftPaddle.width / 2 && 
                this.x + this.width> leftPaddle.x &&
                this.y <= leftPaddle.y + leftPaddle.height &&
                this.y + this.width >= leftPaddle.y) {
                
                if (this.y > leftPaddle.y + 20) { // Ball is at lower section.
                    var angle = GAME_VARIABLES.bounceAngleRadians * ((this.y + this.width / 2) - (leftPaddle.y + 20)) * 0.1;
                    this.direction.x = Math.cos(angle);
                    this.direction.y = Math.sin(angle);
                } else if (this.y < leftPaddle.y + 10) { // Ball is at upper section.
                    var angle = GAME_VARIABLES.bounceAngleRadians * ((leftPaddle.y + 10) - (this.y + this.width / 2)) * 0.1;
                    this.direction.x = Math.cos(angle);
                    this.direction.y = -Math.sin(angle);
                } else { // Ball is at middle section.
                    this.direction.x = 1;
                    this.direction.y = 0;
                }
                this.collideSleep();
            }
        },
        collideRight: function(rightPaddle) {
            if (!this.collideOn) return;

            // If one point of ball exists within the bounds of paddle.
            if (this.x + this.width >= rightPaddle.x && 
                this.x < rightPaddle.x + rightPaddle.width / 2 &&
                this.y <= rightPaddle.y + rightPaddle.height &&
                this.y + this.width >= rightPaddle.y) {
                
                if (this.y > rightPaddle.y + 20) { // Ball is at lower section.
                    var angle = GAME_VARIABLES.bounceAngleRadians * ((this.y + this.width / 2) - (rightPaddle.y + 20)) * 0.1;
                    this.direction.x = -Math.cos(angle);
                    this.direction.y = Math.sin(angle);
                } else if (this.y < rightPaddle.y + 10) { // Ball is at upper section.
                    var angle = GAME_VARIABLES.bounceAngleRadians * ((rightPaddle.y + 10) - (this.y + this.width / 2)) * 0.1;
                    this.direction.x = -Math.cos(angle);
                    this.direction.y = -Math.sin(angle);
                } else { // Ball is at middle section.
                    this.direction.x = -1;
                    this.direction.y = 0;
                }
                this.collideSleep();
            }
        },
        collideSleep: function() {
            this.collideOn = false;
            setTimeout(() => {
                this.collideOn = true;
            }, 1000);
        }
    }

    class paddle {
        constructor(x, y, controls) {
            this.x = x;
            this.y = y;
            this.width = 5;
            this.height = 30;
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
}