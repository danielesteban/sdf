#define texture2D texture

#include <common>
#include <cube_uv_reflection_fragment>
#include <colorspace_pars_fragment>
#include <lights_physical_pars_fragment>
#include <hsl>
#include <noise>

uniform vec3 backgroundColor;
uniform sampler2D backgroundNoise;
uniform vec3 cameraDirection;
uniform float cameraFar;
uniform float cameraFov;
uniform float cameraNear;
uniform vec3 cameraPosition;
uniform float duration;
uniform sampler2D envMap;
uniform float envMapIntensity;
uniform int frame;
uniform vec2 resolution;
uniform float time;

in vec3 vRay;
in vec2 vUV;

out vec4 outputColor;

#define ZERO (min(frame,0))

struct SDF {
  float distance;
  vec3 color;
  float metalness;
  float roughness;
};

float sdBox(const in vec3 p, const in vec3 r) {
  vec3 q = abs(p)-r;
  return length(max(q,0.0))+min(max(q.x,max(q.y,q.z)),0.0);
}

float sdRoundedBox(const in vec3 p, const in vec3 r, const in float c) {
  vec3 q = abs(p)-r+c;
  return length(max(q,0.0))+min(max(q.x,max(q.y,q.z)),0.0)-c;
}

float sdCapsule(in vec3 p, const in vec3 r) {
  p.y -= clamp(p.y,-r.y+r.x,r.y-r.x);
  return length(p)-r.x;
}

float sdCylinder(const in vec3 p, const in float h, const in float r) {
  vec2 d = abs(vec2(length(p.xz),p.y)) - vec2(r,h);
  return min(max(d.x,d.y),0.0) + length(max(d,0.0));
}

float sdRoundedCylinder(const in vec3 p, const in float ra, const in float rb, const in float h) {
  vec2 d = vec2(length(p.xz)-2.0*ra+rb, abs(p.y) - h);
  return min(max(d.x,d.y),0.0) + length(max(d,0.0)) - rb;
}

float sdEllipsoid(const in vec3 p, const in vec3 r) {
  float k0 = length(p/r);
  float k1 = length(p/(r*r));
  return k0*(k0-1.0)/k1;
}

float sdOctahedron(in vec3 p, const in float r) {
  p = abs(p);
  float m = p.x+p.y+p.z-r;
  vec3 q;
       if (3.0*p.x < m) q = p.xyz;
  else if (3.0*p.y < m) q = p.yzx;
  else if (3.0*p.z < m) q = p.zxy;
  else return m*0.57735027;
  float k = clamp(0.5*(q.z-q.y+r),0.0,r); 
  return length(vec3(q.x,q.y-r+k,q.z-k)); 
}

float sdPyramid(in vec3 p, const in float h) {
  float m2 = h*h + 0.25;
  p.xz = abs(p.xz);
  p.xz = (p.z>p.x) ? p.zx : p.xz;
  p.xz -= 0.5;
  vec3 q = vec3(p.z, h*p.y - 0.5*p.x, h*p.x + 0.5*p.y);
  float s = max(-q.x,0.0);
  float t = clamp( (q.y-0.5*p.z)/(m2+0.25), 0.0, 1.0 );
  float a = m2*(q.x+s)*(q.x+s) + q.y*q.y;
  float b = m2*(q.x+0.5*t)*(q.x+0.5*t) + (q.y-m2*t)*(q.y-m2*t);
  float d2 = min(q.y,-q.x*m2-q.y*0.5) > 0.0 ? 0.0 : min(a,b);
  return sqrt((d2+q.z*q.z)/m2) * sign(max(q.z,-p.y));
}

float sdSphere(const in vec3 p, const in float r) {
  return length(p)-r;
}

float sdTorus(const in vec3 p, const in vec2 r) {
  vec2 q = vec2(length(p.xz)-r.x,p.y);
  return length(q)-r.y;
}

SDF opUnion(const in SDF a, const in SDF b) {
  if (a.distance < b.distance) {
    return a;
  }
  return b;
}

SDF opSubtraction(const in SDF a, const in SDF b) {
  if (a.distance > -b.distance) {
    return a;
  }
  return SDF(-b.distance, b.color, b.metalness, b.roughness);
}

SDF opIntersection(const in SDF a, const in SDF b) {
  if (a.distance > b.distance) {
    return a;
  }
  return b;
}

SDF opSmoothUnion(const in SDF a, const in SDF b, const in float k) {
  float h = saturate(0.5 + 0.5 * (b.distance - a.distance) / k);
  return SDF(
    mix(b.distance, a.distance, h) - k*h*(1.0-h),
    mix(b.color, a.color, h),
    mix(b.metalness, a.metalness, h),
    mix(b.roughness, a.roughness, h)
  );
}

SDF opSmoothSubtraction(const in SDF a, const in SDF b, const in float k) {
  float h = saturate(0.5 - 0.5 * (a.distance + b.distance) / k);
  return SDF(
    mix(a.distance, -b.distance, h) + k*h*(1.0-h),
    mix(a.color, b.color, h),
    mix(a.metalness, b.metalness, h),
    mix(a.roughness, b.roughness, h)
  );
}

SDF opSmoothIntersection(const in SDF a, const in SDF b, const in float k) {
  float h = saturate(0.5 + 0.5 * (b.distance - a.distance) / k);
  return SDF(
    mix(a.distance, b.distance, h) + k*h*(1.0-h),
    mix(a.color, b.color, h),
    mix(a.metalness, b.metalness, h),
    mix(a.roughness, b.roughness, h)
  );
}

