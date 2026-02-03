'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Simulation, type Preset } from './lib/simulation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Kbd } from '@/components/ui/kbd';
import { Play, Pause, RotateCcw, Info, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

const DEFAULT_BODY_COUNT = 100;
const DEFAULT_THETA = 0.5;
const DEFAULT_SPEED = 1.0;
const DEFAULT_PRESET: Preset = 'galaxy';
const PRESETS: Preset[] = ['galaxy', 'binary', 'solar', 'collision', 'cluster', 'random'];

export default function BarnesHutSimulation() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const simulationRef = useRef<Simulation | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const canvasSizeRef = useRef({ width: 0, height: 0, dpr: 1 });
    const lastFpsUpdateRef = useRef(0);
    
    const [isRunning, setIsRunning] = useState(false);
    const [fps, setFps] = useState(0);
    const [bodyCount, setBodyCount] = useState(DEFAULT_BODY_COUNT);
    const [currentPreset, setCurrentPreset] = useState<Preset>(DEFAULT_PRESET);
    const [theta, setTheta] = useState(DEFAULT_THETA);
    const [speedMultiplier, setSpeedMultiplier] = useState(DEFAULT_SPEED);
    const [showHelp, setShowHelp] = useState(false);
    const [showQuadtree, setShowQuadtree] = useState(false);
    const [showTrails, setShowTrails] = useState(true);
    const [showMetrics, setShowMetrics] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [selectedBodyIndex, setSelectedBodyIndex] = useState<number | null>(null);

    const navigatePreset = useCallback((direction: 'prev' | 'next') => {
        const currentIndex = PRESETS.indexOf(currentPreset);
        let newIndex: number;
        if (direction === 'prev') {
            newIndex = currentIndex <= 0 ? PRESETS.length - 1 : currentIndex - 1;
        } else {
            newIndex = currentIndex >= PRESETS.length - 1 ? 0 : currentIndex + 1;
        }
        const newPreset = PRESETS[newIndex];
        setCurrentPreset(newPreset);
        if (simulationRef.current) {
            simulationRef.current.initializePreset(newPreset, bodyCount);
        }
    }, [currentPreset, bodyCount]);

    useEffect(() => {
        simulationRef.current = new Simulation();
        simulationRef.current.initializePreset(DEFAULT_PRESET, DEFAULT_BODY_COUNT);
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, []);

    const render = useCallback(() => {
        const canvas = canvasRef.current;
        const simulation = simulationRef.current;
        if (!canvas || !simulation) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const { width, height, dpr } = canvasSizeRef.current;
        if (width === 0 || height === 0) return;

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, width, height);

        const scaleX = width / (simulation.domainMax - simulation.domainMin);
        const scaleY = height / (simulation.domainMax - simulation.domainMin);

        if (showQuadtree && simulation.quadtree) {
            let approximatedNodes: any[] = [];
            let recursedNodes: any[] = [];
            
            // If a body is selected, get traversal info
            if (selectedBodyIndex !== null && selectedBodyIndex < simulation.bodies.length) {
                const selectedBody = simulation.bodies[selectedBodyIndex];
                const traversal = simulation.quadtree.root.getTraversalInfo(selectedBody, simulation.theta);
                approximatedNodes = traversal.approximated;
                recursedNodes = traversal.recursed;
            }
            
            const nodes = simulation.quadtree.getAllNodes();
            ctx.lineWidth = 1;
            
            for (const node of nodes) {
                const x1 = (node.xMin - simulation.domainMin) * scaleX;
                const y1 = height - (node.yMax - simulation.domainMin) * scaleY;
                const x2 = (node.xMax - simulation.domainMin) * scaleX;
                const y2 = height - (node.yMin - simulation.domainMin) * scaleY;
                
                // Color code based on traversal
                if (approximatedNodes.includes(node)) {
                    ctx.strokeStyle = 'rgba(0, 255, 0, 0.6)'; // Green for approximated
                } else if (recursedNodes.includes(node)) {
                    ctx.strokeStyle = 'rgba(255, 0, 0, 0.4)'; // Red for recursed
                } else {
                    ctx.strokeStyle = 'rgba(100, 100, 255, 0.3)'; // Blue for others
                }
                
                ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
                
                if (!node.isLeaf && node.totalMass > 0) {
                    const cx = (node.centerX - simulation.domainMin) * scaleX;
                    const cy = height - (node.centerY - simulation.domainMin) * scaleY;
                    ctx.fillStyle = 'rgba(255, 100, 100, 0.6)';
                    ctx.beginPath();
                    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }

        if (showTrails) {
            for (const body of simulation.bodies) {
                if (body.lost || body.trail.length < 2) continue;
                
                const massNormalized = Math.min(1, body.mass / 0.2);
                const hue = 200 + massNormalized * 60;
                
                ctx.strokeStyle = `hsla(${hue}, 70%, 60%, 0.4)`;
                ctx.lineWidth = 1.5;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                
                for (let i = 1; i < body.trail.length; i++) {
                    const prev = body.trail[i - 1];
                    const point = body.trail[i];
                    const alpha = (i / body.trail.length) * 0.6;
                    
                    ctx.strokeStyle = `hsla(${hue}, 70%, 60%, ${alpha})`;
                    ctx.beginPath();
                    ctx.moveTo(
                        (prev.x - simulation.domainMin) * scaleX,
                        height - (prev.y - simulation.domainMin) * scaleY
                    );
                    ctx.lineTo(
                        (point.x - simulation.domainMin) * scaleX,
                        height - (point.y - simulation.domainMin) * scaleY
                    );
                    ctx.stroke();
                }
            }
        }

        for (const body of simulation.bodies) {
            if (body.lost) continue;
            
            const bodyIndex = simulation.bodies.indexOf(body);
            const isSelected = bodyIndex === selectedBodyIndex;
            
            const x = (body.x - simulation.domainMin) * scaleX;
            const y = height - (body.y - simulation.domainMin) * scaleY;
            
            const baseRadius = Math.max(2, Math.log(body.mass * 100 + 1) * 2.5);
            
            const massNormalized = Math.min(1, body.mass / 0.2);
            const hue = 200 + massNormalized * 60;
            const saturation = 70 + massNormalized * 20;
            const lightness = 50 + massNormalized * 20;
            
            // Draw selection ring if selected
            if (isSelected) {
                ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(x, y, baseRadius * 2, 0, Math.PI * 2);
                ctx.stroke();
            }
            
            const glowRadius = baseRadius * 3.5;
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, glowRadius);
            gradient.addColorStop(0, `hsla(${hue}, ${saturation}%, ${lightness}%, 0.9)`);
            gradient.addColorStop(0.2, `hsla(${hue}, ${saturation}%, ${lightness - 5}%, 0.6)`);
            gradient.addColorStop(0.5, `hsla(${hue}, ${saturation}%, ${lightness - 15}%, 0.3)`);
            gradient.addColorStop(0.8, `hsla(${hue}, ${saturation}%, ${lightness - 25}%, 0.1)`);
            gradient.addColorStop(1, `hsla(${hue}, ${saturation}%, ${lightness - 30}%, 0)`);
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = `hsl(${hue}, ${saturation + 15}%, ${lightness + 25}%)`;
            ctx.beginPath();
            ctx.arc(x, y, baseRadius, 0, Math.PI * 2);
            ctx.fill();
            
            if (body.mass > 0.05) {
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(x, y, baseRadius * 0.35, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }, [showQuadtree, showTrails]);

    const animate = useCallback(() => {
        const simulation = simulationRef.current;
        if (!simulation || !isRunning) return;

        const startTime = performance.now();
        simulation.step();
        render();
        
        const now = performance.now();
        const frameTime = now - startTime;
        if (now - lastFpsUpdateRef.current > 250) {
            setFps(Math.round(1000 / frameTime));
            lastFpsUpdateRef.current = now;
        }
        
        animationFrameRef.current = requestAnimationFrame(animate);
    }, [isRunning, render]);

    useEffect(() => {
        if (isRunning) {
            animate();
        } else if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [isRunning, animate]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const resizeCanvas = () => {
            const dpr = window.devicePixelRatio || 1;
            const width = window.innerWidth;
            const height = window.innerHeight;
            
            canvasSizeRef.current = { width, height, dpr };
            canvas.width = Math.floor(width * dpr);
            canvas.height = Math.floor(height * dpr);
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            render();
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        return () => window.removeEventListener('resize', resizeCanvas);
    }, [render]);

    useEffect(() => {
        if (simulationRef.current) {
            simulationRef.current.theta = theta;
            simulationRef.current.speedMultiplier = speedMultiplier;
        }
    }, [theta, speedMultiplier]);

    // Trigger render when selectedBodyIndex or showQuadtree changes
    useEffect(() => {
        render();
    }, [selectedBodyIndex, showQuadtree, render]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const handleCanvasClick = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const simulation = simulationRef.current;
            if (!simulation) return;
            
            const { width, height } = canvasSizeRef.current;
            const scaleX = width / (simulation.domainMax - simulation.domainMin);
            const scaleY = height / (simulation.domainMax - simulation.domainMin);
            
            // Convert click position to simulation coordinates
            const simX = (x / scaleX) + simulation.domainMin;
            const simY = simulation.domainMax - (y / scaleY);
            
            // Find closest body within a reasonable distance
            let closestIndex = -1;
            let closestDist = 20 / scaleX; // 20 pixel threshold
            
            simulation.bodies.forEach((body, index) => {
                if (body.lost) return;
                const dx = body.x - simX;
                const dy = body.y - simY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < closestDist) {
                    closestDist = dist;
                    closestIndex = index;
                }
            });
            
            setSelectedBodyIndex(closestIndex >= 0 ? closestIndex : null);
            render();
        };

        canvas.addEventListener('click', handleCanvasClick);
        return () => canvas.removeEventListener('click', handleCanvasClick);
    }, [render]);

    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                e.preventDefault();
                setIsRunning(prev => !prev);
            } else if (e.code === 'KeyR') {
                e.preventDefault();
                handleReset();
            } else if (e.code === 'KeyQ') {
                e.preventDefault();
                setShowQuadtree(prev => !prev);
            } else if (e.code === 'KeyT') {
                e.preventDefault();
                setShowTrails(prev => !prev);
            } else if (e.code === 'KeyC') {
                e.preventDefault();
                setShowControls(prev => !prev);
            } else if (e.code === 'ArrowLeft') {
                e.preventDefault();
                navigatePreset('prev');
            } else if (e.code === 'ArrowRight') {
                e.preventDefault();
                navigatePreset('next');
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [currentPreset, bodyCount, navigatePreset]);

    const handleReset = () => {
        const simulation = simulationRef.current;
        if (!simulation) return;
        
        setIsRunning(false);
        setBodyCount(DEFAULT_BODY_COUNT);
        setTheta(DEFAULT_THETA);
        setSpeedMultiplier(DEFAULT_SPEED);
        setCurrentPreset(DEFAULT_PRESET);
        simulation.initializePreset(DEFAULT_PRESET, DEFAULT_BODY_COUNT);
        render();
    };

    const handlePresetChange = (preset: Preset) => {
        setCurrentPreset(preset);
        const simulation = simulationRef.current;
        if (!simulation) return;
        
        setIsRunning(false);
        simulation.initializePreset(preset, bodyCount);
        render();
    };

    const handleBodyCountChange = (value: number[]) => {
        const count = value[0];
        setBodyCount(count);
        const simulation = simulationRef.current;
        if (!simulation) return;
        
        setIsRunning(false);
        simulation.initializePreset(currentPreset, count);
        render();
    };

    const activeBodies = simulationRef.current?.getActiveBodies() || 0;
    const stepCount = simulationRef.current?.stepCount || 0;
    const treeDepth = simulationRef.current?.quadtree ? simulationRef.current.quadtree.getDepth() : 0;
    const stepMs = simulationRef.current?.lastCalcTime || 0;

    return (
        <div className="relative w-full h-screen bg-background overflow-hidden">
            <canvas
                ref={canvasRef}
                className="absolute inset-0"
            />

            <div className="absolute top-4 left-4 flex gap-2">
                <Badge variant="secondary" className="backdrop-blur-sm">
                    FPS: {fps}
                </Badge>
                <Badge variant="secondary" className="backdrop-blur-sm">
                    Bodies: {activeBodies}
                </Badge>
                <Badge variant="secondary" className="backdrop-blur-sm">
                    Steps: {stepCount}
                </Badge>
                {showMetrics && (
                    <>
                        <Badge variant="secondary" className="backdrop-blur-sm">
                            Depth: {treeDepth}
                        </Badge>
                        <Badge variant="secondary" className="backdrop-blur-sm">
                            Step: {stepMs.toFixed(2)}ms
                        </Badge>
                    </>
                )}
            </div>

            <Button
                variant="outline"
                size="icon"
                className="absolute top-4 right-4 backdrop-blur-sm"
                onClick={() => setShowHelp(!showHelp)}
            >
                <Info className="h-4 w-4" />
            </Button>

            {showHelp && (
                <Card className="absolute top-16 right-4 p-4 backdrop-blur-md text-sm max-w-xs">
                    <h3 className="font-bold mb-2">Keyboard Shortcuts</h3>
                    <ul className="space-y-2">
                        <li className="flex items-center gap-2"><Kbd>Space</Kbd> Play/Pause</li>
                        <li className="flex items-center gap-2"><Kbd>R</Kbd> Reset</li>
                        <li className="flex items-center gap-2"><Kbd>Q</Kbd> Toggle Quadtree</li>
                        <li className="flex items-center gap-2"><Kbd>T</Kbd> Toggle Trails</li>
                        <li className="flex items-center gap-2"><Kbd>C</Kbd> Toggle Controls</li>
                        <li className="flex items-center gap-2"><Kbd>←</Kbd> <Kbd>→</Kbd> Change Preset</li>
                    </ul>
                    <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-600">
                        <p className="font-semibold mb-1">Theta Visualization:</p>
                        <p className="text-xs">Click a body to see how theta affects force calculation</p>
                    </div>
                </Card>
            )}

            {selectedBodyIndex !== null && showQuadtree && (
                <Card className="absolute top-4 left-1/2 -translate-x-1/2 p-4 backdrop-blur-md text-xs max-w-2xl">
                    <h3 className="font-bold mb-3 text-center text-sm">Theta Traversal Visualization (θ = {theta.toFixed(2)})</h3>
                    
                    <div className="mb-3 p-2 bg-background/50 rounded border border-border">
                        <div className="space-y-1 text-xs">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full border-2 border-yellow-500 bg-yellow-500/20" />
                                <span className="font-semibold">Selected body (yellow ring):</span>
                                <span>The body experiencing gravitational forces</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-blue-400" />
                                <span className="font-semibold">White/blue bodies:</span>
                                <span>All other bodies creating gravitational forces on the selected body</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1 mb-3">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-green-500" />
                            <span className="font-semibold">Green boxes (Approximated):</span>
                        </div>
                        <p className="ml-6 text-xs opacity-90">
                            These quadtree nodes are far enough from the selected body that the Barnes-Hut algorithm can approximate all bodies within them as a single mass at their center of mass (red dots). This is the key optimization that makes the algorithm O(n log n) instead of O(n²).
                        </p>
                        
                        <div className="flex items-center gap-2 mt-2">
                            <div className="w-4 h-4 border-2 border-red-500" />
                            <span className="font-semibold">Red boxes (Recursed):</span>
                        </div>
                        <p className="ml-6 text-xs opacity-90">
                            These nodes are too close to the selected body to safely approximate. The algorithm recursively descends into their children to calculate forces more accurately. At the finest level, individual body-to-body forces are computed.
                        </p>
                        
                        <div className="flex items-center gap-2 mt-2">
                            <div className="w-4 h-4 border-2 border-blue-500" />
                            <span className="font-semibold">Blue boxes (Other nodes):</span>
                        </div>
                        <p className="ml-6 text-xs opacity-90">
                            Standard quadtree structure nodes not involved in this specific body's force calculation.
                        </p>
                    </div>

                    <div className="pt-2 border-t border-border">
                        <p className="text-xs opacity-75 leading-relaxed">
                            <span className="font-semibold">The θ parameter controls the trade-off:</span> Lower θ (e.g., 0.3) = stricter MAC criterion = more red boxes (recursion) = higher accuracy but slower. Higher θ (e.g., 1.0) = looser criterion = more green boxes (approximation) = faster but less accurate.
                        </p>
                    </div>
                </Card>
            )}

            {/* Floating preset navigation arrows */}
            <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 backdrop-blur-sm h-10 w-10 rounded-full bg-background/30 hover:bg-background/50"
                onClick={() => navigatePreset('prev')}
            >
                <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 backdrop-blur-sm h-10 w-10 rounded-full bg-background/30 hover:bg-background/50"
                onClick={() => navigatePreset('next')}
            >
                <ChevronRight className="h-5 w-5" />
            </Button>

            {/* Collapse/Expand toggle button */}
            <Button
                variant="outline"
                size="icon"
                className="absolute bottom-6 left-1/2 -translate-x-1/2 backdrop-blur-sm z-10"
                onClick={() => setShowControls(!showControls)}
                style={{ display: showControls ? 'none' : 'flex' }}
            >
                <ChevronUp className="h-4 w-4" />
            </Button>

            <Card className={`absolute bottom-6 left-1/2 -translate-x-1/2 p-6 backdrop-blur-md min-w-[700px] transition-all duration-300 ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full pointer-events-none'}`}>
                {/* Collapse button inside card */}
                <Button
                    variant="ghost"
                    size="sm"
                    className="absolute -top-3 left-1/2 -translate-x-1/2 h-6 px-3 rounded-full"
                    onClick={() => setShowControls(false)}
                >
                    <ChevronDown className="h-3 w-3" />
                </Button>
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setIsRunning(!isRunning)}
                            >
                                {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={handleReset}
                            >
                                <RotateCcw className="h-4 w-4" />
                            </Button>
                        </div>

                    <div className="flex-1">
                        <Select value={currentPreset} onValueChange={(v) => handlePresetChange(v as Preset)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="galaxy">Spiral Galaxy</SelectItem>
                                <SelectItem value="binary">Binary Stars</SelectItem>
                                <SelectItem value="solar">Solar System</SelectItem>
                                <SelectItem value="collision">Galaxy Collision</SelectItem>
                                <SelectItem value="cluster">Star Cluster</SelectItem>
                                <SelectItem value="random">Random</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                        <div className="flex gap-2">
                            <Button
                                variant={showQuadtree ? "default" : "outline"}
                                size="sm"
                                onClick={() => setShowQuadtree(!showQuadtree)}
                            >
                                Quadtree
                            </Button>
                            <Button
                                variant={showTrails ? "default" : "outline"}
                                size="sm"
                                onClick={() => setShowTrails(!showTrails)}
                            >
                                Trails
                            </Button>
                            <Button
                                variant={showMetrics ? "default" : "outline"}
                                size="sm"
                                onClick={() => setShowMetrics(!showMetrics)}
                            >
                                Metrics
                            </Button>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4">
                        <div className="space-y-2 text-sm">
                            <label className="text-xs text-muted-foreground">Bodies: {bodyCount}</label>
                            <Slider
                                value={[bodyCount]}
                                onValueChange={handleBodyCountChange}
                                min={10}
                                max={500}
                                step={10}
                                className="mt-1"
                            />
                        </div>

                        <div className="space-y-2 text-sm">
                            <label className="text-xs text-muted-foreground">Speed: {speedMultiplier.toFixed(1)}x</label>
                            <Slider
                                value={[speedMultiplier]}
                                onValueChange={(v) => setSpeedMultiplier(v[0])}
                                min={0.1}
                                max={3}
                                step={0.1}
                                className="mt-1"
                            />
                        </div>

                        <div className="space-y-2 text-sm">
                            <label className="text-xs text-muted-foreground">Theta: {theta.toFixed(2)}</label>
                            <Slider
                                value={[theta]}
                                onValueChange={(v) => setTheta(v[0])}
                                min={0}
                                max={1}
                                step={0.05}
                                className="mt-1"
                            />
                        </div>
                    </div>

                    <div className="text-xs text-muted-foreground">
                        Tip: 200–400 bodies keeps it smooth on most laptops.
                    </div>
                </div>
            </Card>

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                {!isRunning && simulationRef.current?.stepCount === 0 && (
                    <h1 className="text-4xl font-bold text-muted-foreground/30 text-center">
                        Barnes-Hut N-Body Simulation
                    </h1>
                )}
            </div>
        </div>
    );
}
