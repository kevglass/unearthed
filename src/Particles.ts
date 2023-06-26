import { TILE_SIZE } from "./Map";
import { getSprite } from "./Resources";

// 
// An extremely simple particle engine. Particles are created and have a life. While alive they are rendered. 
// As their life progresses they fade out. Once life is completed they're removed.
//

/** The global list of all the particles on the screen */
let particles: Particle[] = [];

/**
 * Create a simple dirt particle at a given world location
 * 
 * @param x The x coordinate at which to create the particle
 * @param y The y coordinate at which to create the particle
 * @returns The created particle for chaining.
 */
export function createDirtParticle(x: number, y: number): Particle {
    const sprite = Math.random() > 0.5 ? getSprite("red.particle") : getSprite("orange.particle");
    const vx = (Math.random() - 0.5) * 10;
    const vy = (-Math.random()) * 10;
    x += (Math.random() - 0.5) * (TILE_SIZE / 3);
    y += (Math.random() - 0.5) * (TILE_SIZE / 3);
    const life = 0.5 + (Math.random() * 0.5);
    return new Particle(sprite, life, x, y, vx, vy);
}

/**
 * A simple particle class. Particles exist for a life span. They fade out over that live span. They
 * have 2D component velocity and are effected by gravity.
 */
export class Particle {
    /** The image to draw for this particle */
    sprite: HTMLImageElement;
    /** The life remaining in this particle (<0 is dead) */
    life: number;
    /** The x component of velocity */
    vx: number;
    /** The y component of velocity */
    vy: number;
    /** The x coordinate of this particle's position */
    x: number;
    /** The y coordinate of this particle's position */
    y: number;

    /**
     * Create a new particle that can be added to the rendering engine
     * 
     * @param sprite The sprite to draw for this particle
     * @param life The initial life span of the particle
     * @param x The x coordinate of the initial position of this particle
     * @param y The y coordinate of the initial position of this particle
     * @param vx The x component of the initial velocity of this particle
     * @param vy The y component of the initial velocity of this particle
     */
    constructor(sprite: HTMLImageElement, life: number, x: number, y: number, vx: number, vy: number) {
        this.sprite = sprite;
        this.life = life;
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
    }

    /**
     * Update this particle based on gravity, it's velocity and its life
     * 
     * @returns True if this particle is still alive
     */
    update(): boolean {
        this.life -= 0.01;
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.5;

        return this.life > 0;
    }

    /**
     * Render this particle to the screen
     * 
     * @param g The graphics context on which to render
     */
    render(g: CanvasRenderingContext2D): void {
        g.globalAlpha = Math.min(1, this.life);
        g.drawImage(this.sprite, this.x, this.y);
        g.globalAlpha = 1;
    }
}

/**
 * Add a particle to the engine
 * 
 * @param p The particle to add
 */
export function addParticle(p: Particle): void {
    particles.push(p);
}

/**
 * Render and update the particles in the engine. This applies gravity and fades the particle over time.
 * 
 * @param g The graphics context on which to render
 */
export function renderAndUpdateParticles(g: CanvasRenderingContext2D) {
    for (const p of [...particles]) {
        if (p.update()) {
            p.render(g);
        } else {
            particles.splice(particles.indexOf(p), 1);
        }
    }
}