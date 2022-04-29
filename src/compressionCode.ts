import { VitePluginCompression, CompressionOptions } from './types';
import { ResolvedConfig } from 'vite';
import { readAllFile, isRegExp, isFunction } from './codeUtils';
const path = require("path");
const fs = require("fs");
const chalk = require("chalk");
const zlib = require("zlib");
const Debug = require("debug");
const readFile = require("util").promisify(fs.readFile);

const debug = Debug.debug('code-compression');

const extRE = /\.(js|mjs|json|css|html)$/i;

const mtimeCache = new Map<string, number>()

function filterFiles(files: string[], filter: RegExp | ((file: string) => boolean)) {
  if (filter) {
    const isRe = isRegExp(filter)
    const isFn = isFunction(filter)
    files = files.filter((file) => {
      if (isRe) {
        return (filter as RegExp).test(file)
      }
      if (isFn) {
        // eslint-disable-next-line
        return (filter as Function)(file)
      }
      return true
    })
  }
  return files
}

/**
 * get common options
 */
function getCompressionOptions( algorithm = '', compressionOptions: CompressionOptions = {}) {
  const defaultOptions: {
    [key: string]: Record<string, any>
  } = {
    gzip: {
      level: zlib.constants.Z_BEST_COMPRESSION,
    },
    deflate: {
      level: zlib.constants.Z_BEST_COMPRESSION,
    },
    deflateRaw: {
      level: zlib.constants.Z_BEST_COMPRESSION,
    },
    brotliCompress: {
      params: {
        [zlib.constants.BROTLI_PARAM_QUALITY]:
          zlib.constants.BROTLI_MAX_QUALITY,
        [zlib.constants.BROTLI_PARAM_MODE]: zlib.constants.BROTLI_MODE_TEXT,
      },
    },
  }
  return {
    ...defaultOptions[algorithm],
    ...compressionOptions,
  } as CompressionOptions
}

/**
 * Compression core method
 * @param content
 * @param algorithm
 * @param options
 */
function compress(content: Buffer, algorithm: 'gzip' | 'brotliCompress' | 'deflate' | 'deflateRaw',options: CompressionOptions = {}) {
  return new Promise<Buffer>((resolve, reject) => {
    // @ts-ignore
    zlib[algorithm](content, options, (err, result) =>
      err ? reject(err) : resolve(result),
    )
  })
}

/**
 * Get the suffix
 * @param filepath
 * @param ext
 */
function getOutputFileName(filepath: string, ext: string) {
  const compressExt = ext.startsWith('.') ? ext : `.${ext}`
  return `${filepath}${compressExt}`
}

// 日志输出
function handleOutputLogger(config: ResolvedConfig, compressMap: Map<string, { size: number; oldSize: number; cname: string }>, algorithm: string) {
  config.logger.info(`\n${chalk.cyan('✨ [compressionCode]:algorithm=' + algorithm)}` +` - compressed file successfully: `);

  const keyLengths = Array.from(compressMap.keys(), (name) => name.length);

  const maxKeyLength = Math.max(...keyLengths);

  compressMap.forEach((value, name) => {
    const { size, oldSize, cname } = value;
    const rName = cname.replace(path.join(config.root, config.build.outDir), config.build.outDir);
    const sizeStr = `${oldSize.toFixed(2)}kb / ${algorithm}: ${size.toFixed(2)}kb`;
    const ratio = `${((1 - (size / oldSize)) * 100).toFixed(2)}%`;
    config.logger.info(`${chalk.blueBright(rName)}${' '.repeat(2 + maxKeyLength - name.length)}${chalk.dim(sizeStr)}  ${chalk.green(ratio)}`)
  })
  config.logger.info('\n');
}

export default function compressionCode(options:VitePluginCompression = {}, config: ResolvedConfig) {
  return new Promise((resolve, reject) => {
    const {
      disable = false,
      filter = extRE,
      verbose = true,
      threshold = 1025,
      compressionOptions = {},
      deleteOriginFile = false,
      // eslint-disable-next-line
      success = () => {},
    } = options;
    const outputPath = path.join(config.root, config.build.outDir);
    debug('resolvedConfig:', config);
    
    let { ext = '' } = options
    const { algorithm = 'gzip' } = options
    if (algorithm === 'gzip' && !ext) {
      ext = '.gz'
    }
    if (algorithm === 'brotliCompress' && !ext) {
      ext = '.br'
    }
    if (disable) {
      resolve(true);
      success();
      return '';
    }
    debug('plugin options:', options);
  
    const closeBundle = async() => {
      let files = readAllFile(outputPath) || []
      debug('files:', files)
  
      if (!files.length) {
        resolve(true);
        success();
        return;
      }
  
      files = filterFiles(files, filter)
  
      const compressOptions = getCompressionOptions(
        algorithm,
        compressionOptions,
      )
  
      const compressMap = new Map<string, { size: number; oldSize: number; cname: string }>()
  
      const handles = files.map((filePath: string) => {
        return new Promise((resolve, reject) => {
          fs.stat(filePath, async(err:NodeJS.ErrnoException, stats:any) => {
            const { mtimeMs, size: oldSize } = stats;
            if (mtimeMs <= (mtimeCache.get(filePath) || 0) || oldSize < threshold) {
              resolve(true)
              return;
            }
              
            let content = await readFile(filePath)
    
            if (deleteOriginFile) {
              fs.remove(filePath)
            }
    
            try {
              content = await compress(content, algorithm, compressOptions)
            } catch (error) {
              config.logger.error('compress error:' + filePath)
            }
            const size = content.byteLength
    
            const cname = getOutputFileName(filePath, ext)
            compressMap.set(filePath, {
              size: size / 1024,
              oldSize: oldSize / 1024,
              cname: cname,
            })
            await fs.writeFile(cname, content, () => {
              mtimeCache.set(filePath, Date.now());
              resolve(true);
            })
          })
        })
      });

      return Promise.all(handles).then(() => {
        resolve(true);
        success();
        verbose && handleOutputLogger(config, compressMap, algorithm);
      });
    }
    closeBundle();
  })
}