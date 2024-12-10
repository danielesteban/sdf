<script lang="ts"></script>

<div class="doc">
  <div>
    <h5>Types</h5>
    <ul>
      <li>SDF(float distance, vec3 color, float metalness, float roughness)</li>
    </ul>
  </div>
  <div>
    <h5>Primitives</h5>
    <ul>
      <li>float sdBox(vec3 p, vec3 r)</li>
      <li>float sdRoundedBox(vec3 p, vec3 r, float c)</li>
      <li>float sdCapsule(vec3 p, vec3 r)</li>
      <li>float sdCylinder(vec3 p, float h, float r)</li>
      <li>float sdRoundedCylinder(vec3 p, float ra, float rb, float h)</li>
      <li>float sdEllipsoid(vec3 p, vec3 r) </li>
      <li>float sdOctahedron(vec3 p, float r)</li>
      <li>float sdSphere(vec3 p, float r)</li>
      <li>float sdTorus(vec3 p, vec2 r) </li>
    </ul>
  </div>
  <div>
    <h5>Operations</h5>
    <ul>
      <li>SDF opUnion(SDF a, SDF b)</li>
      <li>SDF opSubtraction(SDF a, SDF b)</li>
      <li>SDF opIntersection(SDF a, SDF b)</li>
      <li>SDF opSmoothUnion(SDF a, SDF b, float k)</li>
      <li>SDF opSmoothSubtraction(SDF a, SDF b, float k)</li>
      <li>SDF opSmoothIntersection(SDF a, SDF b, float k)</li>
    </ul>
  </div>
  <div>
    <h5>Noise</h5>
    <ul>
      <li>float perlin(vec3 p)</li>
      <li>float simplex(vec3 p)</li>
    </ul>
  </div>
  <div>
    <h5>Helpers</h5>
    <ul>
      <li>vec3 hsl(vec3 hsl)</li>
      <li>mat3 rotateX(float angle)</li>
      <li>mat3 rotateY(float angle)</li>
      <li>mat3 rotateZ(float angle)</li>
    </ul>
  </div>
  <div>
    <h5>Uniforms</h5>
    <ul>
      <li>float duration</li>
      <li>float time</li>
    </ul>
  </div>
  <div>
    <h5>Articles</h5>
    <ul>
      <li><a href="https://iquilezles.org/articles/raymarchingdf/" target="_blank" rel="noopener noreferrer">Raymarching Distance Fields</a></li>
      <li><a href="https://iquilezles.org/articles/distfunctions/" target="_blank" rel="noopener noreferrer">Distance functions</a></li>
      <li><a href="https://iquilezles.org/articles/sdfrepetition/" target="_blank" rel="noopener noreferrer">Domain Repetition</a></li>
    </ul>
  </div>
</div>

<style>
  .doc {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    background: #1e1e1e;
    padding: 1rem;
    overflow-y: auto;
  }
  .doc > div > ul {
    padding: 0 1.25rem;
    font-size: 1rem;
    line-height: 1.5rem;
  }
</style>
