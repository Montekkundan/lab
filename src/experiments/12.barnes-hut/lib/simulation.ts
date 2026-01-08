import { Body } from './body';
import { QuadTree } from './quadtree';

export type Preset = 'galaxy' | 'binary' | 'solar' | 'collision' | 'cluster' | 'random';

export interface EnergyInfo {
    kinetic: number;
    potential: number;
    total: number;
}

export class Simulation {
    G: number = 0.0001;
    rlimit: number = 0.03;
    dt: number = 0.005;
    theta: number = 0.5;
    
    domainMin: number = 0.0;
    domainMax: number = 4.0;
    
    bodies: Body[] = [];
    quadtree: QuadTree | null = null;
    stepCount: number = 0;
    isRunning: boolean = false;
    speedMultiplier: number = 1.0;
    
    lastCalcTime: number = 0;

    constructor() {}

    initializeRandom(numBodies: number): void {
        this.bodies = [];
        this.stepCount = 0;
        this.quadtree = null;
        
        const numClusters = 3 + Math.floor(Math.random() * 3);
        const bodiesPerCluster = Math.floor(numBodies / numClusters);
        
        for (let cluster = 0; cluster < numClusters; cluster++) {
            const clusterX = 0.5 + Math.random() * 3.0;
            const clusterY = 0.5 + Math.random() * 3.0;
            const clusterVx = (Math.random() - 0.5) * 0.05;
            const clusterVy = (Math.random() - 0.5) * 0.05;
            
            for (let i = 0; i < bodiesPerCluster; i++) {
                const bodyIndex = cluster * bodiesPerCluster + i;
                const radius = Math.abs(this.gaussianRandom() * 0.3);
                const angle = Math.random() * Math.PI * 2;
                
                const x = clusterX + Math.cos(angle) * radius;
                const y = clusterY + Math.sin(angle) * radius;
                const mass = 0.01 + Math.random() * 0.02;
                const vx = clusterVx + (Math.random() - 0.5) * 0.02;
                const vy = clusterVy + (Math.random() - 0.5) * 0.02;
                
                this.bodies.push(new Body(bodyIndex, x, y, vx, vy, mass));
            }
        }
        
        for (let i = numClusters * bodiesPerCluster; i < numBodies; i++) {
            const x = Math.random() * (this.domainMax - this.domainMin) + this.domainMin;
            const y = Math.random() * (this.domainMax - this.domainMin) + this.domainMin;
            const mass = 0.01 + Math.random() * 0.02;
            const vx = (Math.random() - 0.5) * 0.05;
            const vy = (Math.random() - 0.5) * 0.05;
            
            this.bodies.push(new Body(i, x, y, vx, vy, mass));
        }
    }

    initializePreset(preset: Preset, numBodies: number = 100): void {
        this.bodies = [];
        this.stepCount = 0;
        this.quadtree = null;
        
        switch(preset) {
            case 'galaxy':
                this.createSpiralGalaxy(numBodies);
                break;
            case 'binary':
                this.createBinaryStars();
                break;
            case 'solar':
                this.createSolarSystem();
                break;
            case 'collision':
                this.createGalaxyCollision(numBodies);
                break;
            case 'cluster':
                this.createStarCluster(numBodies);
                break;
            default:
                this.initializeRandom(numBodies);
        }
    }

    private createSpiralGalaxy(numBodies: number): void {
        const centerX = (this.domainMax + this.domainMin) / 2;
        const centerY = (this.domainMax + this.domainMin) / 2;
        
        this.bodies.push(new Body(0, centerX, centerY, 0, 0, 0.5));
        
        for (let i = 1; i < numBodies; i++) {
            const angle = (i / numBodies) * Math.PI * 4 + Math.random() * 0.5;
            const radius = (i / numBodies) * 1.5 + Math.random() * 0.2;
            
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            
            const speed = 0.3 / Math.sqrt(radius + 0.1);
            const vx = -Math.sin(angle) * speed;
            const vy = Math.cos(angle) * speed;
            
            const mass = 0.005 + Math.random() * 0.01;
            this.bodies.push(new Body(i, x, y, vx, vy, mass));
        }
    }

    private createBinaryStars(): void {
        const centerX = (this.domainMax + this.domainMin) / 2;
        const centerY = (this.domainMax + this.domainMin) / 2;
        const separation = 0.8;
        
        this.bodies.push(new Body(0, centerX - separation/2, centerY, 0, 0.15, 0.1));
        this.bodies.push(new Body(1, centerX + separation/2, centerY, 0, -0.15, 0.1));
        
        for (let i = 2; i < 100; i++) {
            const angle = (i / 100) * Math.PI * 2;
            const radius = 1.2 + Math.random() * 0.5;
            
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            
            const speed = 0.25 / Math.sqrt(radius);
            const vx = -Math.sin(angle) * speed;
            const vy = Math.cos(angle) * speed;
            
            const mass = 0.002 + Math.random() * 0.005;
            this.bodies.push(new Body(i, x, y, vx, vy, mass));
        }
    }

