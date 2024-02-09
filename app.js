const GAME_VARIABLES = {
    "canvasWidth": 800,
    "canvasHeight": 600
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
        radius: 5,
        draw: function() {
            ctx.fillStyle = "#FFF";
            ctx.fillRect(this.x, this.y, 5, 5);
        },
        update: function() {
            // Prevent leaving screen bounds.
            if (this.x + this.radius >= canvas.width || this.x <= 0) {
                this.vx = -this.vx;
            }
            if (this.y + this.radius >= canvas.height || this.y <= 0) {
                this.vy = -this.vy;
            }

            // Update position.
            this.x += this.vx;
            this.y += this.vy;
        }
    }

    function gameLoop() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Update game entities.
        ball.update();

        // Draw game entities.
        ball.draw();

        // Call the next frame.
        loopId = requestAnimationFrame(gameLoop);
    }

    // Game entry point.
    var loopId = requestAnimationFrame(gameLoop);

    // Keyboard events.
    document.addEventListener("keydown", (e) => {
        switch (e.key) {
            case "q":
                cancelAnimationFrame(loopId);
                break;
        }
    });
}