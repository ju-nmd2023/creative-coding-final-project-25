let img,
  imagePixelArray,
  brightness,
  brightnessArray = [],
  angleArray = [],
  edgeArray = [],
  prevBrightnessArray = [];

let amount = 15000;
let particles = [amount];
let frameCounter = 0;
let updateRate = 60; // Update flow field every 5 frames
let globalDirection = 0; // Shared direction for all particles

function preload() {
  // No preload needed for webcam
}
function setup() {
  createCanvas(innerWidth, innerHeight);
  img = createCapture(VIDEO);
  img.size(810, 540); // Reduce resolution for better performance
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

    // Set new global direction for all particles
    globalDirection = random(TWO_PI);

    // Apply random acceleration to all particles when frame updates
    for (let i = 0; i < particles.length; i++) {
      particles[i].applyRandomAcceleration();
      particles[i].setGlobalDirection(globalDirection);
    }
  }

  fill(0, 100);
  noStroke();
  rect(0, 0, width, height);
  for (let i = 0; i < particles.length; i++) {
    particles[i].run();
  }
}

function calculateBrightness() {
  // Store previous brightness for motion detection
  prevBrightnessArray = [...brightnessArray];

  let pixel = 0;
  for (let i = 0; i < imagePixelArray.length; i += 4) {
    let r = imagePixelArray[i];
    let g = imagePixelArray[i + 1];
    let b = imagePixelArray[i + 2];

    // Weighted brightness calculation (human eye sensitivity)
    let brightness = r * 0.299 + g * 0.587 + b * 0.114;
    brightnessArray[pixel] = brightness / 255;

    // Calculate edge strength using Sobel operator
    let edgeStrength = calculateSobelEdge(pixel);
    edgeArray[pixel] = edgeStrength;

    // Motion detection
    let motionStrength = 0;
    if (prevBrightnessArray[pixel] !== undefined) {
      motionStrength = abs(brightnessArray[pixel] - prevBrightnessArray[pixel]);
    }

    // Combine brightness, edges, and motion for angle calculation
    let combinedValue = brightnessArray[pixel] * 0.4 + edgeStrength * 0.4 + motionStrength * 0.2;

    // Create more dynamic angles based on combined factors
    angleArray[pixel] = map(combinedValue, 0, 1, 0, TWO_PI * 3) + noise(pixel * 0.01, frameCounter * 0.01) * PI;

    pixel++;
  }
}

function calculateSobelEdge(pixelIndex) {
  let x = pixelIndex % img.width;
  let y = Math.floor(pixelIndex / img.width);

  // Skip edge pixels to avoid array bounds issues
  if (x <= 0 || x >= img.width - 1 || y <= 0 || y >= img.height - 1) {
    return 0;
  }

  // Sobel X kernel: [-1, 0, 1, -2, 0, 2, -1, 0, 1]
  // Sobel Y kernel: [-1, -2, -1, 0, 0, 0, 1, 2, 1]
  let sobelX = 0;
  let sobelY = 0;

  // Sample 3x3 neighborhood
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      let neighborX = x + dx;
      let neighborY = y + dy;
      let neighborIndex = (neighborY * img.width + neighborX) * 4;

      if (neighborIndex >= 0 && neighborIndex < imagePixelArray.length) {
        // Get brightness of neighbor pixel
        let neighborBrightness = (imagePixelArray[neighborIndex] * 0.299 + imagePixelArray[neighborIndex + 1] * 0.587 + imagePixelArray[neighborIndex + 2] * 0.114) / 255;

        // Apply Sobel kernels
        let kernelIndex = (dy + 1) * 3 + (dx + 1);
        let sobelXKernel = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
        let sobelYKernel = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

        sobelX += neighborBrightness * sobelXKernel[kernelIndex];
        sobelY += neighborBrightness * sobelYKernel[kernelIndex];
      }
    }
  }

  // Calculate edge magnitude
  let magnitude = Math.sqrt(sobelX * sobelX + sobelY * sobelY);

  // Normalize and enhance edge detection
  return Math.min(magnitude * 2, 1); // Multiply by 2 to enhance edges
}

class Particle {
  constructor(loc, dir, speed) {
    this.loc = loc;
    this.dir = dir;
    this.baseSpeed = speed;
    this.speed = speed;
    this.acceleration = 0;
    this.accelerationDecay = 0.9;
    this.d = 2;
    this.globalDir = createVector(0, 0);
    this.globalInfluence = 1; // How much the global direction affects this particle
    this.globalDecay = 0.95; // How quickly global influence fades
  }

  run() {
    this.move();
    this.checkEdges();
    this.update();
    this.updateAcceleration();
  }

  move() {
    let angle = angleArray[floor(this.loc.x) + floor(this.loc.y) * img.width];

    // Blend flow field direction with global direction
    let flowDir = createVector(cos(angle), sin(angle));

    // Mix the flow field direction with global direction based on influence
    this.dir.x = lerp(flowDir.x, this.globalDir.x, this.globalInfluence);
    this.dir.y = lerp(flowDir.y, this.globalDir.y, this.globalInfluence);

    var vel = this.dir.copy();
    vel.mult(this.speed * this.d);
    this.loc.add(vel);

    // Decay global influence over time
    this.globalInfluence *= this.globalDecay;
  }

  setGlobalDirection(angle) {
    // Set the global direction for this particle
    this.globalDir.x = cos(angle);
    this.globalDir.y = sin(angle);
    this.globalInfluence = 1; // Reset influence to maximum
  }

  applyRandomAcceleration() {
    // Add random burst of acceleration when frame updates
    this.acceleration += random(2, 6);
  }

  updateAcceleration() {
    // Apply acceleration to current speed
    this.speed = this.baseSpeed + this.acceleration;

    // Decay acceleration over time
    this.acceleration *= this.accelerationDecay;

    // Reset acceleration when it gets very small
    if (this.acceleration < 0.01) {
      this.acceleration = 0;
    }
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
