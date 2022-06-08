var CostMatrix = {}; 
let spawnCtrl = require("./spawnCtrl")
var enemy;

module.exports = {
    run:function(){
        //updateCostMatrix('W1N2')
        Game.myrooms.forEach(room => {
            if(room.storage){
                enemy = room.storage.pos.findClosestByRange(FIND_HOSTILE_CREEPS,{
                    filter: function(object) {
                        return (object.owner.username != 'Invader' || object.ticksToLive < 1450) && object.body.length > 1
                        //return true;
                    }
                })
                if(enemy){
                    roomRun(room)
                    room.memory.war = true
                    // let room_name = room.name
                    // if(!Memory.cache.rooms[room_name]) 
                    //         Memory.cache.rooms[room_name]={}
                    // if(!Memory.cache.rooms[room_name].atkd_wall){
                        
                    //     // "Memory.cache.rooms[rom].atkd_wall" 存缓被打的墙
                    //     console.log('还没打墙！')
                    //     let eventLog = Game.rooms[room_name].getEventLog();
                    //     let attackEvents = _.filter(eventLog, {event: EVENT_ATTACK});
                    //     console.log(JSON.stringify(attackEvents))
                    //     attackEvents.forEach(event => {
                    //         let obj = Game.getObjectById(event.data.targetId)
                    //         if(obj&&obj.structureType
                    //             &&(obj.structureType==STRUCTURE_RAMPART||obj.structureType==STRUCTURE_WALL)){
                    //                 Memory.cache.rooms[room_name].atkd_wall=event.data.targetId
                    //                 console.log(obj.pos.x+'  '+obj.pos.y+'  的'+obj.structureType+'被打了！')
                    //             }
                    //     });
                    // }
                }
            }
        });

    }
}

function body(opt){
    var ans = [];
    for(var type in opt){
        for(var i=0;i<opt[type];i++){
            ans.push(type)
        }
    }
    return ans;
}
/**
 * 
 * @param {Room} room 
 * @param {*} attackerName 
 * @returns 
 */
function runAttack(room,attackerName){
    var attacker = Game.creeps[attackerName]
    if(!attacker){
        
        let body = spawnCtrl.getbody([],[ATTACK,ATTACK,ATTACK,ATTACK,MOVE,],room.energyCapacityAvailable)
        // console.log(body)
        spawnCtrl.addSpawnList(room.name,body,attackerName,{},)
        
        return;
    }
    
    if(attacker.pos.isNearTo(enemy)){
        attacker.attack(enemy)
    }else{
        let creep = attacker
        let path = creep.room.findPath(creep.pos, enemy.pos, {
            costCallback: function(roomName, costMatrix) {
                return CostMatrix[roomName]
                //return PathFinder.CostMatrix.deserialize(CostMatrix[roomName])
            },
            range:1
        });
        if(path.length){
            creep.move(path[0].direction)
        }
    }
}

function roomRun(room){
    if(!CostMatrix[room.name]){
        updateCostMatrix(room.name)
    }
    for(var i=0;i<=4;i++){
        const attackerName = room.name + '_attack_'+i;
        runAttack(room,attackerName)
    }
    

    const raAttackerName = room.name + '_raAttack'
    var raAttacker = Game.creeps[raAttackerName]
    if(!raAttacker){
        let body = spawnCtrl.getbody([],[RANGED_ATTACK,RANGED_ATTACK,RANGED_ATTACK,RANGED_ATTACK,MOVE,])
        spawnCtrl.addSpawnList(room.name,body,raAttackerName,{},)
        return;
    }
    
    if(raAttacker.pos.inRangeTo(enemy,3)){
        raAttacker.rangedAttack(enemy)
    }else{
        let creep = raAttacker
        let path = creep.room.findPath(creep.pos, enemy.pos, {
            costCallback: function(roomName, costMatrix) {
                return CostMatrix[roomName]
                //return PathFinder.CostMatrix.deserialize(CostMatrix[roomName])
            },
            range:3
        });
        if(path.length){
            creep.move(path[0].direction)
        }
    }
}

//找到可以该房间内空闲的spawn
function getAvaliableSpawn(roomName){
    for (var spawnName in Game.spawns){
        var spawn = Game.spawns[spawnName]
        if(spawn.room.name == roomName && spawn.spawning == null){
            return spawn
        }
    }
    return null;
}
var terrain 

function updateCostMatrix(roomName){
    //CostMatrix[roomName] = bfs(Game.rooms[roomName].storage.pos).serialize();
    //1、初始化所有值为自然状态下的值
    CostMatrix[roomName] = null;
    Game.rooms[roomName].findPath(new RoomPosition(25,24,roomName),new RoomPosition(25,26,roomName),{
        costCallback: function(roomName,costMatrix){
            CostMatrix[roomName] = costMatrix;
        }
    })
    terrain = Game.map.getRoomTerrain(roomName)
    for(var x=0;x<50;x++){
        for(var y=0;y<50;y++){
            if(CostMatrix[roomName].get(x,y) == 0){
                if(terrain.get(x,y) == 1){
                    CostMatrix[roomName].set(x,y,255)
                }else if(terrain.get(x,y) == 2){
                    CostMatrix[roomName].set(x,y,10)
                }
            }
        }
    }

    //2、从出口往里，除了rampart其他地方都是255
    
    for(var x=0;x<50;x++){
        if(CostMatrix[roomName].get(x,0) == 0){
            outBfs(new RoomPosition(x,0,roomName))
        }
        if(CostMatrix[roomName].get(x,49) == 0){
            outBfs(new RoomPosition(x,49,roomName))
        }
        if(CostMatrix[roomName].get(49,x) == 0){
            outBfs(new RoomPosition(49,x,roomName))
        }
        if(CostMatrix[roomName].get(0,x) == 0){
            outBfs(new RoomPosition(0,x,roomName))
        }
    }

    for(var x=0;x<50;x++){
        for(var y=0;y<50;y++){
            let pos = new RoomPosition(x,y,roomName);
            new RoomVisual(pos.roomName).text(CostMatrix[roomName].get(pos.x,pos.y),pos.x,pos.y)
        }
    }

}

function outBfs(startPos){
    let positions = [startPos];
    while(positions.length){
        let pos = positions[0];
        positions.splice(0,1)

        CostMatrix[pos.roomName].set(pos.x,pos.y,255)
        for(var nx=-1;nx<=1;nx++)
        for(var ny=-1;ny<=1;ny++){
            const x = pos.x + nx
            const y = pos.y + ny
            if(!(x>=0 && x < 50 && y >= 0 && y < 50))continue;//保证在范围内
            if(CostMatrix[startPos.roomName].get(x,y) == 255)continue;

            let npos = new RoomPosition(x,y,startPos.roomName)
            //console.log(npos)
            if(npos.lookFor(LOOK_STRUCTURES).filter((o)=>(o.structureType == STRUCTURE_RAMPART)).length)continue;
            CostMatrix[pos.roomName].set(x,y,255)
            positions.push(npos);
        }
    }
}