mat3 rotateX(const in float angle) {
  float s = sin(angle);
  float c = cos(angle);

  return mat3(
    1.0, 0.0, 0.0,
    0.0, c, s,
    0.0, -s, c
  );
}

mat3 rotateY(const in float angle) {
  float s = sin(angle);
  float c = cos(angle);

  return mat3(
    c, 0.0, -s,
    0.0, 1.0, 0.0,
    s, 0.0, c
  );
}

mat3 rotateZ(const in float angle) {
  float s = sin(angle);
  float c = cos(angle);

  return mat3(
    c, s, 0.0,
    -s, c, 0.0,
    0.0, 0.0, 1.0
  );
}

vec3 getBackground() {
  vec3 granularity = backgroundColor * 0.02;
  return (
    mix(backgroundColor, backgroundColor / 3.0, length(vUV - 0.5) * 1.5)
    + mix(-granularity, granularity, texture(backgroundNoise, vUV * (resolution / vec2(256.0))).r)
  );
}

vec3 getOutput(const in vec4 color, const in float viewZ) {
  return color.rgb * color.a + getBackground() * (1.0 - color.a);
}

SDF map(const in vec3 p);

#ifndef GET_OUTPUT
#define GET_OUTPUT getOutput
#endif
#ifndef MAX_DISTANCE
#define MAX_DISTANCE cameraFar
#endif
#ifndef MAX_ITERATIONS
#define MAX_ITERATIONS 100
#endif
#ifndef MIN_COVERAGE
#define MIN_COVERAGE 0.02
#endif
#ifndef MIN_STEP
#define MIN_STEP 0.01
#endif
#ifndef NORMAL_OFFSET
#define NORMAL_OFFSET 0.001
#endif

vec3 getNormal(const in vec3 p) {
  vec3 n = vec3(0.0);
  for(int i = ZERO; i < 4; i++) {
    vec3 e = 0.5773*(2.0*vec3((((i+3)>>1)&1),((i>>1)&1),(i&1))-1.0);
    n += e*map(p+NORMAL_OFFSET*e).distance;
  }
  return normalize(n);
}

vec3 getIBLRadiance(const in vec3 viewDir, const in vec3 normal, const in float roughness) {
  vec3 reflectVec = reflect(-viewDir, normal);
  reflectVec = normalize(mix(reflectVec, normal, pow4(roughness)));
  vec4 envMapColor = textureCubeUV(envMap, reflectVec, roughness);
  return envMapColor.rgb * envMapIntensity;
}

vec3 getIBLIrradiance(const in vec3 normal) {
  vec3 envMapColor = textureCubeUV(envMap, normal, 1.0).rgb;
  return PI * envMapColor * envMapIntensity;
}

vec3 getLight(const in vec3 position, const in vec3 normal, const in vec3 diffuse, const in float metalness, const in float roughness) {
  PhysicalMaterial material;
  material.diffuseColor = diffuse;
  material.diffuseContribution = diffuse * (1.0 - metalness);
  material.metalness = metalness;
  material.roughness = min(max(roughness, 0.0525), 1.0);
  material.specularColor = vec3(0.04);
  material.specularColorBlended = mix(material.specularColor, diffuse, metalness);
  material.specularF90 = 1.0;

  vec3 clearCoatNormal;
  vec3 clearCoatRadiance;
  vec3 viewDir = normalize(cameraPosition - position);

  vec3 radiance = getIBLRadiance(viewDir, normal, material.roughness);
  vec3 irradiance = getIBLIrradiance(normal);

  ReflectedLight reflectedLight;
  RE_IndirectDiffuse_Physical(irradiance, position, normal, viewDir, clearCoatNormal, material, reflectedLight);
  RE_IndirectSpecular_Physical(radiance, irradiance, clearCoatRadiance, position, normal, viewDir, clearCoatNormal, material, reflectedLight);

  return reflectedLight.indirectDiffuse + reflectedLight.indirectSpecular;
}

void march(inout vec4 color, inout float distance) {
  float closest = MAX_DISTANCE;
  float coverage = 1.0;
  float coneRadius = (2.0 * tan(cameraFov / 2.0)) / resolution.y;
  float t = cameraNear;
  for (int i = 0; i < MAX_ITERATIONS && t < MAX_DISTANCE; i++) {
    float cone = coneRadius * t;
    vec3 position = cameraPosition + vRay * t;
    SDF step = map(position);
    if (step.distance < cone) {
      vec3 pixel = getLight(position, getNormal(position), step.color, step.metalness, step.roughness);
      float alpha = smoothstep(cone, -cone, step.distance);
      color.rgb += coverage * (alpha * pixel);
      coverage *= (1.0 - alpha);
      if (step.distance < closest) {
        closest = step.distance;
        distance = t + step.distance;
      }
      if (coverage <= MIN_COVERAGE) {
        break;
      }
    }
    t += max(abs(step.distance), MIN_STEP);
  }
  color.a = 1.0 - (max(coverage - MIN_COVERAGE, 0.0) / (1.0 - MIN_COVERAGE));
}

void main() {
  vec4 color;
  float distance = MAX_DISTANCE;
  march(color, distance);

  float viewZ = distance * dot(cameraDirection, vRay);
  outputColor = saturate(sRGBTransferOETF(vec4(GET_OUTPUT(color, viewZ), 1.0)));
}
