const path = require('path')
const fs = require('fs')
const glob = require('fast-glob')
const { Project } = require('ts-morph')

async function main() {
  // 这部分内容具体可以查阅 ts-morph 的文档
  // 这里仅需要知道这是用来处理 ts 文件并生成类型声明文件即可
  const project = new Project({
    compilerOptions: {
      declaration: true,
      emitDeclarationOnly: true,
      noEmitOnError: true,
      allowJs: true, // 如果想兼容 js 语法需要加上
      outDir: 'dist' // 可以设置自定义的打包文件夹，如 'types'
    },
    tsConfigFilePath: path.resolve(__dirname, './tsconfig.json'),
    skipAddingFilesFromTsConfig: true
  })

  // 获取 src 下的 .ts 文件
  const files = await glob(['src/**/*.ts']);
  const sourceFiles = [];

  await Promise.all(
    files.map(async file => {
      // 添加声明文件
      sourceFiles.push(project.addSourceFileAtPath(file));
    })
  )

  const diagnostics = project.getPreEmitDiagnostics();

  // 输出解析过程中的错误信息
  console.log(project.formatDiagnosticsWithColorAndContext(diagnostics));

  project.emitToMemory();

  // 随后将解析完的文件写道打包路径
  for (const sourceFile of sourceFiles) {
    const emitOutput = sourceFile.getEmitOutput();

    for (const outputFile of emitOutput.getOutputFiles()) {
      const filePath = outputFile.getFilePath();

      await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
      await fs.promises.writeFile(filePath, outputFile.getText(), 'utf8');
    }
  }
}

main();