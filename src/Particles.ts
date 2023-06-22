import { TILE_SIZE } from "./Map";
import { getSprite } from "./Resources";

let particles: Particle[] = [];

export function createDirtParticle(x: number, y: number): Particle {
    const sprite = Math.random() > 0.5 ? getSprite("red.particle") : getSprite("orange.particle");
    const vx = (Math.random() - 0.5) * 10;
    const vy = (-Math.random()) * 10;
    x += (Math.random() - 0.5) * (TILE_SIZE / 3);
    y += (Math.random() - 0.5) * (TILE_SIZE / 3);
    const life = 0.5 + (Math.random() * 0.5);
    return new Particle(sprite, life, x, y, vx, vy);
}

export class Particle {
    sprite: HTMLImageElement;
    life: number;
    vx: number;
    vy: number;
    x: number;
    y: number;

    constructor(sprite: HTMLImageElement, life: number, x: number, y: number, vx: number, vy: number) {
        this.sprite = sprite;
        this.life = life;
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
    }

    update(): boolean {
        this.life -= 0.01;
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.5;

        return this.life > 0;
    }

    render(g: CanvasRenderingContext2D): void {
        g.globalAlpha = Math.min(1, this.life);
        g.drawImage(this.sprite, this.x, this.y);
        g.globalAlpha = 1;
    }
}

export function addParticle(p: Particle): void {
    particles.push(p);
}

export function renderAndUpdateParticles(g: CanvasRenderingContext2D) {
    for (const p of [...particles]) {
        if (p.update()) {
            p.render(g);
        } else {
            particles.splice(particles.indexOf(p), 1);
        }
    }
}