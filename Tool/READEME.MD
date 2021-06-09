# 【星门】

    ———— 日月所照，江河所至，哈是劳资的

    author：ChenyangDu,fangxm,hoho,yuandiaodiaodiao
    version:1.3

### 【使用方法】：
```js
require('./solve')(shardName_roomName,shardName2_roomName2)
```
将会返回一个对象,包含有path,distance,totalRooms属性
其中path是一个数组包含了 shard,roomName,x,y属性

### 【说明】:

1. 路程长度只是估算，作为参考，实际情况有出入，以十字路口为搜索起止更精确

2. 这些代码都是在本地跑的，不要传到游戏里面，本地运行的话使用命令node Test.js即可

### 【拓展】

1. 可以考虑写到跨shard内存中，或者直接写代码里面

2. 如果需要看能够到达的所有房间，可以先设置一个较远的目的地，然后将solve.js中258行Dijkstra()函数的`console.log('top',top.room,top.dis)`语句取消注释，可以看到搜索过程的所有中间房间

3. 如果需要从多个房间开始搜索，可以用findAllRoom.js

### 【示例】：

如果想从shard2 E41N42出发前往shard3 W11S21
可以直接进行填写
运行`ans = require('./solve')('shard2_E41N42','shard3_W11S21')`
就可以得到
```js
ans = { 
    path:
   [ { shard: 'shard2', roomName: 'E40N40', x: 19, y: 11 },
     { shard: 'shard1', roomName: 'E40N40', x: 8, y: 22 },
     { shard: 'shard0', roomName: 'E70N80', x: 33, y: 8 },
        ... ... ... ...
     { shard: 'shard3', roomName: 'W10S20', x: 25, y: 25 } ],
  distance: 861,
  totalRooms: 41 }
```
只用860tick左右就可以抵达了！
### 【应用】：
根据creep的位置直接在ans里面搜索距离现在位置最近的一个虫洞就OK了
```js
let ans = require('./solve')('shard2_E40N40','shard3_W10S20')
console.log(ans)
```

上面的是本地跑的代码,下面的是游戏里面的代码,那个ans建议手动复制过去
```js
let ret = null;
for(let path of ans){//ans最好手动复制过来，不要这么直接用
    if(path.shard == Game.shard.name){
        if(!ret){
            ret = path;
        }else{
            if(Game.map.getRoomLinearDistance(creep.pos.roomName,path.roomName) < 
            Game.map.getRoomLinearDistance(creep.pos.roomName,ret.roomName)){
                ret = path;
            }
        }
    }
}
if(ret)
    creep.moveTo(new RoomPosition(ret.x,ret.y,ret.roomName))
```
### 【数据更新】：

首次使用或者长时间未使用，请使用update语句更新数据。如果长时间无响应，或者网络状况不好，请自行下载(用记事本新建json文件然后把内容复制进去就行)
https://screepspl.us/data/shard0.portals.json =>data0.json
https://screepspl.us/data/shard1.portals.json =>data1.json
https://screepspl.us/data/shard2.portals.json =>data2.json
https://screepspl.us/data/shard3.portals.json =>data3.json
```js
function update(){
    const getData = require('./getData')
    for (let i = 0; i <= 3; i ++) {
        getData(i)
            .then(res => console.log(`shard${i} 下载完成`))
            .catch(err => console.log(`shard${i} 下载失败`, err))
    }
}
```