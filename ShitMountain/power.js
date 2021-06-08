const ATTACKNAME = "前部正印先锋官"
const HEALNAME = "左翼都护校尉"
const healName2 = "右翼都护校尉"
const CARRYNAME = "户部粮草转运使"


module.exports = {
    run:function(){
        
        for(var flagName in Game.flags){
            var flag = Game.flags[flagName]
            if(flag.color == COLOR_YELLOW && flag.secondaryColor == COLOR_RED){
                runFlag(flag)
            }
        }
    }
}

function runFlag(flag){
    
    const attackername = flag.name + '_' + ATTACKNAME;
    
    autoSpawnCreep(attackername,flag,
        [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,
            MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,ATTACK,
            ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,
            ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,MOVE])
    const healername = flag.name + '_' + HEALNAME;
    autoSpawnCreep(healername,flag,[
        HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,
        HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,
        HEAL,HEAL,HEAL,HEAL,HEAL,MOVE,MOVE,MOVE,MOVE,MOVE,
        MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,
        MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,
    ])
    

    if(flag.memory.needToPickUp){
        var remove = true;
        for(var creep in Game.creeps){
            if(creep.indexOf(flag.name) != -1){
                remove = false;
            }
        }
        if(remove){
            flag.remove()
        }
    }
    
    
    const carryname = flag.name + '_' + CARRYNAME;
    if(flag.memory.needCarryer){
        let amount = flag.memory.amount;
        for(let i = 0;i < amount;i++){
            let creepName = carryname+'_'+i;
            let creep = Game.creeps[creepName]
            if(!creep ){
                if(!flag.memory.needToPickUp){
                    let spawn = getAvaliableSpawn(flag.memory.mainRoom)
                    if(spawn){
                        spawn.spawnCreep([CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,
                            CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,
                            CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,
                            CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,
                            MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,
                            MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE],creepName)
                    }
                }
            }else{
                runCreepCarry(creep,flag)
            }
        }
    }
    


    if(!flag.room)return;
    var pb = flag.pos.lookFor(LOOK_STRUCTURES,{
        filter:(o)=>(o.structureType == STRUCTURE_POWER_BANK)
    })
    if(pb.length){
        pb = pb[0];
        let amount = (pb.power)/1600
        flag.memory.amount = amount;
        if(pb.hits < 380000){
            flag.memory.needCarryer = true;
        }
    }else{
        flag.memory.needToPickUp = true;
    }
            
}
function runCreep(creep,flag){
    if(flag.memory.needToPickUp){
        creep.suicide();
        return;
    }
    switch (creep.name.split('_')[2]){
        case ATTACKNAME:runCreepAttack(creep,flag);break;
        case HEALNAME:runCreepHeal(creep,flag);break;
    }
}

function runCreepAttack(creep,flag){
    if(!creep.pos.isNearTo(flag)){
        if(creep.pos.inRangeTo(flag,5)){
            creep.moveTo(flag,{range:1,ignoreCreeps:false})
        }else{
            creep.moveTo(flag,{range:1,reusePath:100})
        }
    }else{
        var pb = flag.pos.lookFor(LOOK_STRUCTURES,{
            filter:(o)=>(o.structureType == STRUCTURE_POWER_BANK)
        })
        if(pb.length)
        creep.attack(pb[0])
    }
}

function runCreepHeal(creep,flag){
    var attackerName = creep.name.replace(HEALNAME,ATTACKNAME)
    if(creep.room.name != flag.pos.roomName){
        creep.moveTo(flag,{range:1,reusePath:100})
        return;
    }
    var attacker = creep.room.find(FIND_MY_CREEPS,{
        filter:(c)=>(c.name.indexOf(ATTACKNAME)!=-1)
    })
    if(attacker.length)attacker = attacker[0];
    else attacker = null;
    if(attacker){
        if(!creep.pos.inRangeTo(attacker,1)){
            if(creep.pos.inRangeTo(flag,5)){
                creep.moveTo(attacker,{range:1,ignoreCreeps:false});
            }else{
                creep.moveTo(attacker,{range:1});
            }
        }else{
            creep.heal(attacker)
        }
    }
}

function runCreepCarry(creep,flag){
    if(creep.store.power){
        let storage = Game.rooms[flag.memory.mainRoom].storage;
        if(storage){
            creep.moveTo(storage,{range:1})
            if(creep.pos.isNearTo(storage)){
                creep.transfer(storage,RESOURCE_POWER)
                creep.suicide();
            }
        }else{
            console.log(flag.mainRoom,' need storage')
        }
    }else{
        
        if(creep.room.name != flag.pos.roomName){
            creep.moveTo(flag,{range:4,reusePath:100})
            return;
        }
        
        if(flag.memory.needToPickUp){
            let power = creep.room.find(FIND_RUINS,{filter:(o)=>(o.store.power != 0)})
            if(!power.length){
                power = creep.room.find(FIND_DROPPED_RESOURCES,{filter:(o)=>(o.resourceType == RESOURCE_POWER)})
            }
            if(power.length){
                power = power[0]
                if(creep.pos.isNearTo(power)){
                    creep.withdraw(power,RESOURCE_POWER)
                    creep.pickup(power)
                }else{
                    creep.moveTo(power,{range:1})
                }
            }
        }else{
            creep.moveTo(flag,{ignoreCreeps:false,range:3})  
        }
    }
}

function autoSpawnCreep(creepName,flag,body){
    var needToSpawnName = null;
    
    var creep0 = Game.creeps[creepName +'_0']
    var creep1 = Game.creeps[creepName +'_1']
    const dyingTick = 350

    if(!creep0 && !creep1){
        needToSpawnName = creepName + '_1'
    }
    if(creep0){
        runCreep(creep0,flag)
        if(!creep1 & creep0.ticksToLive <= dyingTick){
            needToSpawnName = creepName + '_1';
        }
    }
    if(creep1){
        runCreep(creep1,flag)
        if(!creep0 & creep1.ticksToLive <= dyingTick){
            needToSpawnName = creepName + '_0';
        }
    }
    if(flag.memory.needToPickUp == true){
        needToSpawnName = null;
    }
    if(needToSpawnName){
        var spawn = getAvaliableSpawn(flag.memory.mainRoom)
        
        if(spawn){
            spawn.spawnCreep(body,needToSpawnName)
        }
    }
}

function getAvaliableSpawn(roomName){
    for (var spawnName in Game.spawns){
        var spawn = Game.spawns[spawnName]
        if(spawn.room.name == roomName && spawn.spawning == null){
            return spawn
        }
    }
    return null;
}