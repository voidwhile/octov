const fs = require('fs')
const path = require('path')

/**
 * 将根目录 version.json 中的版本号同步到 package.json
 */
function syncVersion() {
  try {
    const versionPath = path.join(__dirname, '..', 'version.json')
    const packagePath = path.join(__dirname, '..', 'package.json')

    if (!fs.existsSync(versionPath)) {
      console.error('未找到 version.json 文件')
      process.exit(1)
    }

    const versionData = JSON.parse(fs.readFileSync(versionPath, 'utf-8'))
    const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf-8'))

    if (packageData.version !== versionData.version) {
      packageData.version = versionData.version
      fs.writeFileSync(packagePath, JSON.stringify(packageData, null, 2) + '\n')
      console.log(`✅ 已将 package.json 版本号同步为: ${versionData.version}`)
    } else {
      console.log('ℹ️ 版本号已同步，无需操作')
    }
  } catch (err) {
    console.error('同步版本号失败:', err.message)
    process.exit(1)
  }
}

syncVersion()
