# 安装
yarn add vite-plugin-codecompression -D

或

npm i vite-plugin-codecompression -D

cnpm install vite-plugin-codecompression -D

# vite 使用
```js
  import { defineConfig } from 'vite';
  import vue from '@vitejs/plugin-vue';
  import vitePluginCodecompression from "vite-plugin-codecompression";

  export default defineConfig({
    plugins: [
      vue(),
      vitePluginCodecompression()
    ]
  })
  // 或
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
        imageCompression: {
          disable: false,
          filter: /\.(png|jpeg|gif|jpg|bmp|svg)$/i,
          gifsicle: {
            optimizationLevel: 7,
            interlaced: false
          },
          mozjpeg: {
            quality: 20
          },
          optipng: {
            optimizationLevel: 7
          },
          pngquant: {
            quality: [0.8, 0.9],
            speed: 4
          },
          svgo: {
            plugins: [
              {
                name: "removeViewBox"
              },
              {
                name: "removeEmptyAttrs",
                active: false
              }
            ]
          },
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