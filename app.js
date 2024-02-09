const GAME_VARIABLES = {
    "canvasWidth": 800,
    "canvasHeight": 600,
    inputKeys: [],
    p1Controls: { up: "w", down: "s" },
    p2Controls: { up: "ArrowUp", down: "ArrowDown" }
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
        vx: 2,
        vy: 5,
        width: 5,
        draw: function() {
            ctx.fillStyle = "#FFF";
            ctx.fillRect(this.x, this.y, this.width, this.width);
        },
        update: function() {
            // Reverse directions at screen edges.
            if (this.x + this.width >= canvas.width || this.x <= 0) {
                this.vx = -this.vx;
            }
            if (this.y + this.width >= canvas.height || this.y <= 0) {
                this.vy = -this.vy;
            }

            // Update position.
            this.x += this.vx;
            this.y += this.vy;
        },
        collideLeft: function(leftPaddle) {
            // If one point of ball exists within the bounds of paddle.
            if (this.x <= leftPaddle.x + leftPaddle.width / 2 && 
                this.x > leftPaddle.x &&
                this.y <= leftPaddle.y + leftPaddle.height &&
                this.y + this.width >= leftPaddle.y) {
                
                if (this.y > leftPaddle.y + 20) { // Ball is at lower section.
                    // Get a direction based on dist from center.
                    this.vx = 2;
                    this.vy = 5
                } else if (this.y < leftPaddle.y + 10) { // Ball is at upper section.
                    this.vx = 2;
                    this.vy = -5
                } else { // Ball is at middle section.
                    this.vx = 2;
                    this.vy = 0;
                }
            }
        },
        collideRight: function(rightPaddle) {
            // If one point of ball exists within the bounds of paddle.
            if (this.x + this.width >= rightPaddle.x && 
                this.x + this.width < rightPaddle.x + rightPaddle.width / 2 &&
                this.y <= rightPaddle.y + rightPaddle.height &&
                this.y + this.width >= rightPaddle.y) {
                
                if (this.y > rightPaddle.y + 20) { // Ball is at lower section.
                    // Get a direction based on dist from center.
                    this.vx = -2;
                    this.vy = 5
                } else if (this.y < rightPaddle.y + 10) { // Ball is at upper section.
                    this.vx = -2;
                    this.vy = -5
                } else { // Ball is at middle section.
                    this.vx = -2;
                    this.vy = 0;
                }
            }
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