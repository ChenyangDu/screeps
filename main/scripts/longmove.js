let eye = require("eye")

module.exports = {
    /**
     * @param {Creep} creep 
     * @param {RoomPosition} target 
     */
    longMoveTo(creep,target,){
        if(!(target instanceof RoomPosition)){
            target = target.pos
        }
        if(!(target instanceof RoomPosition)){
            return;
        }
        
        if(!creep.memory.longmove)creep.memory.longmove = {}
        let memory = creep.memory.longmove
        
        if(!memory.target || !target || !target.isEqualTo(new RoomPosition(
            memory.target.x,memory.target.y,memory.target.roomName
        ))){ // 目标没变就继续执行
            
            creep.moveByPath(search(creep,target))
        }
        if(memory.path && creep.fatigue == 0){
            // console.log('move',creep)
            // console.log(decodePath(memory.path))
            if(decodePath(memory.path).length == 0){
                creep.moveByPath(search(creep,target))
            }else if(creep.moveByPath(decodePath(memory.path)) == ERR_NOT_FOUND){
                creep.moveByPath(search(creep,target))
            }
            
            if(creep.ticksToLive % 5 == 0 && creep.room.find(FIND_HOSTILE_CREEPS).length>0){
                
                creep.moveByPath(search(creep,target))
            }
        }
    }
}

function search(creep,target){

    // 使用`findRoute`计算路径的高阶计划，优先选择大路和自有房间
    let allowedRooms = { [ creep.room.name ]: true };
    let res = Game.map.findRoute(creep.room.name, target.roomName, {
        routeCallback(roomName) {
            if(eye.isfree(roomName) === false){
                return Infinity
            }
            return 1
        }
    })
    if(res.length){
        res.forEach(function(info) {
            allowedRooms[info.room] = true;
        });
    }


    let ret = PathFinder.search(creep.pos,target,{
        plainCost: 2,
        swampCost: 10,

        roomCallback(roomName){
            if (allowedRooms[roomName] === undefined) {
                return false;
            }
            let room = Game.rooms[roomName];
            // 在这个示例中，`room` 始终存在
            // 但是由于 PathFinder 支持跨多房间检索
            // 所以你要更加小心！
            if (!room) return;
            let costs = new PathFinder.CostMatrix;

            room.find(FIND_STRUCTURES).forEach(function(struct) {
                if (struct.structureType === STRUCTURE_ROAD) {
                    // 相对于平原，寻路时将更倾向于道路
                    costs.set(struct.pos.x, struct.pos.y, 1);
                } else if (struct.structureType !== STRUCTURE_CONTAINER &&
                            (struct.structureType !== STRUCTURE_RAMPART ||
                            !struct.my)) {
                    // 不能穿过无法行走的建筑
                    costs.set(struct.pos.x, struct.pos.y, 0xff);
                }
            });
            // 躲避房间中的 creep
            room.find(FIND_HOSTILE_CREEPS).forEach(function(creep) {
                costs.set(creep.pos.x, creep.pos.y, 0xff);
            });
            return costs
        },
        maxOps:30000
    })
    let memory = creep.memory.longmove
    memory.path = encodePath(ret.path)
    memory.target = target
    return ret.path
}

function encodePath(path){
    let lastRoomName = null;
    let res = []
    for(let pos of path){
        if(pos.roomName == lastRoomName){
            let last = _.last(res)
            last.array.push(pos)
        }else{
            res.push({
                roomName:pos.roomName,
                array:[pos],
            })
            lastRoomName = pos.roomName
        }
    }
    for(let re of res){
        for(let i=0;i<re.array.length;i++){
            let pos = re.array[i]
            if(i==0){
                re.code = String.fromCharCode(pos.x*50+pos.y)
            }else{
                re.code += re.array[i-1].getDirectionTo(pos)
            }
        }
        delete re.array
    }
    return res
}

function decodePath(res,roomName=null){
    let path = []
    const dir = [null,[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1]]
    for(let re of res){
        for(let i=0;i<re.code.length;i++){
            if(roomName && re.roomName != roomName)continue; // 只解析特定房间的路径
            if(i==0){
                let num = re.code.charCodeAt(0)
                let pos = new RoomPosition(Math.floor(num/50),num%50,re.roomName)
                path.push(pos)
            }else{
                let lastpos = _.last(path)
                let direction = parseInt(re.code[i])
                let pos = new RoomPosition(
                    lastpos.x + dir[direction][0],
                    lastpos.y + dir[direction][1],
                    re.roomName
                )
                path.push(pos)
            }
        }
    }
    return path
}