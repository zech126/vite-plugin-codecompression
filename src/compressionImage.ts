import { VitePluginImageMin } from './types';
import { ResolvedConfig } from 'vite';
import { isNotFalse, isBoolean, isRegExp, isFunction, readAllFiles } from './imageUtils'

const path = require("path");
const fs = require("fs");
const chalk = require("chalk");
const Debug = require("debug");
const readFile = require("util").promisify(fs.readFile);

const imagemin = require("imagemin");
const imageminJpeg = require("imagemin-mozjpeg");
const imageminSvgo = require("imagemin-svgo");
const imageminWebp = require("imagemin-webp");
const imageminPng = require('imagemin-pngquant');
const imageminOptPng = require('imagemin-optipng');
const imageminJpegTran = require('imagemin-jpegtran');
const imageminGif = require('imagemin-gifsicle');

const debug = Debug.debug('compressionImage')

const extRE = /\.(png|jpeg|gif|jpg|bmp|svg)$/i

export default function compressionImage(options:VitePluginImageMin, config:ResolvedConfig) {
  return new Promise((resolve, reject) => {
    const outputPath = config.build.outDir;
    const publicDir = typeof config.publicDir === 'string' ? config.publicDir : '';

    const { disable = false, filter = extRE, verbose = true, success = () => {} } = options;
    if (disable) {
      resolve(true);
      success();
      return {};
    }

    debug('plugin options:', options);

    const mtimeCache = new Map<string, number>()
    let tinyMap = new Map<string,{ size: number; oldSize: number; ratio: number }>();

    async function processFile(filePath: string, buffer: Buffer) {
      let content: Buffer;
      try {
        content = await imagemin.buffer(buffer, { plugins: getImageminPlugins(options)});
        const size = content.byteLength;
        const oldSize = buffer.byteLength;

        tinyMap.set(filePath, {
          size: size / 1024,
          oldSize: oldSize / 1024,
          ratio: size / oldSize - 1,
        })

        return content;
      } catch (error) {
        config.logger.error('imagemin error:' + filePath);
      }
    }

    const handOutputPath = async(getPath:string = outputPath) => {
      
      tinyMap = new Map();
      const files: string[] = [];
      readAllFiles(getPath).forEach((file) => {
        filterFile(file, filter) && files.push(file)
      })
      debug('files:', files)

      if (!files.length) return;
      const handles = files.map(async (filePath: string) => {
        return new Promise((resolve, reject) => {
          const fullFilePath = path.join(config.root, filePath)
          if (fs.existsSync(fullFilePath) === false) {
            resolve(true);
            return
          }
          fs.stat(filePath, async(err:NodeJS.ErrnoException, stats:any) => {
            const { mtimeMs } = stats;
            if (mtimeMs <= (mtimeCache.get(filePath) || 0)) {
              resolve(true);
              return
            }
            const buffer = await readFile(fullFilePath)
            const content = await processFile(filePath, buffer)
            if (content) {
              fs.writeFile(fullFilePath, content, () => {
                mtimeCache.set(filePath, Date.now())
                resolve(true);
              });
            } else {
              resolve(true);
            }
          })
        })
      })
      await Promise.all(handles)
    }
    const performOutput = handOutputPath(outputPath);
    const performPublicDir = handOutputPath(publicDir);

    Promise.all([performOutput, performPublicDir]).then(() => {
      resolve(true);
      success();
      verbose && handleOutputLogger(config, tinyMap);
    })
  })
}
// 日志输出
function handleOutputLogger(config: ResolvedConfig, recordMap: Map<string, { size: number; oldSize: number; ratio: number }>) {
  config.logger.info(`\n${chalk.cyan('✨ [compressionImage]')}` + '- compressed image resource successfully: ');

  const keyLengths = Array.from(recordMap.keys(), (name) => name.length);
  const valueLengths = Array.from(recordMap.values(), (value) => `${Math.floor(100 * value.ratio)}`.length);

  const maxKeyLength = Math.max(...keyLengths);
  const valueKeyLength = Math.max(...valueLengths);
  recordMap.forEach((value, name) => {
    let { ratio } = value;
    const { size, oldSize } = value;
    ratio = Math.floor(100 * ratio);
    const fr = `${ratio}`;

    const denseRatio = ratio > 0 ? chalk.red(`+${fr}%`) : ratio <= 0 ? chalk.green(`${fr}%`) : '';

    const sizeStr = `${oldSize.toFixed(2)}kb / tiny: ${size.toFixed(2)}kb`;

    config.logger.info(
      chalk.dim(path.basename(config.build.outDir)) +
        '/' +
        chalk.blueBright(name) +
        ' '.repeat(2 + maxKeyLength - name.length) +
        chalk.gray(`${denseRatio} ${' '.repeat(valueKeyLength - fr.length)}`) +
        ' ' +
        chalk.dim(sizeStr),
    )
  })
  config.logger.info('\n');
}

function filterFile(file: string, filter: RegExp | ((file: string) => boolean)) {
  if (filter) {
    const isRe = isRegExp(filter)
    const isFn = isFunction(filter)
    if (isRe) {
      return (filter as RegExp).test(file)
    }
    if (isFn) {
      return (filter as (file: any) => any)(file)
    }
  }
  return false
}

// 图片压缩插件配置
function getImageminPlugins(options: VitePluginImageMin = {}): Array<any> {
  const {
    gifsicle = true,
    webp = false,
    mozjpeg = false,
    pngquant = false,
    optipng = true,
    svgo = true,
    jpegTran = true,
  } = options

  const plugins: Array<any> = []

  if (isNotFalse(gifsicle)) {
    debug('gifsicle:', true)
    const opt = isBoolean(gifsicle) ? undefined : gifsicle
    plugins.push(imageminGif(opt))
  }

  if (isNotFalse(mozjpeg)) {
    debug('mozjpeg:', true)
    const opt = isBoolean(mozjpeg) ? undefined : mozjpeg
    plugins.push(imageminJpeg(opt))
  }

  if (isNotFalse(options.pngquant)) {
    debug('pngquant:', true)
    const opt = isBoolean(pngquant) ? undefined : pngquant
    plugins.push(imageminPng(opt))
  }

  if (isNotFalse(optipng)) {
    debug('optipng:', true)
    const opt = isBoolean(optipng) ? undefined : optipng
    plugins.push(imageminOptPng(opt))
  }

  if (isNotFalse(svgo)) {
    debug('svgo:', true)
    const opt = isBoolean(svgo) ? undefined : svgo
    plugins.push(imageminSvgo(opt))
  }

  if (isNotFalse(webp)) {
    debug('webp:', true)
    const opt = isBoolean(webp) ? undefined : webp
    plugins.push(imageminWebp(opt))
  }

  if (isNotFalse(jpegTran)) {
    debug('webp:', true)
    const opt = isBoolean(jpegTran) ? undefined : jpegTran
    plugins.push(imageminJpegTran(opt))
  }
  
  return plugins
}