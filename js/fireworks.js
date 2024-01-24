let gravity;
let force;
let nb_particles;
let fireworks = [];

function setup() {
  createCanvas(window.innerWidth, window.innerHeight);
  colorMode(RGB);
  stroke(0);
  gravity = createVector(0, 0.15);
  force = createVector(0, 0.002);
  background(255);
}

function draw() {
  colorMode(RGB);

  nb_particles = random(40, 100);

  if (random(1) < 0.01) {
    nb_particles = random(500);
  }

  background(0, 0, 0, 25);

  if (random(1) < 0.05) {
    fireworks.push(new Firework());
  }

  for (let i = fireworks.length - 1; i >= 0; i--) {
    fireworks[i].update();
    fireworks[i].show();

    if (fireworks[i].done()) {
      fireworks.splice(i, 1);
    }
  }
}


function Firework() {
  this.hu = random(255);
  this.firework = new Particle(random(width), height, true, this.hu);
  this.isExploded = false;
  this.particles = [];
  this.update = function () {
    if (!this.isExploded) {
      this.firework.applyForce(gravity);

      this.firework.applyForce(createVector(random(-0.1, 0.1)));

      this.firework.update();
      if (this.firework.vel.y >= 0) {
        this.isExploded = true;
        this.explode();
      }
    }
    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].update();
      if (this.particles[i].done()) {
        this.particles.splice(i, 1);
      }
    }
  };

  this.done = function () {
    return this.isExploded && this.particles.length === 0;
  };

  this.explode = function () {
    for (let i = 0; i < nb_particles; i++) {
      if (random(1) < 0.05) {
        this.hu = random(0, 255);
      }
      let p = new Particle(
        this.firework.pos.x,
        this.firework.pos.y,
        false,
        this.hu
      );
      this.particles.push(p);
    }
  };

  this.show = function () {
    colorMode(RGB);
    if (!this.isExploded) {
      this.firework.show();
    }
    for (let i = 0; i < this.particles.length; i++) {
      this.particles[i].applyForce(force);
      this.particles[i].show();
      this.particles[i].update();
    }
  };
}


function Particle(x, y, firework, hu) {
    this.hu = hu;
    this.firework = firework;
    this.lifespan = 255;
    this.pos = createVector(x, y);
    if (this.firework) {
      this.vel = createVector(0, random(-7, -13));
    } else {
      this.vel = p5.Vector.random2D();
      this.vel.mult(random(1.55));
    }
    this.acc = createVector(0, 0);
  
    // function to apply a force to the particle
    this.applyForce = function (force) {
      this.acc.add(force);
    };
  
    this.done = function () {
      return this.lifespan <= 0;
    };
  
    // function to update the particle overtime
    this.update = function () {
      if (!this.firework) {
        this.vel.mult(0.99);
        this.lifespan -= 0.5;
      }
      // Euler integration
      this.vel.add(this.acc);
      this.pos.add(this.vel);
      this.acc.mult(0);
    };
  
    // function to show the particle
    this.show = function () {
      colorMode(HSB);
      if (!this.firework) {
        strokeWeight(Math.tan(this.vel.x) * 10);
        stroke(this.hu, this.lifespan, this.lifespan, this.lifespan);
      } else {
        strokeWeight(3);
        stroke(this.hu, 255, 255, this.lifespan);
      }
      point(this.pos.x, this.pos.y);
    };
  }
