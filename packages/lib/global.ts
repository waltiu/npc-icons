import * as icons from './components'
import iconsDescription from './sources/description.json'

export interface InstallOptions {
  /** @default `ElIcon` */
  prefix?: string
}
export default (app: any) => {
  for (const [key, component] of Object.entries(icons)) {
    app.component(key, component)
  }
}
const getIconsMap = () => {
  const iconsMap: any = {}
  Object.entries(icons).forEach(([key, component]) => {
    const mpName = component.customOptions.mpName
    if (iconsMap[mpName]) {
      iconsMap[mpName].icons.push(component)
    } else {
      iconsMap[mpName] = {
        ...((iconsDescription as any)[mpName] || {}),
        name: mpName,
        icons: [component]
      }
    }
    iconsMap[mpName].dataMap = {
      ...(iconsMap[mpName].dataMap || {}),
      [component.name as string]:component
    }
  });
  return iconsMap
}

export {
  icons,
  getIconsMap
}

