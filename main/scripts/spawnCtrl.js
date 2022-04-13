module.exports = {
    /**
     * 
     * @param {*} roomName 
     * @param {*} body 
     * @param {*} name 
     * @param {*} opt 
     * @returns 
     */
    addSpawnList,
    addSpawnListEmergency,
    
    getbody(initpart,looppart,cap,maxLen = 50){
        let body = initpart;
        let cost = getcost(initpart);
        let loopcost = getcost(looppart);
        while(cost + loopcost <= cap && body.length + looppart.length <= maxLen){
            cost += loopcost;
            body = body.concat(looppart);
        }
        return body;
    },
    /**
     * 获取房间中的等待spawn的列表
     * @param {*} room :Room
     * @param {*} fit  一个函数用来过滤列表，默认为返回真
     * @returns 
     */
    getList,

    /**
     * 在main中每tick调用一次
     */
    spawn,
}

function addSpawnList(roomName,body,name,opt){
    let room = Game.rooms[roomName]
    if(room){
        if(!room.memory.spawnList)room.memory.spawnList = [];
        let list = room.memory.spawnList;
        for(let pre of list){
            if(pre.name == name)return;
        }
        room.memory.spawnList.push({body:body,name:name,opt:opt})
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
            let spawn = this.getFreeSpawn(room.name)
            if(spawn){
                let callback = spawn.spawnCreep(list[0].body,list[0].name,list[0].opt)
                
                if(callback != -6 || isHarvester(list[0]) || 
                    getcost(list[0].body) > spawn.room.energyCapacityAvailable)
                    list.splice(0,1)
            }
        }
        if(Game.time % 23 == 0){
            for(let i in list){
                if(i != 0 && isHarvester(list[i])){
                    [list[0],list[i]] = [list[i],list[0]]
                }
            }
        }
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