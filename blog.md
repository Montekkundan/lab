# Can Ripples Reveal Where a Stone Was Dropped?

Imagine a still pond. At `t=0` there are no ripples. At `t=1`, a stone hits the water. By `t=15`, the stone is gone below the surface, but the pond still carries a record of what happened: circular wavefronts spreading outward from the impact point.

Can we recover where the stone was dropped from that one ripple snapshot?

In the cleanest version of the problem, yes. If the pond is uniform and the stone impact is a point source, the ripple fronts are concentric circles. The common center of those circles is the source. Measuring points on the rings and fitting circles to those points gives the impact point. The algorithm should not be handed the hidden drop location; it should only receive the measured ripple geometry.

That turns the pond question into an inverse problem.

Normal physics asks:

> Given a source, what waves appear?

This question asks:

> Given the waves, where was the source?

The answer depends on what kind of measurement we have.

## One Point Sensor

A single sensor in the pond can tell us that a wave passed through one location at one time. That is not enough to know where the stone fell. Many possible source points could have produced a wave that reached that sensor at that time.

One point gives timing. It does not give direction.

## Several Sensors

Several sensors are better. If each sensor records when the wave arrives, we can use time-of-arrival differences to triangulate the source. This is similar to locating a sound, earthquake, or radio signal from arrival times at multiple receivers.

This works best when the wave speed is known and the pond is close to uniform.

## Full Image Of Ripples

A full image is stronger. If we can see the ripple fronts across the pond, we can detect points on the rings and fit circles or ellipses to them. In an ideal pond, all rings share the same center, so the fitted center gives the drop point.

For a more physics-heavy version, if we know the full wave height field and velocity field at `t=15`, we can run the wave equation backward in time. Under ideal conditions, the waves focus back toward the original impact point. This is called time reversal.

## Why Reality Is Harder

Real ponds are not perfect mathematical surfaces.

Damping makes waves fade. Wind pushes and stretches the pattern. Reflections from edges add extra waves. Uneven depth changes local wave speed. Water ripples are dispersive, so different wavelengths travel at different speeds. Noise corrupts measurements. Strong impacts can create nonlinear waves that do not behave like simple circles.

That means the source is usually an estimate, not a perfect answer. “Precisely” is only true in the ideal mathematical case with a known model and complete, noise-free ripple data.

Still, the core idea survives: ripples are not just patterns. They are records of an event.

## Mini Simulation

A compact simulation can show the whole inverse problem:

1. Pick a hidden stone impact point.
2. Generate circular waves from that source.
3. Add optional effects such as damping, wind, reflections, uneven depth, dispersion, noise, and nonlinear waves.
4. Pause at a measurement time.
5. Detect visible ripple fronts.
6. Fit circles to those measured fronts without reading the hidden source.
7. Show the estimated source next to the true source only after the prediction.

With no distortions, the fitted center lands on the true impact point. As real-world effects are turned on, the estimate drifts. The visual gap between the true source and fitted source is the cost of imperfect physics and imperfect measurement.
