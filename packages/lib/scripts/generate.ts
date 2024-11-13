import path from 'node:path'
import { readFile, writeFile } from 'node:fs/promises'
import { emptyDir, ensureDir } from 'fs-extra'
import consola from 'consola'
import camelcase from 'camelcase'
import glob from 'fast-glob'
import { type BuiltInParserName, format } from 'prettier'
import chalk from 'chalk'
import { pathComponents } from './paths'
import { FILE_TYPE_SVG, svgToBase64, transformIcon } from './transform'
import { findWorkspaceDir } from '@pnpm/find-workspace-dir'
import { findWorkspacePackages } from '@pnpm/find-workspace-packages'

const COMPONENT_SUFFIX = 'npc-icon'

consola.info(chalk.blue('generating vue components'))
await ensureDir(pathComponents)
await emptyDir(pathComponents)
const files = await getSvgFiles()
consola.info(chalk.blue('generating vue files'))
await Promise.all(files.map((file) => transformToVueComponent(file)))

consola.info(chalk.blue('generating entry file'))
await generateEntry(files)

async function getSvgFiles() {
  const pkgs = await findWorkspacePackages(
    (await findWorkspaceDir(process.cwd()))!,
  )
  const pkg = pkgs.find(
    (pkg) => pkg.manifest.name === 'sources',
  )!

  return glob('*/**.(svg|png|oss)', { cwd: pkg.dir, absolute: true })
}

async function getName(file: string) {
  const fileFragments = file.split('/')
  // 模块名称
  const mpName = file.split('/')[fileFragments.length - 2]
  // 图标类型
  const extName = path.extname(file)
  // 文件名称
  const fileName = path.basename(file).replace(extName, '')
  // 组件名称
  const componentName = camelcase(COMPONENT_SUFFIX + '-' + mpName + '-' + fileName, { pascalCase: true })

  let description = {
    "mpName": mpName, // 模块名称
    "fileName": fileName,
    "label": '',
    'extName': extName.replace('.', ''),
    'componentName': componentName,
    "author": "", // 维护人
    "desc": "", // 该图标的相关描述
    "updateTime": "", // 最近一次更新时间
    "autoIconStr": false // 是否自动生成源内容（base64 ？ http）, 只能由false改为true，true改false请通知相关应用
  }
  const descriptionJsonPath = `${path.dirname(file)}/${fileName}.json`
  try {
    const result = await readFile(descriptionJsonPath, 'utf-8')
    description = {
      ...description,
      ...(JSON.parse(result))
    }
  } catch (error) {
    // consola.warn(`${mpName}/${fileName} 未定义说明文件！`)
  }
  return {
    fileName,
    componentName,
    mpName,
    extName,
    description
  }
}

function formatCode(code: string, parser: BuiltInParserName = 'typescript') {
  return format(code, {
    parser,
    semi: false,
    singleQuote: true,
  })
}

async function transformToVueComponent(file: string) {
  const { componentName, extName, fileName, description } = await getName(file)
  let content = ''
  let iconStr = ''
  const addIconStr = description.autoIconStr || extName === '.oss'
  if (extName === FILE_TYPE_SVG) {
    content = await readFile(file, 'utf-8')
    iconStr = description.autoIconStr ? svgToBase64(content) : ""
  } else {
    const data = await transformIcon(file, {
      extName,
      fileName
    })
    content = data.code
    iconStr = data.iconStr
  }

  const code = await formatCode(
    `
<template>
${content}
</template>
<script lang="ts" setup>
defineOptions({
  name: ${JSON.stringify(componentName)},
  iconStr:${addIconStr ? `"${iconStr}"` : "''"},
  customOptions:${JSON.stringify({
      ...description,
    })}
})

</script>`,
    'vue',
  )
  writeFile(path.resolve(pathComponents, `${componentName}.vue`), code, 'utf-8')
}

async function generatedEntryItemCode(file) {
  const { componentName } = await getName(file)
  return `export { default as ${componentName} } from './${componentName}.vue'`
}

async function generateEntry(files: string[]) {
  let code: any = await Promise.all(files.map(file => generatedEntryItemCode(file)))
  code = await formatCode(
    code.join('\n')
  )
  await writeFile(path.resolve(pathComponents, 'index.ts'), code, 'utf-8')
}
