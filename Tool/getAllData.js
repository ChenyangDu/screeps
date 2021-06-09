const getData = require('./getData')
for (let i = 0; i <= 3; i ++) {
    getData(i)
        .then(res => console.log(`shard${i} 下载完成`))
        .catch(err => console.log(`shard${i} 下载失败`, err))
}