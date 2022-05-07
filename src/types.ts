import type { ZlibOptions, BrotliOptions } from 'zlib';
import type { Options as GifsicleOptions } from 'imagemin-gifsicle';
import type { Options as SvgoOptions } from 'imagemin-svgo';
import type { Options as MozjpegOptions } from 'imagemin-mozjpeg';
import type { Options as OptipngOptions } from 'imagemin-optipng';
import type { Options as PngquantOptions } from 'imagemin-pngquant';
import type { Options as WebpOptions } from 'imagemin-webp';
import type { Options as JpegOptions } from 'imagemin-jpegtran';

export type Algorithm = 'gzip' | 'brotliCompress' | 'deflate' | 'deflateRaw'

export type CompressionOptions = Partial<ZlibOptions> | Partial<BrotliOptions>

export interface VitePluginCompression {
  verbose?: boolean
  threshold?: number
  filter?: RegExp | ((file: string) => boolean)
  disable?: boolean
  algorithm?: Algorithm
  ext?: string
  compressionOptions?: CompressionOptions
  deleteOriginFile?: boolean
  success?: () => void
}

export interface zipType{
  target?: string
  disable?: boolean
  success?: () => void
}

type EnabledOptions<T> = T | false
export interface SvgOption extends SvgoOptions {
  plugins: any[]
}
export interface VitePluginImageMin {
  verbose?: boolean
  filter?: RegExp | ((file: string) => boolean)
  disable?: boolean
  gifsicle?: EnabledOptions<GifsicleOptions>
  svgo?: EnabledOptions<SvgOption>
  mozjpeg?: EnabledOptions<MozjpegOptions>
  optipng?: EnabledOptions<OptipngOptions>
  pngquant?: EnabledOptions<PngquantOptions>
  webp?: EnabledOptions<WebpOptions>
  jpegTran?: EnabledOptions<JpegOptions>
  success?: () => void
}
export interface VitePluginCodeCompression {
  codeCompression?: VitePluginCompression
  imageCompression?: VitePluginImageMin
  fileZip?: zipType
}