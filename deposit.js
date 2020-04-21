
module.exports = {
    run:function(flagName,roomName,roomNeedToArrive){
        var dyingTick =500;
        var flag = Game.flags[flagName]
        if(flag.memory.dyingTick){
            dyingTick = flag.memory.dyingTick
        }
        var room = Game.rooms[roomName];
        var creep = Game.creeps[flag.name]
        if(!creep){
            var spawn = getAvaliableSpawn(roomName)
            var baseBody = [WORK,WORK,CARRY,MOVE,MOVE,MOVE,],baseCost = 400
            var body = [],cost = 0
            while(cost + baseCost < room.energyCapacityAvailable && body.length + baseBody.length <= 50){
                cost += baseCost
                body = body.concat(baseBody)
            }
            if(spawn)
                spawn.spawnCreep(body,flag.name,{memory:{harvesting:false}})
            return
        }
        runCreep(creep,flag,room,dyingTick,roomNeedToArrive)
    },
    ctrl:function(){
        for(var flagName in Game.flags){
            var flag = Game.flags[flagName]
            //console.log(flag.color , flag.secondaryColor == COLOR_BLUE)
            if(flag.color == COLOR_YELLOW && flag.secondaryColor == COLOR_BLUE){
                runFlag(flag)
                //flag.remove()
            }
        }
    }
};

function runFlag(flag){
  //console.log(flag)
    var dyingTick = flag.memory.dyingTick;
    if(!dyingTick)dyingTick = 500;
    const roomName = flag.memory.mainRoom
    const roomNeedToArrive = flag.memory.midRoom
    if(!roomName){flag.remove()
                 return}
                 
    var room = Game.rooms[roomName];
    var creep = Game.creeps[flag.name]
    if(!creep){
        var spawn = getAvaliableSpawn(roomName)
        var baseBody = [WORK,WORK,CARRY,MOVE,MOVE,MOVE,],baseCost = 400
        var body = [],cost = 0
        while(cost + baseCost < room.energyCapacityAvailable && body.length + baseBody.length <= 50){
            cost += baseCost
            body = body.concat(baseBody)
        }
        if(spawn)
            spawn.spawnCreep(body,flag.name,{memory:{harvesting:false}})
        return
    }
    runCreep(creep,flag,room,dyingTick,roomNeedToArrive)
}

function runCreep(creep,flag,room,dyingTick,roomNeedToArrive){
    creep.notifyWhenAttacked(false);
    if(creep.memory.harvesting == true){
        if(_.sum(creep.store) == creep.store.getCapacity('energy')){
            creep.memory.harvesting = false;
        }
    }else{
        if(_.sum(creep.store) == 0){
            creep.memory.harvesting = true;
        }
    }
    
    if(creep.ticksToLive < dyingTick)creep.memory.harvesting = false;
    if(creep.ticksToLive < dyingTick && _.sum(creep.store) == 0){
        if(flag.memory.shouldRemoved == true){
            flag.remove();
        }
        creep.suicide();
        return;
    }
    
    if(creep.memory.harvesting){
        if(creep.pos.isNearTo(flag)){
            dyingTick = Math.min(1500 - creep.ticksToLive+50,dyingTick);
            flag.memory.dyingTick = dyingTick;
            var resource = Game.getObjectById(flag.memory.resource);
            if(!resource || !resource.pos.isEqualTo(flag.pos)){
                resource = flag.pos.lookFor(LOOK_DEPOSITS)[0]
                if(resource)
                    flag.memory.resource = resource.id
                else{
                    flag.remove();
                } 
            }
            if(resource && resource.cooldown == 0){
                creep.harvest(resource)
                creep.memory[roomNeedToArrive] = false;
            }
        }else{
            //if(flag.name == 'SL4')console.log(roomNeedToArrive)
            if(roomNeedToArrive && creep.memory[roomNeedToArrive] != true){
                if(creep.pos.roomName == roomNeedToArrive){
                    creep.memory[roomNeedToArrive] = true;
                }else{
                    creep.moveTo(new RoomPosition(25,25,roomNeedToArrive),{reusePath:500})
                }
            }else{
                if(creep.pos.inRangeTo(flag,5)){
                    creep.moveTo(flag,{ignoreCreeps:false})
                }else{
                    creep.moveTo(flag,{reusePath:500})
                }
            }
        }
    }else{
        var target = room.storage;
        if(!room.storage  || room.storage.store.getFreeCapacity() == 0){
            target = room.terminal;
        }
        if(roomNeedToArrive && creep.memory[roomNeedToArrive] != true){
            if(creep.pos.roomName == roomNeedToArrive){
                creep.memory[roomNeedToArrive] = true;
            }else{
                creep.moveTo(new RoomPosition(25,25,roomNeedToArrive))
            }
        }else{
            creep.moveTo(target,{reusePath:500})
        }
        if(creep.pos.isNearTo(target)){
            creep.memory[roomNeedToArrive] = false
            
            for(var type in creep.store)
                if(creep.transfer(target,type) == OK){
                    Memory.SL += creep.store[type]
                }
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