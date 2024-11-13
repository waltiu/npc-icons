import fs from 'fs'

export const FILE_TYPE_SVG = '.svg'
export const FILE_TYPE_PNG = '.png'
export const FILE_TYPE_OSS = '.oss'


export const transformIcon = async (fileUrl, { extName, fileName }) => {
    return new Promise<any>((resolve, reject) => {
        fs.readFile(fileUrl, (err, data) => {
            if (err) {
                reject(err)
            } else {
                let code = ''
                let iconStr = ''
                if (extName === FILE_TYPE_PNG) {
                    // 转换为Base64
                    const base64Image = `data:image/png;base64,${data.toString('base64')}`;
                    code = `<svg xmlns="http://www.w3.org/2000/svg">  <image 
                    width="100%" height="100%"
                     href="${base64Image}" ></image>
                     </svg>`
                    iconStr = base64Image
                } else if (extName === FILE_TYPE_OSS) {
                    const ossUrl = data.toString('utf-8')
                    code = `<img src="${ossUrl}" />`
                    iconStr = ossUrl
                }
                resolve({
                    code,
                    iconStr
                })

            }
        },);
    })
}


export function svgToBase64(svg) {
    const utf8Bytes = new TextEncoder().encode(svg);
    return 'data:image/svg+xml;base64,' + btoa(String.fromCharCode.apply(null, utf8Bytes));
}