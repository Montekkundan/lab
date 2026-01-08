import { Body } from './body';

export class QuadTreeNode {
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
    
    centerX: number;
    centerY: number;
    totalMass: number;
    
    isLeaf: boolean;
    body: Body | null;
    duplicates: Body[] | null;
    children: (QuadTreeNode | null)[];

    constructor(xMin: number, xMax: number, yMin: number, yMax: number) {
        this.xMin = xMin;
        this.xMax = xMax;
        this.yMin = yMin;
        this.yMax = yMax;
        
        this.centerX = 0;
        this.centerY = 0;
        this.totalMass = 0;
        
        this.isLeaf = true;
        this.body = null;
        this.duplicates = null;
        this.children = [null, null, null, null];
    }

    insert(body: Body): void {
        if (this.isLeaf) {
            if (this.body === null) {
                this.body = body;
                this.updateCenterOfMass();
                return;
            }

            if (this.samePosition(this.body, body)) {
                if (!this.duplicates) {
                    this.duplicates = [];
                }
                this.duplicates.push(body);
                this.updateCenterOfMass();
                return;
            }
            
            const oldBody = this.body;
            const oldDuplicates = this.duplicates;
            this.body = null;
            this.duplicates = null;
            this.isLeaf = false;
            this.subdivide();
            
            this.insert(oldBody);
            if (oldDuplicates) {
                for (const dup of oldDuplicates) {
                    this.insert(dup);
                }
            }
            this.insert(body);
        } else {
            const childIndex = this.getChildIndex(body.x, body.y);
            this.children[childIndex]!.insert(body);
            this.updateCenterOfMass();
        }
    }

    subdivide(): void {
        const midX = (this.xMin + this.xMax) / 2;
        const midY = (this.yMin + this.yMax) / 2;
        
        this.children[0] = new QuadTreeNode(this.xMin, midX, midY, this.yMax);
        this.children[1] = new QuadTreeNode(midX, this.xMax, midY, this.yMax);
        this.children[2] = new QuadTreeNode(this.xMin, midX, this.yMin, midY);
        this.children[3] = new QuadTreeNode(midX, this.xMax, this.yMin, midY);
    }

    getChildIndex(x: number, y: number): number {
        const midX = (this.xMin + this.xMax) / 2;
        const midY = (this.yMin + this.yMax) / 2;
        
        if (y >= midY) {
            return x < midX ? 0 : 1;
        } else {
            return x < midX ? 2 : 3;
        }
    }

    updateCenterOfMass(): void {
        if (this.isLeaf) {
            let totalMass = 0;
            let weightedX = 0;
            let weightedY = 0;

            if (this.body) {
                totalMass += this.body.mass;
                weightedX += this.body.x * this.body.mass;
                weightedY += this.body.y * this.body.mass;
            }

            if (this.duplicates) {
                for (const dup of this.duplicates) {
                    totalMass += dup.mass;
                    weightedX += dup.x * dup.mass;
                    weightedY += dup.y * dup.mass;
                }
            }

            this.totalMass = totalMass;
            if (totalMass > 0) {
                this.centerX = weightedX / totalMass;
                this.centerY = weightedY / totalMass;
            }
        } else {
            let totalMass = 0;
            let weightedX = 0;
            let weightedY = 0;
            
            for (const child of this.children) {
                if (child && child.totalMass > 0) {
                    totalMass += child.totalMass;
                    weightedX += child.centerX * child.totalMass;
                    weightedY += child.centerY * child.totalMass;
                }
            }
            
            this.totalMass = totalMass;
            if (totalMass > 0) {
                this.centerX = weightedX / totalMass;
                this.centerY = weightedY / totalMass;
            }
        }
    }

    calculateForce(body: Body, theta: number, G: number, rlimit: number): void {
        if (this.totalMass <= 0) return;
        
        const dx = this.centerX - body.x;
        const dy = this.centerY - body.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (this.isLeaf) {
            if (this.body && this.body !== body) {
                body.addForce(this.body.x, this.body.y, this.body.mass, G, rlimit);
            }
            if (this.duplicates) {
                for (const dup of this.duplicates) {
                    if (dup !== body) {
                        body.addForce(dup.x, dup.y, dup.mass, G, rlimit);
                    }
                }
            }
        } else {
            const size = Math.max(this.xMax - this.xMin, this.yMax - this.yMin);
            
            if (size / dist < theta) {
                body.addForce(this.centerX, this.centerY, this.totalMass, G, rlimit);
            } else {
                for (const child of this.children) {
                    if (child) {
                        child.calculateForce(body, theta, G, rlimit);
                    }
                }
            }
        }
    }

    getSize(): number {
        return Math.max(this.xMax - this.xMin, this.yMax - this.yMin);
    }

    collectNodes(nodes: QuadTreeNode[] = []): QuadTreeNode[] {
        nodes.push(this);
        if (!this.isLeaf) {
            for (const child of this.children) {
                if (child) {
                    child.collectNodes(nodes);
                }
            }
        }
        return nodes;
    }

    getTraversalInfo(body: Body, theta: number): { approximated: QuadTreeNode[], recursed: QuadTreeNode[] } {
        const approximated: QuadTreeNode[] = [];
        const recursed: QuadTreeNode[] = [];
        
        this._collectTraversalInfo(body, theta, approximated, recursed);
        
        return { approximated, recursed };
    }

    private _collectTraversalInfo(
        body: Body, 
        theta: number, 
        approximated: QuadTreeNode[], 
        recursed: QuadTreeNode[]
    ): void {
        if (this.totalMass <= 0) return;
        
        const dx = this.centerX - body.x;
        const dy = this.centerY - body.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (this.isLeaf) {
            // Leaf nodes are always used for direct calculation
            return;
        }
        
        const size = Math.max(this.xMax - this.xMin, this.yMax - this.yMin);
        
        if (size / dist < theta) {
            // MAC satisfied - this node is approximated
            approximated.push(this);
        } else {
            // MAC not satisfied - recurse into children
            recursed.push(this);
            for (const child of this.children) {
                if (child) {
                    child._collectTraversalInfo(body, theta, approximated, recursed);
                }
            }
        }
    }

    private samePosition(a: Body, b: Body): boolean {
        const eps = 1e-12;
        return Math.abs(a.x - b.x) < eps && Math.abs(a.y - b.y) < eps;
    }
}

export class QuadTree {
    root: QuadTreeNode;

    constructor(xMin: number, xMax: number, yMin: number, yMax: number) {
        this.root = new QuadTreeNode(xMin, xMax, yMin, yMax);
    }

    insert(body: Body): void {
        this.root.insert(body);
    }

    calculateForces(bodies: Body[], theta: number, G: number, rlimit: number): void {
        for (const body of bodies) {
            if (body.mass > 0) {
                this.root.calculateForce(body, theta, G, rlimit);
            }
        }
    }

    getAllNodes(): QuadTreeNode[] {
        return this.root.collectNodes();
    }

    getDepth(node: QuadTreeNode = this.root, depth: number = 0): number {
        if (node.isLeaf) return depth;
        
        let maxDepth = depth;
        for (const child of node.children) {
            if (child) {
                const childDepth = this.getDepth(child, depth + 1);
                maxDepth = Math.max(maxDepth, childDepth);
            }
        }
        return maxDepth;
    }
}
