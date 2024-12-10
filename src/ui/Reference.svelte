<script lang="ts">
  import Function from 'ui/components/Function.svelte';
</script>

<div class="reference">
  <div>
    <h5>Types</h5>
    <ul>
      <li><Function type="SDF" params={[['float', 'distance'], ['vec3', 'color'], ['float', 'metalness'], ['float', 'roughness']]} /></li>
    </ul>
  </div>
  <div>
    <h5>Primitives</h5>
    <ul>
      <li><Function type="float" name="sdBox" params={[['vec3', 'p'], ['vec3', 'r']]} /></li>
      <li><Function type="float" name="sdRoundedBox" params={[['vec3', 'p'], ['vec3', 'r'], ['float', 'c']]} /></li>
      <li><Function type="float" name="sdCapsule" params={[['vec3', 'p'], ['vec3', 'r']]} /></li>
      <li><Function type="float" name="sdCylinder" params={[['vec3', 'p'], ['float', 'h'], ['float', 'r']]} /></li>
      <li><Function type="float" name="sdRoundedCylinder" params={[['vec3', 'p'], ['float', 'ra'], ['float', 'rb'], ['float', 'h']]} /></li>
      <li><Function type="float" name="sdEllipsoid" params={[['vec3', 'p'], ['vec3', 'r']]} /></li>
      <li><Function type="float" name="sdOctahedron" params={[['vec3', 'p'], ['float', 'r']]} /></li>
      <li><Function type="float" name="sdPyramid" params={[['vec3', 'p'], ['float', 'h']]} /></li>
      <li><Function type="float" name="sdSphere" params={[['vec3', 'p'], ['float', 'r']]} /></li>
      <li><Function type="float" name="sdTorus" params={[['vec3', 'p'], ['vec2', 'r']]} /></li>
    </ul>
  </div>
  <div>
    <h5>Operations</h5>
    <ul>
      <li><Function type="SDF" name="opUnion" params={[['SDF', 'a'], ['SDF', 'b']]} /></li>
      <li><Function type="SDF" name="opSubtraction" params={[['SDF', 'a'], ['SDF', 'b']]} /></li>
      <li><Function type="SDF" name="opIntersection" params={[['SDF', 'a'], ['SDF', 'b']]} /></li>
      <li><Function type="SDF" name="opSmoothUnion" params={[['SDF', 'a'], ['SDF', 'b'], ['float', 'k']]} /></li>
      <li><Function type="SDF" name="opSmoothSubtraction" params={[['SDF', 'a'], ['SDF', 'b'], ['float', 'k']]} /></li>
      <li><Function type="SDF" name="opSmoothIntersection" params={[['SDF', 'a'], ['SDF', 'b'], ['float', 'k']]} /></li>
    </ul>
  </div>
  <div>
    <h5>Noise</h5>
    <ul>
      <li><Function type="float" name="perlin" params={[['vec3', 'p']]} /></li>
      <li><Function type="float" name="simplex" params={[['vec3', 'p']]} /></li>
    </ul>
  </div>
  <div>
    <h5>Helpers</h5>
    <ul>
      <li><Function type="vec3" name="hsl" params={[['vec3', 'hsl']]} /></li>
      <li><Function type="mat3" name="rotateX" params={[['float', 'angle']]} /></li>
      <li><Function type="mat3" name="rotateY" params={[['float', 'angle']]} /></li>
      <li><Function type="mat3" name="rotateZ" params={[['float', 'angle']]} /></li>
    </ul>
  </div>
  <div>
    <h5>Uniforms</h5>
    <ul>
      <li><span class="type">float</span> duration</li>
      <li><span class="type">float</span> time</li>
    </ul>
  </div>
  <div>
    <h5>Defines</h5>
    <p>
      You can override this defaults by defining them at the top of the GPU code
    </p>
    <ul>
      <li><span class="type">#define</span> MAX_DISTANCE <span class="default">cameraFar</span></li>
      <li><span class="type">#define</span> MAX_ITERATIONS <span class="default">100</span></li>
      <li><span class="type">#define</span> MIN_COVERAGE <span class="default">0.02</span></li>
      <li><span class="type">#define</span> MIN_STEP <span class="default">0.01</span></li>
      <li><span class="type">#define</span> NORMAL_OFFSET <span class="default">0.001</span></li>
    </ul>
  </div>
  <div>
    <h5>CPU Globals</h5>
    <ul>
      <li><span class="type">PerspectiveCamera</span> camera</li>
      <li><span class="type">float</span> duration</li>
      <li><span class="type">Spherical</span> spherical</li>
      <li><span class="type">float</span> time</li>
    </ul>
  </div>
  <div>
    <h5>Articles</h5>
    <ul>
      <li><a href="https://iquilezles.org/articles/raymarchingdf/" target="_blank" rel="noopener noreferrer">Raymarching Distance Fields</a></li>
      <li><a href="https://iquilezles.org/articles/distfunctions/" target="_blank" rel="noopener noreferrer">Distance Functions</a></li>
      <li><a href="https://iquilezles.org/articles/sdfrepetition/" target="_blank" rel="noopener noreferrer">Domain Repetition</a></li>
    </ul>
  </div>
</div>

<style>
  .reference {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    background: #1e1e1e;
    padding: 1rem;
    overflow-y: auto;
  }
  .reference > div > ul {
    padding: 0 1.25rem;
    font-size: 1rem;
    line-height: 1.5rem;
    cursor: auto;
    user-select: text;
  }
  .default {
    color: #999;
  }
  .type {
    color: #569cd6;
  }
</style>
