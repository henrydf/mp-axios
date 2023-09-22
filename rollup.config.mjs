import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import copy from 'rollup-plugin-copy';

export default {
  input: 'node_modules/axios/index.js',
  output: {
    dir: '.',
    format: 'es'
  },
  
  plugins: [
    copy({
      targets: [
        { src: 'node_modules/axios/index.d.ts', dest: '.' },
        { src: 'node_modules/axios/lib/adapters/mp-xhr.js', dest: '.' },
        { src: 'node_modules/axios/lib/adapters/xhr.js', dest: '.' },
      ],
    }),
    json(),
    commonjs(),
    nodeResolve({preferBuiltins: false, browser: true}),
  ],
};