const https = require('https')
const fs = require('fs')


/**
 * 下载指定 shard 的 portals 数据
 * 
 * @param {number} index 指定的 shard 索引 0-3
 * @returns {Promise} 保存完成时 resolve, 保存失败时 rejcet
 */
module.exports = function(index) {
    return new Promise((resolve, rejcet) => {
        https.get(`https://screepspl.us/data/shard${index}.portals.json`, (req, res) => {
            console.log(`shard${index} 下载中, 请稍后...`)
            let jsonData = ''
            
            // 拼接数据片段
            req.on('data', data => jsonData += data.toString())

            // 下载完成，写入 json
            req.on('end', () => {
                fs.writeFile(`data${index}.json`, jsonData, err => err ? rejcet(err) : resolve(jsonData))
            })
        })
    })
}
