import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';

export default {
  input: 'node_modules/axios/index.js',
  output: {
    dir: '.',
    format: 'es'
  },
  
  plugins: [json(), commonjs(), nodeResolve({preferBuiltins: false, browser: true})]
};