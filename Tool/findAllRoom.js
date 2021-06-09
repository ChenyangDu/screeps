//起点房间
let roomArray=['E28N46','E25N43','E29N41','E29N38','E27N38','E14N41','E19N41','E1N29','E11N32','W5N31',"W15N32"]
//填充shard
for(let index in roomArray){
    roomArray[index]="shard3_"+roomArray[index]
}
//终点
let endPoint=['shard3_W20S10']
let ansArray=[]
for(let start of roomArray){
    for(let end of endPoint){
        let ans = require('./solve')(start,end)
        ans.startRoom=start
        ans.endRoom=end
        ansArray.push(ans)
    }
}
//结果
ansArray=ansArray.sort((a,b)=>a.distance-b.distance)
let best=ansArray[0]
console.log("最优结果")
console.log(best)
