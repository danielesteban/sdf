uniform float cameraFov;
uniform vec2 resolution;
uniform mat4 viewMatrix;

in vec3 position;
in vec2 uv;

out vec3 vRay;
out vec2 vUV;

void main() {
  gl_Position = vec4(position.xy, 0, 1);
  float aspect = resolution.y / resolution.x;
  float cameraDistance = (1.0 / tan(cameraFov / 2.0)) * aspect;
  vRay = normalize(
    vec3(vec2(position.x, position.y * aspect), -cameraDistance) * mat3(viewMatrix)
  );
  vUV = uv;
}
