/**
 * 【功能】本模块的主要功能是提供spawn服务
 * 
 * 【结构】
 * 每个房间room.memory.spawnList包含了一个等待spawn的列表
 * 其中包含{body,name,opt,priority}四个属性
 * priority为优先级
 * 优先级总共分为1-10级，默认5级
 * 1级：搬运工
 * 2级：矿机
 * 3级：
 * 
 */
module.exports = {
    /**
     * 向列表中添加一个creep
     * 插入到同等优先级的最后一位
     * addSpawnList(roomName,body,name,opt)
     */
    addSpawnList,

    /**
     * 判断是否有空余的spawn
     * haveFreeSpawn(roomName)
     */
    haveFreeSpawn,

    /**
     * 用一小段part拼接最长的part
     * getbody(initpart,looppart,maxcost,maxLen = 50)
     */
    getbody,

    /**
     * 获取房间中的等待spawn的列表
     * getList(room,fit = ()=>true)
     */
    getList,

    /**
     * 在main中每tick调用一次
     */
    spawn,
}

function addSpawnList(roomName,body,name,opt,priority=5){
    let room = Game.rooms[roomName]
    if(room){
        if(!room.memory.spawnList)room.memory.spawnList = [];
        let list = room.memory.spawnList;
        for(let pre of list){
            if(pre.name == name)return;
        }
        let index = 0
        for(;index < list.length;index++){
            if(list[index].priority > priority)break;
        }
        room.memory.spawnList.splice(index,0,{body,name,opt,priority})
    }
}

function addSpawnListEmergency(roomName,body,name,opt){
    let room = Game.rooms[roomName]
    if(room){
        if(!room.memory.spawnList)room.memory.spawnList = [];
        let list = room.memory.spawnList;
        for(let i=0;i<list.length;i++){
            let pre = list[i];
            if(pre.name == name){
                list.splice(i,1);
                i--;
            }
        }
        room.memory.spawnList.unshift({body:body,name:name,opt:opt})
    }
}

function haveFreeSpawn(roomName){
    return getFreeSpawn(roomName) !== null;
}

function getbody(initpart,looppart,maxcost,maxLen = 50){
    let body = initpart;
    let cost = getcost(initpart);
    let loopcost = getcost(looppart);
    while(cost + loopcost <= maxcost && body.length + looppart.length <= maxLen){
        cost += loopcost;
        body = body.concat(looppart);
    }
    return body;
}

function getFreeSpawn(roomName){
    for (var spawnname in Game.spawns){
        var spawn = Game.spawns[spawnname]
        if(spawn.room.name == roomName && spawn.spawning == null){
            return spawn
        }
    }
    return null;
}

function getList(room,fit = ()=>true){
    if(room && room.memory && room.memory.spawnList){
        return room.memory.spawnList.filter(fit);
    }
    return [];
}

function spawn(){
    for(let room of Game.myrooms){
        let list = room.memory.spawnList

        if(list && list.length){
            let spawn = getFreeSpawn(room.name)
            if(spawn){
                let callback = spawn.spawnCreep(list[0].body,list[0].name,list[0].opt)
                
                if(callback != -6 || isHarvester(list[0]) || 
                    getcost(list[0].body) > spawn.room.energyCapacityAvailable)
                    list.splice(0,1)
            }
        }
        // if(Game.time % 23 == 0){
        //     for(let i in list){
        //         if(i != 0 && isHarvester(list[i])){
        //             [list[0],list[i]] = [list[i],list[0]]
        //         }
        //     }
        // }
    }
}

function isHarvester(pre){
    if(pre && pre.opt && pre.opt.memory && pre.opt.memory.role
        && pre.opt.memory.role == "harvester"){
            return true;
        }
    return false;
}

function getcost(body){
    let res = 0;
    for(let part of body){
        res += BODYPART_COST[part]
    }
    return res;
}