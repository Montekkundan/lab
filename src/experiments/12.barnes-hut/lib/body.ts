interface Position {
    x: number;
    y: number;
}

export class Body {
    index: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    mass: number;
    fx: number;
    fy: number;
    trail: Position[];
    maxTrailLength: number;
    lost: boolean;

    constructor(index: number, x: number, y: number, vx: number, vy: number, mass: number) {
        this.index = index;
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.mass = mass;
        this.fx = 0;
        this.fy = 0;
        this.trail = [];
        this.maxTrailLength = 80;
        this.lost = false;
    }

    resetForce(): void {
        this.fx = 0;
        this.fy = 0;
    }

    addForce(otherX: number, otherY: number, otherMass: number, G: number, rlimit: number): void {
        const dx = otherX - this.x;
        const dy = otherY - this.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < rlimit) dist = rlimit;
        
        const force = (G * this.mass * otherMass) / (dist * dist);
        this.fx += force * (dx / dist);
        this.fy += force * (dy / dist);
    }

    update(dt: number, domainMin: number, domainMax: number): void {
        const ax = this.fx / this.mass;
        const ay = this.fy / this.mass;
        
        this.x += this.vx * dt + 0.5 * ax * dt * dt;
        this.y += this.vy * dt + 0.5 * ay * dt * dt;
        
        this.vx += ax * dt;
        this.vy += ay * dt;
        
        if (this.trail.length > 0) {
            const lastPos = this.trail[this.trail.length - 1];
            const dx = this.x - lastPos.x;
            const dy = this.y - lastPos.y;
            if (dx * dx + dy * dy > 0.0005) {
                this.trail.push({ x: this.x, y: this.y });
                if (this.trail.length > this.maxTrailLength) {
                    this.trail.shift();
                }
            }
        } else {
            this.trail.push({ x: this.x, y: this.y });
        }
        
        if (this.x < domainMin || this.x > domainMax || 
            this.y < domainMin || this.y > domainMax) {
            this.lost = true;
            this.mass = -1;
        }
    }

    getSpeed(): number {
        return Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    }

    getKineticEnergy(): number {
        return 0.5 * this.mass * (this.vx * this.vx + this.vy * this.vy);
    }
}
