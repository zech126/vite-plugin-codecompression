import type { ZlibOptions, BrotliOptions } from 'zlib'

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
export interface VitePluginCodeCompression {
  codeCompression?: VitePluginCompression
  fileZip?: zipType
}