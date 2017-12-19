const USER_SPEED_CHANGE = 0.1;
const USER_PRESS_DELAY = 1000;
const ALIEN_GENERATION_CHANCE = 0.01;
const RECOVERY_CHANCE = 0.005;
const COLLISION_X_DELTA = 10;
const COLLISION_Y_DELTA = 10;

class GameObject {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.model = null;
    this.index = 0;
  }

  // Basic kinematics
  update() {
    this.x += this.vx;
    this.y += this.vy;
  }

  // Basic rendering
  render() {
    if (this.model) {
      const element = document.querySelector(this.model);
      element.style.left = this.x + '%';
      element.style.top =  this.y + '%';
    }
  }

  onCollision() {

  }
};

var alienIndex = 0;
class Alien extends GameObject {
  constructor(x, y) {
    super(x, y);
    this.vx = 2.0;
    this.vy = -2.5;
    this.health = 1;

    this.model = 'alien.alien-' + alienIndex;

    this.type = "alien";

    if(!document.querySelector(this.model)) {
      var newAlien = document.createElement('alien');
      var world = document.getElementsByTagName('world')[0];
      newAlien.setAttribute('class', 'alien-'+alienIndex);
      world.appendChild(newAlien);
    }

    alienIndex++;
  }

  update() {
    // Fake friction
    const friction = 0.005;
    this.vx *= (1 - friction);
    this.vy *= (1 - friction);

    // Bounces!
    // Left boundary
    if (this.x < 0) {
      this.x = 0;
      this.vx *= -1;

    }
    // Top boundary
    if (this.y < 0) {
      this.y = 0;
      this.vy *= -1;
    }
    // Right boundary
    if (this.x > 100) {
      this.x = 100;
      this.vx *= -1;
    }
    // Bottom boundary
    if (this.y > 100) {
      this.y = 100;
      this.vy *= -1;
    }

    // Base update (kinematics)
    super.update();
  }

  onCollision(gameObject, callback) {
    if (gameObject.type !== this.type) {
      this.health--;
      if(this.health <= 0) {
        callback(this, 'DEATH');

        var alien = document.querySelector(this.model);
        var world = document.getElementsByTagName('world')[0];
        world.removeChild(alien);
      }
    }
  }
};

class Player extends Alien {
  constructor(x, y) {
    super(x, y);
    this.vx = 0.0;
    this.vy = 0.0;
    this.model = 'player';

    this.type = 'player';

    this.health = 3;
  }

  update() {
    super.update();

    if (Math.random() < RECOVERY_CHANCE) {
      this.health++;
    }
  }

  render() {
    super.render();

    if (this.model) {
      const element = document.querySelector(this.model);
      element.innerHTML = this.health;
    }
  }

  //Player Input
  accelerate(direction) {
    this.vx += direction.x * USER_SPEED_CHANGE;
    this.vy += direction.y * USER_SPEED_CHANGE;
  }
}

class World {
  constructor(initialGameObjects) {
    this.gameObjects = initialGameObjects;

    this.processEvent = this.processEvent.bind(this);
  }

  update() {
    if(this.newAlienCheck()) {
      this.generateNewAlien();
    }

    this.gameObjects.forEach( gObj => { gObj.update(); });

    //Check collisions
    for (let i = 0; i < this.gameObjects.length - 1; i++) {
      for (let j = i + 1; j < this.gameObjects.length; j++) {
        const obj1 = this.gameObjects[i];
        const obj2 = this.gameObjects[j];
        if (this.checkCollisionBetween(obj1, obj2)) {
          //Resolve collision
          obj1.onCollision(obj2, this.processEvent);
          obj2.onCollision(obj1, this.processEvent);
        }
      }
    }

  }

  render() {
    this.gameObjects.forEach(gObj => { gObj.render(); });
  }

  newAlienCheck() {
    return ( Math.random() < ALIEN_GENERATION_CHANCE );
  }

  generateNewAlien() {
    const x = Math.floor(Math.random() * 100);
    const y = Math.floor(Math.random() * 100);
    this.gameObjects.push(new Alien(x, y));
  }

  checkCollisionBetween(obj1, obj2) {
    return  (
      obj1.x < obj2.x + COLLISION_X_DELTA &&
      obj1.x + COLLISION_X_DELTA > obj2.x &&
      obj1.y < obj2.y + COLLISION_Y_DELTA &&
      obj1.y + COLLISION_Y_DELTA > obj2.y
    );
  }

  processEvent(gameObject, e) {
    if (e === 'DEATH') {
      this.gameObjects = this.gameObjects.filter(gObj => gObj !== gameObject);
    } else {
      console.warn('Undefined game event was triggered');
    }
  }
}

// Wait for everything to load...
document.addEventListener('DOMContentLoaded', function(event) {
  // Initialize game objects
  const alien = new Alien(15, 20);
  const player = new Player(45, 30);
  const world = new World([alien, player]);

  // Game loop definition
  const update = () => {
    world.update();
    world.render();
    window.requestAnimationFrame(update);
  };

  document.addEventListener('keydown', e => {onPlayerInput(e);});

  // Start game loop!
  update();

  function onPlayerInput(e) {
    if(e.keyCode >= 37 && e.keyCode <= 40) {
      console.log('key down');
      const direction = {
        37: {x: -1, y: 0},
        38: {x: 0, y: -1},
        39: {x: 1, y: 0},
        40: {x: 0, y: 1}
      }[e.keyCode];

      player.accelerate(direction);
    }
  }
});