    private createSolarSystem(): void {
        const centerX = (this.domainMax + this.domainMin) / 2;
        const centerY = (this.domainMax + this.domainMin) / 2;
        
        this.bodies.push(new Body(0, centerX, centerY, 0, 0, 0.3));
        
        const planetDistances = [0.4, 0.6, 0.9, 1.2, 1.5];
        let bodyIndex = 1;
        
        for (const distance of planetDistances) {
            const angle = Math.random() * Math.PI * 2;
            const x = centerX + Math.cos(angle) * distance;
            const y = centerY + Math.sin(angle) * distance;
            
            const speed = 0.4 / Math.sqrt(distance);
            const vx = -Math.sin(angle) * speed;
            const vy = Math.cos(angle) * speed;
            
            const mass = 0.008 + Math.random() * 0.012;
            this.bodies.push(new Body(bodyIndex++, x, y, vx, vy, mass));
        }
    }

    private createGalaxyCollision(numBodies: number): void {
        const bodiesPerGalaxy = Math.floor(numBodies / 2);
        
        const center1X = 1.2;
        const center1Y = 2.0;
        for (let i = 0; i < bodiesPerGalaxy; i++) {
            const angle = (i / bodiesPerGalaxy) * Math.PI * 4;
            const radius = (i / bodiesPerGalaxy) * 0.6;
            
            const x = center1X + Math.cos(angle) * radius;
            const y = center1Y + Math.sin(angle) * radius;
            
            const speed = 0.2 / Math.sqrt(radius + 0.1);
            const vx = 0.05 - Math.sin(angle) * speed;
            const vy = Math.cos(angle) * speed;
            
            const mass = 0.005 + Math.random() * 0.01;
            this.bodies.push(new Body(i, x, y, vx, vy, mass));
        }
        
        const center2X = 2.8;
        const center2Y = 2.0;
        for (let i = 0; i < bodiesPerGalaxy; i++) {
            const angle = (i / bodiesPerGalaxy) * Math.PI * 4;
            const radius = (i / bodiesPerGalaxy) * 0.6;
            
            const x = center2X + Math.cos(angle) * radius;
            const y = center2Y + Math.sin(angle) * radius;
            
            const speed = 0.2 / Math.sqrt(radius + 0.1);
            const vx = -0.05 - Math.sin(angle) * speed;
            const vy = Math.cos(angle) * speed;
            
            const mass = 0.005 + Math.random() * 0.01;
            this.bodies.push(new Body(bodiesPerGalaxy + i, x, y, vx, vy, mass));
        }
    }

    private createStarCluster(numBodies: number): void {
        const centerX = (this.domainMax + this.domainMin) / 2;
        const centerY = (this.domainMax + this.domainMin) / 2;
        
        for (let i = 0; i < numBodies; i++) {
            const radius = Math.abs(this.gaussianRandom() * 0.4);
            const angle = Math.random() * Math.PI * 2;
            
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            
            const vx = (Math.random() - 0.5) * 0.03;
            const vy = (Math.random() - 0.5) * 0.03;
            
            const mass = 0.01 + Math.random() * 0.02;
            this.bodies.push(new Body(i, x, y, vx, vy, mass));
        }
    }

    private gaussianRandom(): number {
        const u1 = Math.random();
        const u2 = Math.random();
        return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    }

    addBody(x: number, y: number, vx: number, vy: number, mass: number = 0.02): void {
        const index = this.bodies.length;
        this.bodies.push(new Body(index, x, y, vx, vy, mass));
    }

    step(): void {
        const startTime = performance.now();
        
        this.quadtree = new QuadTree(this.domainMin, this.domainMax, this.domainMin, this.domainMax);
        for (const body of this.bodies) {
            if (!body.lost) {
                this.quadtree.insert(body);
            }
        }
        
        for (const body of this.bodies) {
            if (!body.lost) {
                body.resetForce();
            }
        }
        
        this.quadtree.calculateForces(this.bodies, this.theta, this.G, this.rlimit);
        
        for (const body of this.bodies) {
            if (!body.lost) {
                body.update(this.dt * this.speedMultiplier, this.domainMin, this.domainMax);
            }
        }
        
        this.stepCount++;
        this.lastCalcTime = performance.now() - startTime;
    }

    getActiveBodies(): number {
        return this.bodies.filter(b => !b.lost).length;
    }

    getTotalEnergy(): EnergyInfo {
        let kineticEnergy = 0;
        let potentialEnergy = 0;
        
        for (const body of this.bodies) {
            if (!body.lost) {
                kineticEnergy += body.getKineticEnergy();
            }
        }
        
        for (let i = 0; i < this.bodies.length; i++) {
            if (this.bodies[i].lost) continue;
            for (let j = i + 1; j < this.bodies.length; j++) {
                if (this.bodies[j].lost) continue;
                
                const dx = this.bodies[j].x - this.bodies[i].x;
                const dy = this.bodies[j].y - this.bodies[i].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist > this.rlimit) {
                    potentialEnergy -= (this.G * this.bodies[i].mass * this.bodies[j].mass) / dist;
                }
            }
        }
        
        return {
            kinetic: kineticEnergy,
            potential: potentialEnergy,
            total: kineticEnergy + potentialEnergy
        };
    }
}
