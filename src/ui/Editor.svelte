<script module lang="ts">
  import 'monaco-editor/esm/vs/editor/contrib/find/browser/findController.js';
  import 'monaco-editor/esm/vs/editor/contrib/hover/browser/hoverContribution.js';
  import * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js';
  import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
  import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

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
    getWorker(_, label) {
      if (label === 'typescript' || label === 'javascript') {
        return new tsWorker();
      }
      return new editorWorker();
    },
  };
</script>

<script lang="ts">
  import { untrack } from 'svelte';
  import {
    // animationDuration,
    code,
    errors,
    // backgroundColor,
    viewportSize,
  } from './State.svelte';

  let { renderVideo }: { renderVideo: () => Promise<void> } = $props();

  const recompile = () => {
    code.value = editor.getValue();
  };

  // const setBackground = () => {
  //   backgroundColor.value = '#778800';
  // };

  // const setDuration = () => {
  //   animationDuration.value = 1;
  // };

  const setSize = (width: number, height: number) => () => {
    viewportSize.value = { width, height };
  };

  let editor: monaco.editor.IStandaloneCodeEditor;
  let editorElement: HTMLDivElement;
  $effect(() => {
    editor = monaco.editor.create(editorElement, {
      minimap: { enabled: false },
      theme: 'vs-dark',
      value: untrack(() => code.value),
      language: 'glsl',
    });
    const resizeEditor = () => editor.layout();
    window.addEventListener('resize', resizeEditor);
    return () => {
      window.addEventListener('resize', resizeEditor);
    };
  });

  $effect(() => {
    const lines = editor.getValue().split('\n');
    const lastLine = lines.length;
    monaco.editor.setModelMarkers(
      editor.getModel()!,
      'Errors',
      errors.value.map(({ line = lastLine, message }) => {
        const matches = /'(.+)' :/.exec(message);
        const code = lines[line - 1];
        let start = 0;
        let end = 0;
        if (matches) {
          const index = code.indexOf(matches[1]);
          if (index !== -1) {
            start = index + 1;
            end = 1 + index + matches[1].length;
            message = message.slice(`'${matches[1]}' : `.length);
          }
        }
        return {
          message,
          startLineNumber: line,
          endLineNumber: line,
          startColumn: start,
          endColumn: end,
          severity: monaco.MarkerSeverity.Error,
        };
      })
    );
  });

  const onkeydown = (e: KeyboardEvent) => {
    e.altKey && e.key === 'Enter' && recompile();
    (e.ctrlKey || e.metaKey) && e.key === 's' && e.preventDefault();
  };
</script>

<svelte:window onkeydown={onkeydown} />

<div class="editor">
  <div class="tabs">
    <button class="active">
      Shader
    </button>
    <!-- <button>
      Camera
    </button> -->
  </div>
  <div bind:this={editorElement}></div>
  <div class="tools">
    <div>
      <button onclick={recompile}>
        Recompile
      </button>
    </div>
    <div>
      <!-- <button onclick={setBackground}>
        Background
      </button> -->
      <!-- <button onclick={setDuration}>
        Duration
      </button> -->
      <button onclick={setSize(1080, 1080)}>
        1:1
      </button>
      <button onclick={setSize(1080, 1920)}>
        9:16
      </button>
      <button onclick={setSize(1920, 1080)}>
        16:9
      </button>
    </div>
    <div>
      <button onclick={renderVideo}>
        Render Video
      </button>
    </div>
  </div>
</div>

<style>
  .editor {
    min-height: 0;
    width: 700px;
    background-color: #000;
    display: grid;
    grid-template-rows: auto 1fr auto;
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
    display: flex;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0.5rem;
  }
  .tools > div {
    display: flex;
    gap: 0.5rem;
  }
</style>
