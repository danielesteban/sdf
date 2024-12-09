/// <reference types="svelte" />
/// <reference types="vite/client" />

declare module '*.frag' {
  const text: string;
  export default text;
}

declare module '*.glsl' {
  const text: string;
  export default text;
}

declare module '*.vert' {
  const text: string;
  export default text;
}
