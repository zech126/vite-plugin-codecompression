# 安装
yarn add vite-plugin-codecompression -D

或

npm i vite-plugin-codecompression -D

npm install vite-plugin-codecompression -D

# vite 使用
```js
  import { defineConfig } from 'vite';
  import vue from '@vitejs/plugin-vue';
  import vitePluginCodecompression from "vite-plugin-codecompression";
  export default defineConfig({
    plugins: [
      vue(),
      vitePluginCodecompression({
        codeCompression: {
          disable: false,
          filter: /\.(js|mjs|json|css|html)$/i,
          verbose:true,
          threshold: 1025,
          compressionOptions: {},
          deleteOriginFile: false,
          success: () => {}
        },
        fileZip: {
          target: ''
          disable: false,
          success: () => {}
        }
      })
    ]
  })
```