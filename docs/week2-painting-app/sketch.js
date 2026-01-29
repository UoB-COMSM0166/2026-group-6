let h = 0;
const s = 100, b = 100, hueStep = 1;

function setup() {
  createCanvas(800, 600);
  colorMode(HSB, 360, 100, 100);
  background("grey"); 
  fill(0, 0, 100);
}

function draw() {
  if (mouseIsPressed==true) {
    noStroke();
    fill(h, s, b);
    circle(mouseX, mouseY, 15);
    h = (h + hueStep) % 360;
  }
}