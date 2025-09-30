let img,
  imagePixelArray,
  brightness,
  brightnessArray = [],
  angleArray = [];

let amount = 3000;
let particles = [amount];
let frameCounter = 0;
let updateRate = 15; // Update flow field every 5 frames

function preload() {
  // No preload needed for webcam
}
function setup() {
  createCanvas(innerWidth, innerHeight);
  img = createCapture(VIDEO);
  img.size(1080, 720); // Reduce resolution for better performance
  img.hide(); // Hide the video element
  background(0);
  for (let i = 0; i < amount; i++) {
    var loc = createVector(random(img.width), random(height), 1);
    var angle = 0;
    var dir = createVector(cos(angle), sin(angle));
    var speed = random(0.5, 2);
    particles[i] = new Particle(loc, dir, speed);
  }
}

function draw() {
  frameCounter++;

  // Only update the flow field every 'updateRate' frames to prevent lag
  if (frameCounter % updateRate === 0) {
    img.loadPixels();
    imagePixelArray = img.pixels;
    calculateBrightness();
  }

  fill(0, 15);
  noStroke();
  rect(0, 0, width, height);
  for (let i = 0; i < particles.length; i++) {
    particles[i].run();
  }
}

function calculateBrightness() {
  let pixel = 0;
  for (let i = 0; i < imagePixelArray.length; i += 4) {
    let r = imagePixelArray[i];
    let g = imagePixelArray[i + 1];
    let b = imagePixelArray[i + 2];
    let avg = (r + g + b) / 3;
    brightnessArray[pixel] = map(avg, 0, 255, 0, 1);
    angleArray[pixel] = map(brightnessArray[pixel], 0, 1, 0, TWO_PI);
    pixel++;
  }
}

class Particle {
  constructor(loc, dir, speed) {
    this.loc = loc;
    this.dir = dir;
    this.speed = speed;
  }

  run() {
    this.move();
    this.checkEdges();
    this.update();
  }
  move() {
    let angle = angleArray[floor(this.loc.x) + floor(this.loc.y) * img.width];
    this.dir.x = cos(angle);
    this.dir.y = sin(angle);
    var vel = this.dir.copy();
    var d = 2;
    vel.mult(this.speed * d);
    this.loc.add(vel);
  }
  checkEdges() {
    if (this.loc.x > img.width) {
      this.loc.x = random(img.width);
      this.loc.y = random(img.height);
    }
    if (this.loc.x < 0) {
      this.loc.x = random(img.width);
      this.loc.y = random(img.height);
    }
    if (this.loc.y > img.height) {
      this.loc.y = random(img.height);
      this.loc.x = random(img.width);
    }
    if (this.loc.y < 0) {
      this.loc.y = random(img.height);
      this.loc.x = random(img.width);
    }
  }
  update() {
    fill(255);
    ellipse(this.loc.x, this.loc.y, this.loc.z);
  }
}

/*function createFlowField() {
  let scale = 20; // Size of each flow field cell
  let cols = Math.floor(img.width / scale);
  let rows = Math.floor(img.height / scale);

  stroke(100);
  strokeWeight(1);

  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) {
      // Map grid position to image pixel coordinates
      let imgX = Math.floor(x * scale);
      let imgY = Math.floor(y * scale);
      let index = imgX + imgY * img.width;

      if (index < angleArray.length) {
        let angle = angleArray[index];

        let xPos = x * scale + scale / 2;
        let yPos = y * scale + scale / 2;

        // Calculate flow field vector direction
        let xEnd = xPos + cos(angle) * scale * 0.4;
        let yEnd = yPos + sin(angle) * scale * 0.4;

        // Draw flow field line
        line(xPos, yPos, xEnd, yEnd);

        // Optional: Draw arrowhead
        push();
        translate(xEnd, yEnd);
        rotate(angle);
        line(0, 0, -5, -2);
        line(0, 0, -5, 2);
        pop();
      }
    }
  }
}*/
