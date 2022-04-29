import { zipType } from './types';
import { ResolvedConfig } from 'vite';

//获取文件系统模块，负责文件读写
const fs = require("fs");
//工具模块，处理文件路径
const path = require("path");
// 引入 zip
const JSZIP = require("jszip");

export default function zipHand(options:zipType = {}, config: ResolvedConfig) {
  return new Promise((resolve, reject) => {
    const {
      disable = false,
      // 压缩包名
      target = `${config.build.outDir || 'dist'}`,
      success = () => {},
    } = options;
    if (disable) {
      success();
      resolve(true);
      return;
    }
    // 根目录
    const currPath = path.join(config.root);
    // 资源文件夹名称
    const directory = config.build.outDir || 'dist';
    const zip = new JSZIP();
  // 读取目录下的所有文件
    const readDir = (obj:any, nowPath:string) => {
      // 读取目录中的所有文件及文件夹（同步操作）
      const files = fs.readdirSync(nowPath);
      // 遍历检测目录中的文件
      files.forEach((fileName:string, index:number) => {
        const fillPath = `${nowPath}/${fileName}`;
        // 获取一个文件的属性
        const file = fs.statSync(fillPath);
        // 如果是目录的话，继续查询
        if (file.isDirectory()) {
          const base = nowPath.split(`${directory}/`)[1];
          // 压缩对象中生成该目录
          const dirlist = zip.folder(`${base ? `${directory}/${base}` : directory}/${fileName}`);
          // 重新检索目录文件
          readDir(dirlist, fillPath);
        } else {
          // 压缩目录添加文件
          obj.file(fileName, fs.readFileSync(fillPath));
        }
      })
    }
    // 压缩文件处理
    const startZIP = () => {
      const zipName = `${currPath}/${target}.zip`;
      // 删除压缩文件
      if(fs.existsSync(zipName) && fs.statSync(zipName).isFile()) {
        fs.unlinkSync(zipName);
      }
      // 资源目录
      const resDir = path.join(currPath, directory);
      
      if (!path.isAbsolute(resDir)) {
        console.log('找不到资源目录');
        return;
      }
      // 压缩文件里面新增目录
      const dirlist = zip.folder(target);
      readDir(dirlist, resDir);
        //设置压缩格式，开始打包
      zip.generateAsync({
        type: "nodebuffer", //nodejs用
        compression: "DEFLATE", //压缩算法
        compressionOptions: { //压缩级别
          level: 9
        }
      }).then(async (content:any) =>{
        console.log(`将${directory}目录添加到${target}.zip`);
        //将打包的内容写入压缩包里
        await fs.writeFileSync(zipName, content, "utf-8");
        success();
        resolve(true);
      })
    }
    startZIP();
})
}
