function spawnCreep(roomName,body,name,opt){
    const spawn = getAvaliableSpawn(roomName)
    if(spawn){
        if(opt)
            spawn.spawnCreep(body,name,opt)
        else{
            spawn.spawnCreep(body,name)
        }
    }
}

function flagRun(flag){
    var creeps = [];
    for(var i = 0;i < flag.secondaryColor;i++){
        var creepName = flag.name + '_' + i;
        if(!Game.creeps[creepName]){
            var body = [TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,
                HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,
                MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,]
            //body = [MOVE,HEAL,MOVE,HEAL,MOVE,HEAL,MOVE,HEAL,]
            spawnCreep(flag.name.split('_')[0],body,creepName)
            return;
        }else{
            creeps.push(Game.creeps[creepName])
        }
    }
    var all_renewed = true;
    for(var creep of creeps){
        if(creep.ticksToLive < 1450 && creep.memory.renewed != true){
            var spawn = getAvaliableSpawn(creep.room.name)
            if(spawn){
                if(creep.pos.isNearTo(spawn)){
                    spawn.renewCreep(creep)
                }else{
                    creep.moveTo(spawn);
                }
            }

            all_renewed = false;
        }
        if(creep.ticksToLive >= 1450){
            creep.memory.renewed = true
        }
    }
    if(!all_renewed)return;
    //console.log('all renewed')

    var all_boosted = true;
    const boostFlag = Game.flags[flag.name.split('_')[0] + '_boost']
    if(!boostFlag){
        console.log('哪boost啊？？？')
        return;
    }
    for(var creep of creeps){
        if(creep.memory.boosted != true){
            if(creep.pos.isEqualTo(boostFlag)){
                var labs = creep.room.find(FIND_STRUCTURES,{filter: { structureType: STRUCTURE_LAB }})
                //console.log(labs)
                if(labs.length){
                    labs.forEach(lab => {
                        if(lab.mineralType != 'XZHO2')
                            lab.boostCreep(creep)
                    });
                }
                creep.memory.boosted = true;
            }else{
                creep.moveTo(boostFlag)
            }
            all_boosted = false;
        }
    }
    if(!all_boosted)return;
    //console.log('all boosted')
    //console.log(creeps)
    for(var creep of creeps){//console.log(creep)
        var targets = creep.pos.findInRange(FIND_MY_CREEPS,3,{filter:(c)=>(c.hits < c.hitsMax) })
        //console.log(targets)
        if(targets.length){
            targets.sort((a,b)=>(b.hitsMax - b.hits - a.hitsMax + a.hits))
            creep.heal(targets[0])
        }else{
            creep.heal(creep)
        }
    }

    const head = creeps[0];

    var all_near = true;
    for(var i = 1;i<creeps.length;i++){
        var creep = creeps[i];
        creep.moveTo(head,{ignoreCreeps:false})
        if(creep.room.name == head.room.name){
            if(!creep.pos.inRangeTo(head.pos,1)){
                all_near = false;
            }
        }
    }

    if(all_near){
        head.moveTo(flag,{visualizePathStyle: {stroke: '#ffffff'}});
    }
    
}
module.exports = {
    run:function(){
        for(var flagName in Game.flags){
            var flag = Game.flags[flagName]
            if(flag.color == COLOR_GREEN){
                flagRun(flag)
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

function isboard(pos){
    return (pos.x == 0 || pos.y == 0 || pos.x == 49 || pos.y == 49)
}