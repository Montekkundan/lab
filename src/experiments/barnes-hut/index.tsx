'use client';

import BarnesHutSimulation from './barnes-hut';
import { NavigationLayout } from '@/components/layouts/navigation-layout';
import { FC } from 'react';

interface BarnesHutProps {}

interface BarnesHutComponent extends FC<BarnesHutProps> {
    Layout?: FC<{ children: React.ReactNode; slug: string; title?: string; description?: string; background?: string }>;
    Title?: string;
    Description?: string;
    Tags?: string[];
    background?: 'white' | 'dots' | 'dots_white' | 'none';
}

const FullscreenLayout: FC<{ children: React.ReactNode; slug: string; title?: string; description?: string }> = ({
    children,
    title,
    description,
    slug
}) => {
    return (
        <NavigationLayout title={title} description={description} slug={slug}>
            <div className="fixed inset-0 w-screen h-screen overflow-hidden">
                {children}
            </div>
        </NavigationLayout>
    );
};

const BarnesHut: BarnesHutComponent = () => {
    return <BarnesHutSimulation />;
};

BarnesHut.Layout = FullscreenLayout;
BarnesHut.Title = 'Barnes-Hut N-Body Simulation';
BarnesHut.Description = (
    <>
        <p>
            O(n log n) Barnes–Hut gravitational simulation with quadtree visualization. Press Space to play/pause, R to reset, Q to toggle quadtree, T to toggle trails.
        </p>
        <p>
            <a
                href="https://www.montek.dev/post/simulating-100000-stars-in-real-time-with-the-barnes-hut-algorithm"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:opacity-80"
            >
                Read my blog on it
            </a>
        </p>
    </>
);
BarnesHut.Tags = ['simulation', 'physics', 'canvas', 'algorithm'];
BarnesHut.background = 'none';

export default BarnesHut;
