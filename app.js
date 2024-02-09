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

    ctx.fillStyle = "#FFF";
    ctx.fillRect(canvas.width / 2, canvas.height / 2, 5, 5);
}