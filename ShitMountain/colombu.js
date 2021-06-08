var flag;
const midroomName = 'E42N40',midroomName2 = 'E47N40'
const spawnRoom = 'E42N38'
module.exports = {
    run:function(flagName){
        //new RoomPosition(14,21,'E47N39').createConstructionSite(STRUCTURE_SPAWN)
        flag = Game.flags[flagName]
        if(!flag.memory.state){
            flag.memory.state = 'prepare'
        }
        if(Game.time % 17 == 0 && flag.memory.state == 'prepare' && Game.rooms[flag.pos.roomName]){
            const containers = flag.pos.findInRange(FIND_STRUCTURES,1,{filter:(o)=>(
                o.structureType == STRUCTURE_CONTAINER && o.store.energy == 2000)})
            if(containers.length == 5){
                //flag.memory.state = 'ready'

            }
        }
        if(Game.time % 17 == 0 && flag.memory.state == 'ready' && Game.rooms[flag.pos.roomName]){
            if(Game.rooms[flag.pos.roomName].controller.my && Game.creeps[flag.name] && Game.creeps[flag.name + 'B']){
                flag.memory.state = 'build'
            }
        }
        if(flag.memory.state == 'prepare'){
            var creep = Game.creeps[flagName]
            //console.log(creep.pos)
            if(!creep){
                autoSpawnCreep(spawnRoom,[WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,MOVE,MOVE,MOVE],flagName)
                return;
            }
            if(creep.memory.mid != true){
                creep.moveTo(new RoomPosition(25,25,midroomName))
                if(creep.pos.roomName == midroomName){
                    creep.memory.mid = true;
                }
            }else if(creep.memory.mid2 != true){
                creep.moveTo(new RoomPosition(25,25,midroomName2))
                if(creep.pos.roomName == midroomName2){
                    creep.memory.mid2 = true;
                }
            }else{
                if(!creep.pos.isEqualTo(flag)){
                    creep.moveTo(flag)
                    return;
                }
                harvester(creep)
            }
        }

        if(flag.memory.state == 'ready'){
            var claimer = Game.creeps.CLAIM;
            if(!claimer){
                if(Game.creeps[flag.name]){
                    Game.creeps[flag.name].suicide();
                }
                autoSpawnCreep(spawnRoom,[CLAIM,MOVE,MOVE],'CLAIM')
                return;
            }
            claimerRun(claimer)
        }

    }
}
function claimerRun(creep){
    if(creep.memory.mid != true){
        creep.moveTo(new RoomPosition(25,25,midroomName))
        if(creep.pos.roomName == midroomName){
            creep.memory.mid = true;
        }
    }else if(creep.memory.mid2 != true){
        creep.moveTo(new RoomPosition(25,25,midroomName2))
        if(creep.pos.roomName == midroomName2){
            creep.memory.mid2 = true;
        }
    }else{
        if(!creep.pos.name == flag.pos.roomName){
            creep.moveTo(flag)
            return;
        }
        creep.moveTo(creep.room.controller)
        if(creep.pos.isNearTo(creep.room.controller)){
            creep.claimController(creep.room.controller)
        }
    }
}
function harvester(creep){
    if(creep.store.getFreeCapacity() == 0){
        const constructionSites = flag.pos.findInRange(FIND_CONSTRUCTION_SITES,1)
        if(constructionSites.length){
            creep.build(constructionSites[0])
        }else{
            const containers = flag.pos.findInRange(FIND_STRUCTURES,1,{filter:(o)=>(
                o.structureType == STRUCTURE_CONTAINER && o.store.energy < 2000)})
            if(containers){
                creep.transfer(RESOURCE_ENERGY,containers[0])
            }
        }
    }else{
        var source = Game.getObjectById(flag.memory.source);
        if(source){
            if(source.energy > 0){
                creep.harvest(source)
            }
        }else{
            source = flag.pos.findInRange(FIND_SOURCES,1)[0]
            flag.memory.source = source.id;
        }
    }
}

function autoSpawnCreep(roomName,body,creepName){
    var spawn = getAvaliableSpawn(roomName)
    console.log(spawn)
    if(spawn){
        spawn.spawnCreep(body,creepName)
    }
}
function getAvaliableSpawn(room){
    for (var spawnname in Game.spawns){
        var spawn = Game.spawns[spawnname]
        if(spawn.room.name == room && spawn.spawning == null){
            return spawn
        }
    }
    return null;
}