import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'enhancers/lang': 'src/enhancers/LangEnhancer.js',
    'enhancers/link': 'src/enhancers/LinkEnhancer.js',
    'enhancers/skipLinks': 'src/enhancers/SkipLinkEnhancer.js',
    'enhancers/button': 'src/enhancers/ButtonEnhancer.js',
    'enhancers/image': 'src/enhancers/ImageEnhancer.js',
    'enhancers/heading': 'src/enhancers/HeadingEnhancer.js',
    'enhancers/form': 'src/enhancers/FormEnhancer.js',
    'enhancers/landmarks': 'src/enhancers/LandmarkEnhancer.js',
    'enhancers/video': 'src/enhancers/VideoEnhancer.js',
    'enhancers/icon': 'src/enhancers/IconEnhancer.js',
    'enhancers/frames': 'src/enhancers/FrameEnhancer.js',
    'enhancers/tables': 'src/enhancers/TableEnhancer.js',
    'enhancers/document': 'src/enhancers/DocumentEnhancer.js',
    'enhancers/contrast': 'src/enhancers/ContrastEnhancer.js',
    'enhancers/focus': 'src/enhancers/FocusEnhancer.js',
  },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: false,
  minify: 'terser',
  clean: true,
  treeshake: true,
  splitting: true,
});
