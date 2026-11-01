import { defineConfig } from 'vite';
import glsl from 'vite-plugin-glsl';

export default defineConfig({
  plugins: [
    glsl({
      include: [
        '**/*.glsl',
        '**/*.wgsl',
        '**/*.vert',
        '**/*.frag',
        '**/*.vs',
        '**/*.fs'
      ],
      defaultExtension: 'glsl',
      warnDuplicatedImports: true,
      autoBind: false
    })
  ],
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true
  }
});

