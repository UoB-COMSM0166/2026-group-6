function setup() {
  createCanvas(600, 800);
  background("grey");
}
function draw() {

  //when mouse button is pressed, circles turn black
  if (mouseIsPressed === true) {
    noStroke();
    fill(random(255), random(255),random(255));
      //white circles drawn at mouse position
    circle(mouseX, mouseY, 15);
  }
}
