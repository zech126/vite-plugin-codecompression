import type { Plugin, ResolvedConfig } from 'vite';
import { VitePluginCompressionZip } from './types';
import zipHand from './zipHand';
import compressionCode from './compressionCode';
// import compressionImage from './compressionImage';

let config: ResolvedConfig;
const imageConfig = {
  // gif 压缩
  gifsicle: {
    optimizationLevel: 7,
    interlaced: false
  },
  // jpg 压缩
  mozjpeg: {
    quality: 20
  },
  // png 压缩
  optipng: {
    optimizationLevel: 7
  },
  // png 压缩
  pngquant: {
    quality: [0.8, 0.9],
    speed: 4
  }
}

export default function compression(options:VitePluginCompressionZip = {codeCompression: {}, fileZip: {}}):Plugin {
  return {
    // 插件名称
    name: 'vite:compressionZip',
    // 该插件在 plugin-vue 插件之后执行
    enforce: 'post',
    // 获取配置
    configResolved (resolvedConfig) {
      config = resolvedConfig;
    },
    // build 时执行
    apply: 'build',
    // 在 vite 本地服务关闭前，rollup 输出文件到目录前调用
    closeBundle () {
      // 压缩代码
      const code =  compressionCode(options.codeCompression, config);
      // 压缩图片
      // const image = compressionImage(Object.assign(imageConfig, options.imageCompression), config);
      // 压缩完成后再将输出目录生成 zip
      // Promise.all([code, image]).then(() => {
      Promise.all([code]).then(() => {
        // 生成 zip 
        zipHand(options.fileZip, config);
      })
    }
  }
}