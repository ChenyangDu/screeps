//起点房间
let roomArray=['shard3_E39N49','shard2_E41N35','shard1_E39N51']

//终点
let endPoint=['shard1_E36N41']
let ansArray=[]
for(let start of roomArray){
    for(let end of endPoint){
        let ans = require('./solve')(start,end)
        ans.startRoom=start
        ans.endRoom=end
        ansArray.push(ans)
        console.log(ans)
    }
}
//结果
ansArray=ansArray.sort((a,b)=>a.distance-b.distance)
let best=ansArray[0]
console.log("最优结果")
console.log(best)
