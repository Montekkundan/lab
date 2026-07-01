precision highp float;
precision highp int;

uniform sampler2D texture;
uniform vec2 delta;
uniform float damping;
uniform vec2 wind;
uniform float depthStrength;
uniform float dispersion;
uniform float noiseStrength;
uniform float nonlinearStrength;
uniform float boundaryLoss;
uniform float time;
varying vec2 coord;

float rand(vec2 value) {
  return fract(sin(dot(value, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  /* get vertex info */
  vec4 info = texture2D(texture, coord);

  /* calculate average neighbor height */
  vec2 dx = vec2(delta.x, 0.0);
  vec2 dy = vec2(0.0, delta.y);
  float average = (
    texture2D(texture, coord - dx).r +
    texture2D(texture, coord - dy).r +
    texture2D(texture, coord + dx).r +
    texture2D(texture, coord + dy).r
  ) * 0.25;
  float diagonalAverage = (
    texture2D(texture, coord - dx - dy).r +
    texture2D(texture, coord - dx + dy).r +
    texture2D(texture, coord + dx - dy).r +
    texture2D(texture, coord + dx + dy).r
  ) * 0.25;
  average = mix(average, diagonalAverage, dispersion);

  float depth = 1.0 + depthStrength * (
    sin(coord.x * 8.0 + coord.y * 3.0) * 0.08 +
    cos(coord.y * 10.0 - coord.x * 4.0) * 0.06
  );

  /* change the velocity to move toward the average */
  info.g += (average - info.r) * 2.0 * depth;

  /* wind advects the height field slightly downwind */
  vec2 windCoord = clamp(coord - wind * delta * 6.0, vec2(0.0), vec2(1.0));
  float windHeight = texture2D(texture, windCoord).r;
  info.r = mix(info.r, windHeight, clamp(length(wind) * 0.035, 0.0, 0.14));

  /* nonlinear crests travel a little differently than troughs */
  info.g += nonlinearStrength * info.r * abs(info.r) * 0.55;

  /* noise is measurement/medium roughness, scaled by existing wave energy */
  float waveEnergy = clamp(abs(info.r) * 45.0 + abs(info.g) * 24.0, 0.0, 1.0);
  info.g += (rand(coord * 512.0 + time) - 0.5) * noiseStrength * 0.0016 * waveEnergy;

  /* attenuate the velocity a little so waves do not last forever */
  info.g *= damping;

  /* absorb or reflect near the pool boundary depending on the experiment mode */
  float edgeDistance = min(min(coord.x, 1.0 - coord.x), min(coord.y, 1.0 - coord.y));
  float edgeFade = smoothstep(0.0, 0.08, edgeDistance);
  info.g *= mix(1.0 - boundaryLoss, 1.0, edgeFade);

  /* move the vertex along the velocity */
  info.r += info.g;

  gl_FragColor = info;
}
