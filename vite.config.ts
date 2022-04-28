import { defineConfig } from 'vite';

const path = require('path');
// 输出目录
const projectName = 'dist';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [],
  root: process.cwd(),
  base: "./",
  //控制台输出的级别 info 、warn、error、silent
  logLevel: "info",
  // 设为false 可以避免 vite 清屏而错过在终端中打印某些关键信息
  // clearScreen:true,
  // 自定义 env 变量的前缀
  // envPrefix: [],
  // 配置文件别名
  resolve: {
    // 忽略文件导入后缀名称（设置之将覆盖默认设置，建议使用默认）
    // extensions: ['.js', '.vue', '.json', 'jsx'],
    // 使用别名并且TS框架时，需要到到 tsconfig.js 文件配置 path 属性自定义引入的路径
    alias: [
      // src 根目录别名
      { find: '@', replacement: path.resolve(__dirname, './src') }
    ]
  },
  // 打包配置
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'VitePluginCodeCompression',	// 暴露的全局变量
      // formats: ['es'],
      fileName: (format) => `index.${format}.js` // 输出的包文件名
    },
    outDir: `${projectName}`, //指定输出路径
    // 打包文件设置
    rollupOptions: {
      // 确保外部化处理那些不想打包进库的依赖
      external: [],
      output: {
        // 在 UMD 构建模式下为这些外部化的依赖提供一个全局变量
        // globals: {
        //   vue: 'Vue'
        // }
      }
    },
    // @rollup/plugin-commonjs 插件的选项
    commonjsOptions: {},
    //当设置为 true，构建后将会生成 manifest.json 文件
    // manifest: false,
    /* 
      设置为 false 可以禁用最小化混淆，
      或是用来指定使用哪种混淆器, terser 构建后文件体积更小
      boolean | 'terser' | 'esbuild'
    */
    minify: "terser",
    //传递给 Terser 的更多 minify 选项。
    terserOptions: {
      // 清除 console 和 debugger
      // compress: {
      //   drop_console: true,
      //   drop_debugger: true
      // }
    },
  },
  // 强制预构建插件包
  optimizeDeps: {
    // 检测需要预构建的依赖项
    entries: [],
    // 默认情况下，不在 node_modules 中的，链接的包不会预构建
    // include: [
    //   'vue', 'axios', 'nprogress', 'vue-router', 'vuex', 'element-plus', 'js-cookie', '@element-plus/icons-vue',
    //   'dayjs'
    // ],
    include: [],
    // exclude:['your-package-name'] //排除在优化之外
  },
  json: {
    //是否支持从 .json 文件中进行按名导入
    namedExports: true,
    //若设置为 true 导入的json会被转为 export default JSON.parse("..") 会比转译成对象字面量性能更好
    stringify: false
  },
   //继承自 esbuild 转换选项，最常见的用例是自定义 JSX
  esbuild: {
    jsxFactory: "h",
    jsxFragment: "Fragment",
    jsxInject:`import Vue from 'vue'`
  }
})
