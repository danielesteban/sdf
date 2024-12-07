#define texture2D texture

#include <common>
#include <cube_uv_reflection_fragment>
#include <colorspace_pars_fragment>
#include <lights_physical_pars_fragment>

uniform vec3 cameraDirection;
uniform float cameraFar;
uniform float cameraFov;
uniform float cameraNear;
uniform vec3 cameraPosition;
uniform sampler2D envMap;
uniform float envMapIntensity;
uniform vec2 resolution;
uniform float time;

in vec3 ray;

out vec4 outputColor;

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

float sdEllipsoid(const in vec3 p, const in vec3 r) {
  float k0 = length(p/r);
  float k1 = length(p/(r*r));
  return k0*(k0-1.0)/k1;
}

float sdSphere(const in vec3 p, const in float r) {
  return length(p)-r;
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

mat3 rotateX(float angle) {
  float s = sin(angle);
  float c = cos(angle);

  return mat3(
    1.0, 0.0, 0.0,
    0.0, c, s,
    0.0, -s, c
  );
}

mat3 rotateY(float angle) {
  float s = sin(angle);
  float c = cos(angle);

  return mat3(
    c, 0.0, -s,
    0.0, 1.0, 0.0,
    s, 0.0, c
  );
}

mat3 rotateZ(float angle) {
  float s = sin(angle);
  float c = cos(angle);

  return mat3(
    c, s, 0.0,
    -s, c, 0.0,
    0.0, 0.0, 1.0
  );
}

SDF map(const in vec3 p);

vec3 getNormal(const in vec3 p, const in float d) {
  const vec2 o = vec2(NORMAL_OFFSET, 0);
  return normalize(
    d - vec3(
      map(p - o.xyy).distance,
      map(p - o.yxy).distance,
      map(p - o.yyx).distance
    )
  );
}

vec3 getIBLRadiance(const in vec3 viewDir, const in vec3 normal, const in float roughness) {
  vec3 reflectVec = reflect(-viewDir, normal);
  reflectVec = normalize(mix(reflectVec, normal, roughness * roughness));
  vec4 envMapColor = textureCubeUV(envMap, reflectVec, roughness);
  return envMapColor.rgb * envMapIntensity;
}

vec3 getIBLIrradiance(const in vec3 normal) {
  vec3 envMapColor = textureCubeUV(envMap, normal, 1.0).rgb;
  return PI * envMapColor * envMapIntensity;
}

vec3 getLight(const in vec3 position, const in vec3 normal, const in vec3 diffuse, const in float metalness, const in float roughness) {
  PhysicalMaterial material;
  material.diffuseColor = diffuse * (1.0 - metalness);
  material.roughness = max(min(roughness, 1.0), 0.0525);
  material.specularColor = mix(vec3(0.04), diffuse, metalness);
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
  for (int i = 0; i < MAX_ITERATIONS && distance < MAX_DISTANCE; i++) {
    vec3 position = cameraPosition + ray * distance;
    SDF step = map(position);
    float cone = coneRadius * distance;
    if (step.distance < cone) {
      if (closest > distance) {
        closest = distance;
      }
      float alpha = smoothstep(cone, -cone, step.distance);
      vec3 pixel = getLight(position, getNormal(position, step.distance), step.color, step.metalness, step.roughness);
      color.rgb += coverage * (alpha * pixel);
      coverage *= (1.0 - alpha);
      if (coverage <= MIN_COVERAGE) {
        break;
      }
    }
    distance += max(abs(step.distance), MIN_DISTANCE);
  }
  distance = closest;
  color.a = 1.0 - (max(coverage - MIN_COVERAGE, 0.0) / (1.0 - MIN_COVERAGE));
}

void main() {
  vec4 color;
  float distance = cameraNear;
  march(color, distance);

  outputColor = saturate(sRGBTransferOETF(color));
  float z = (distance >= MAX_DISTANCE) ? cameraFar : (distance * dot(cameraDirection, ray));
  float ndcDepth = -((cameraFar + cameraNear) / (cameraNear - cameraFar)) + ((2.0 * cameraFar * cameraNear) / (cameraNear - cameraFar)) / z;
  gl_FragDepth = ((gl_DepthRange.diff * ndcDepth) + gl_DepthRange.near + gl_DepthRange.far) / 2.0;

  #ifdef fog
    float fogFactor = 1.0 - exp(-fogDensity * fogDensity * z * z);
    outputColor = mix(outputColor, vec4(fogColor, 1.0), fogFactor);
  #endif
}
