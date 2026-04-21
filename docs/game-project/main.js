const app = new AppController();

function preload() {
   app.preload();
}

function setup() {
   app.setup();
}

function draw() {
   app.draw();
}

function mousePressed() {
   return app.mousePressed();
}

function keyPressed() {
   return app.keyPressed(key, keyCode);
}

function mouseWheel(event) {
   return app.mouseWheel(event);
}
