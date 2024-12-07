<script module lang="ts">
  import 'monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution.js';
  import 'monaco-editor/esm/vs/editor/contrib/find/browser/findController.js';
  import 'monaco-editor/esm/vs/editor/contrib/hover/browser/hoverContribution.js';
  import * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js';
  import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';

  monaco.languages.register({ id: 'glsl' });
  monaco.languages.setLanguageConfiguration('glsl', {
    wordPattern: /(-?\d*\.\d\w*)|([^\`\~\!\#\$\%\^\&\*\(\)\-\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\?\s]+)/g,
    comments: {
      lineComment: '//',
      blockComment: ['/*', '*/'],
    },
    brackets: [
      ['{', '}'],
      ['[', ']'],
      ['(', ')'],
    ],
    autoClosingPairs: [
      { open: '[', close: ']' },
      { open: '{', close: '}' },
      { open: '(', close: ')' },
      { open: "'", close: "'", notIn: ['string', 'comment'] },
      { open: '"', close: '"', notIn: ['string'] },
    ],
  });
  monaco.languages.setMonarchTokensProvider('glsl', {
    defaultToken: '',
    tokenPostfix: '.glsl',
    types: [ 'bool', 'bvec2', 'bvec3', 'bvec4', 'float', 'int', 'ivec2', 'ivec3', 'ivec4', 'mat2', 'mat2x2', 'mat2x3', 'mat2x4', 'mat3', 'mat3x2', 'mat3x3', 'mat3x4', 'mat4', 'mat4x2', 'mat4x3', 'mat4x4', 'uint', 'uvec2', 'uvec3', 'uvec4', 'vec2', 'vec3', 'vec4', 'void' ],
    keywords: [ 'attribute', 'break', 'case', 'centroid', 'const', 'continue', 'default', 'discard', 'do', 'else', 'false', 'flat', 'for', 'highp', 'if', 'in', 'inout', 'invariant', 'isampler2D', 'isampler2DArray', 'isampler3D', 'isamplerCube', 'layout', 'lowp', 'mediump', 'out', 'precision', 'return', 'sampler2D', 'sampler2DArray', 'sampler2DArrayShadow', 'sampler2DShadow', 'sampler3D', 'samplerCube', 'samplerCubeShadow', 'smooth', 'struct', 'switch', 'true', 'uniform', 'usampler2D', 'usampler2DArray', 'usampler3D', 'usamplerCube', 'varying', 'while' ],
    functions: [ 'radians', 'degrees', 'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'sinh', 'cosh', 'tanh', 'asinh', 'acosh', 'atanh', 'pow', 'exp', 'log', 'exp2', 'log2', 'sqrt', 'inversesqrt', 'abs', 'sign', 'floor', 'trunc', 'round', 'roundEven', 'ceil', 'fract', 'mod', 'modf', 'min', 'max', 'clamp', 'mix', 'step', 'smoothstep', 'isnan', 'isinf', 'floatBitsToInt', 'floatBitsToUint', 'intBitsToFloat', 'uintBitsToFloat', 'packSnorm2x16', 'unpackSnorm2x16', 'packUnorm2x16', 'unpackUnorm2x16', 'packHalf2x16', 'unpackHalf2x16', 'length', 'distance', 'dot', 'cross', 'normalize', 'faceforward', 'reflect', 'refract', 'matrixCompMult', 'outerProduct', 'transpose', 'determinant', 'inverse', 'lessThan', 'lessThanEqual', 'greaterThan', 'greaterThanEqual', 'equal', 'notEqual', 'any', 'all', 'not', 'textureSize', 'texture', 'texture2D', 'textureCube', 'texture2DProj', 'texture2DLodEXT', 'texture2DProjLodEXT', 'textureCubeLodEXT', 'texture2DGradEXT', 'texture2DProjGradEXT', 'textureCubeGradEXT', 'textureProj', 'textureLod', 'textureOffset', 'texelFetch', 'texelFetchOffset', 'textureProjOffset', 'textureLodOffset', 'textureProjLod', 'textureProjLodOffset', 'textureGrad', 'textureGradOffset', 'textureProjGrad', 'textureProjGradOffset', 'dFdx', 'dFdy', 'fwidth' ],
    operators: [ '++', '--', '+', '-', '~', '!', '*', '/', '%', '<<', '>>', '<', '>', '<=', '>=', '==', '!=', '&', '^', '|', '&&', '^^', '||', '?', ':', '=', '+=', '-=', '*=', '/=', '%=', '<<=', '>>=', '&=', '^=', '|=', ',' ],
    brackets: [
      { token: 'delimiter.curly', open: '{', close: '}' },
      { token: 'delimiter.parenthesis', open: '(', close: ')' },
      { token: 'delimiter.square', open: '[', close: ']' },
      { token: 'delimiter.angle', open: '<', close: '>' },
    ],
    symbols: /[=><!~?:&|+\-*\/\^%]+/,
    integersuffix: /[uU]?/,
    floatsuffix: /[fF]?/,
    func: /[a-zA-Z_0-9]+/,
    tokenizer: {
      root: [
        [/\d*\d+[eE]([\-+]?\d+)?(@floatsuffix)/, 'number.float'],
        [/\d*\.\d+([eE][\-+]?\d+)?(@floatsuffix)/, 'number.float'],
        [/0[xX][0-9a-fA-F']*[0-9a-fA-F](@integersuffix)/, 'number.hex'],
        [/([+-]?)\d+(@integersuffix)/, 'number.integer'],
        [/#(version|define|undef|ifdef|ifndef|else|elsif|endif)/, 'keyword.directive'],
        [/\$[a-zA-Z0-9]*/, 'regexp'],
        [/\s[A-Z_][A-Z_0-9]*/, 'constant'],
        [/gl_[a-zA-Z_0-9]+/, 'keyword.gl'],
        [
          /([a-zA-Z_][a-zA-Z_0-9]*)/,
          {
            cases: {
              '@types': { token: 'keyword.$0' },
              '@keywords': { token: 'keyword.$0' },
              '@functions': { token: 'keyword.builtins.$0' },
              '@default': 'identifier'
            }
          }
        ],
        [/(\d+(\.\d+))/, 'number.float'],
        [/\d+/, 'keyword'],
        [/\/\/.+/, 'comment'],
        [/\/\*.+?(\*\/)/, 'comment'],
        [/[{}()\[\]]/, '@brackets'],
        [
          /@symbols/,
          {
            cases: {
              '@operators': 'delimiter',
              '@default': ''
            }
          }
        ],
        [/[;,.]/, 'delimiter'],
      ],
    },
  });

  self.MonacoEnvironment = {
    getWorker() {
      return new editorWorker();
    },
  };
</script>

<script lang="ts">
  import { untrack } from 'svelte';
  import {
    GPUCode,
    GPUErrors,
    backgroundColor,
    isRenderingVideo,
    videoRenderingController,
    viewportSize,
  } from './State.svelte';

  let { width }: { width: number } = $props();

  const recompile = () => {
    GPUCode.value = editor.getValue();
  };

  const renderVideo = () => {
    if (isRenderingVideo.value) {
      videoRenderingController.value?.abort();
    } else {
      isRenderingVideo.value = true;
    }
  };

  const setSize = (width: number, height: number) => () => {
    viewportSize.value = { width, height };
  };

  let editor: monaco.editor.IStandaloneCodeEditor;
  let editorElement: HTMLDivElement;
  const resizeEditor = () => editor.layout();
  $effect(() => {
    editor = monaco.editor.create(editorElement, {
      minimap: { enabled: false },
      theme: 'vs-dark',
      value: untrack(() => GPUCode.value),
      language: 'glsl',
    });
    window.addEventListener('resize', resizeEditor);
    return () => {
      window.addEventListener('resize', resizeEditor);
    };
  });

  $effect(() => {
    width;
    resizeEditor();
  });

  $effect(() => {
    const lines = editor.getValue().split('\n');
    const lastLine = lines.length;
    monaco.editor.setModelMarkers(
      editor.getModel()!,
      'Errors',
      GPUErrors.value.map(({ line = lastLine, start = 0, end = 0, message }) => ({
        message,
        startLineNumber: line,
        endLineNumber: line,
        startColumn: start,
        endColumn: end,
        severity: monaco.MarkerSeverity.Error,
      }))
    );
  });

  const onkeydown = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      recompile();
    }
    if (e.altKey && e.key === 'Enter') {
      recompile();
    }
  };

  let colorInput: HTMLInputElement;
  const toggleColorInput = () => (
    colorInput.click()
  );
</script>

<svelte:window onkeydown={onkeydown} />

<div class="editor" style="width: {width}px">
  <div class="tabs">
    <button class="active">
      GPU
    </button>
  </div>
  <div class="editorElement" bind:this={editorElement}></div>
  <div class="tools">
    <div>
      <button onclick={recompile}>
        Recompile
      </button>
    </div>
    <div>
      <button
        aria-label="background"
        class="color"
        onclick={toggleColorInput}
        style="background: {backgroundColor.value}"
      >
        <input type="color" bind:this={colorInput} bind:value={backgroundColor.value} />
      </button>
      <button
        class:active={viewportSize.value.width === 1080 && viewportSize.value.height === 1080}
        onclick={setSize(1080, 1080)}
      >
        1:1
      </button>
      <button
        class:active={viewportSize.value.width === 1080 && viewportSize.value.height === 1920}
        onclick={setSize(1080, 1920)}
      >
        9:16
      </button>
      <button
        class:active={viewportSize.value.width === 1920 && viewportSize.value.height === 1080}
        onclick={setSize(1920, 1080)}
      >
        16:9
      </button>
    </div>
    <div>
      <button class:abort={isRenderingVideo.value} onclick={renderVideo}>
        {#if isRenderingVideo.value}
          Abort Rendering
        {:else}
          Render Video
        {/if}
      </button>
    </div>
  </div>
</div>

<style>
  .editor {
    background-color: #000;
    display: grid;
    grid-template-rows: auto 1fr auto;
  }
  .editorElement {
    min-width: 0;
    min-height: 0;
  }
  .tabs {
    display: flex;
  }
  .tabs > button {
    background: transparent;
    position: relative;
    padding: 1rem;
  }
  .tabs > button.active {
    cursor: default;
  }
  .tabs > button.active::before {
    position: absolute;
    left: 0.5rem;
    right: 0.5rem;
    bottom: 0.5rem;
    height: 0.25rem;
    content: "";
    background: #393;
    cursor: default;
    border-radius: 0.25rem;
  }
  .tools {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 0.5rem;
    padding: 0.5rem;
  }
  .tools > div {
    display: flex;
    gap: 0.5rem;
  }
  .tools > div:nth-child(2) {
    justify-content: center;
  }
  .tools > div:nth-child(3) {
    justify-content: right;
  }
  .tools > div > button.abort {
    background: #933;
  }
  .tools > div > button.active {
    border-color: #393;
  }
  .color {
    position: relative;
    padding: 0;
    width: 2.125rem;
    height: 2.125rem;
  }
  .color > input[type="color"] {
    position: absolute;
    top: 0;
    left: 0;
    visibility: hidden;
  }
</style>
