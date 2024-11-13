import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = dirname(fileURLToPath(import.meta.url))

export const pathRoot = resolve(dir, '..')
export const pathComponents = resolve(pathRoot, 'components')
export const pathOutput = resolve(pathRoot, 'dist')
