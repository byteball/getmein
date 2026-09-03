import { defineConfig, loadEnv } from '@rsbuild/core';
import { pluginLess } from '@rsbuild/plugin-less';
import { pluginNodePolyfill } from '@rsbuild/plugin-node-polyfill';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginSvgr } from '@rsbuild/plugin-svgr';

const lessVariables = {
  '@primary-color': '#1e90ff',
  '@text-color': '#ffffff',
  '@text-color-secondary': '#ffffff',
  '@statistic-content-font-size': '16px',
  '@margin-sm': '5px',
  '@input-height-lg': '60px',
  '@select-single-item-height-lg': '60px',
};

export default defineConfig(({ envMode }) => {
  const { publicVars } = loadEnv({
    mode: envMode,
    prefixes: ['REACT_APP_'],
  });

  return {
    plugins: [
      pluginReact(),
      pluginNodePolyfill(),
      pluginLess({
        parallel: true,
        lessLoaderOptions: {
          lessOptions: {
            javascriptEnabled: true,
            modifyVars: lessVariables,
          },
        },
      }),
      pluginSvgr({
        parallel: true,
        svgrOptions: {
          exportType: 'named',
        },
      }),
    ],
    source: {
      define: publicVars,
      tsconfigPath: './jsconfig.json',
    },
    output: {
      distPath: {
        root: 'build',
      },
      sourceMap: process.env.GENERATE_SOURCEMAP === 'true',
    },
    html: {
      template: './public/index.html',
    },
    server: {
      publicDir: {
        name: 'public',
        copyOnBuild: true,
        watch: true,
        ignore: ['index.html'],
      },
    },
  };
});
