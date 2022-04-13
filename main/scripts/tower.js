function inCenter(pos){
    return (pos.x < 5 ||pos.x > 45 || pos.y<5||pos.y>45)
}

var Tower = {
    run:function(tower){
        //var tower = Game.getObjectById('5d5777da8309b77a1053c4be');
        //attack
        var enermy = null
        if(!enermy)
            var enermy = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        if(enermy) {
            tower.attack(enermy);
            
        }else{
            //repair
            
            if(tower.energy >= 710){
                const target = tower.pos.findClosestByRange(FIND_MY_CREEPS, {
                    filter: function(object) {
                        return object.hits < object.hitsMax;
                    }
                });
                if(target){
                    tower.heal(target)
                }
                var targets;
                targets = tower.room.find(FIND_STRUCTURES,{
                    filter:(structure) => {
                        if(tower.room.controller.level < 8){
                            return structure.hits < structure.hitsMax && 
                            (structure.structureType != STRUCTURE_WALL)
                        }else{
                            return structure.hits < structure.hitsMax && 
                            (structure.structureType != STRUCTURE_WALL || inCenter(structure.pos))
                        }
                    }
                })
                    
                if(targets.length){
                    targets.sort((a,b) => a.hits - b.hits);
                    if(targets[0].structureType == STRUCTURE_WALL && tower.room.storage && tower.room.storage.store[RESOURCE_ENERGY] <= 600000){
                           targets[0] = null;
                    }
                    if(targets.length && targets[0])
                        tower.repair(targets[0])
                }
            }
            
        }
    }
}

module.exports = {
    run:function(){
        var towers = Memory.towers;
        if(towers == undefined)towers = {}
        
        for(room of Game.myrooms){
            var roomName = room.name
            if(!room.controller || !room.controller.my)continue;
            if(towers[roomName] == undefined){
                towers[roomName] = {}
            }
            if(room.controller && room.controller.my){
                var attackTarget = new RoomPosition(25,25,roomName).findClosestByRange(FIND_HOSTILE_CREEPS,)
                //if(roomName == 'W47N21')attackTarget = null;
                var healTargets = room.find(FIND_MY_CREEPS,{filter:creep=>(creep.hits < creep.hitsMax)})
                var healTarget
                if(healTargets.length){
                    healTargets.sort((a,b)=>(a.hits-b.hits))
                    healTarget = healTargets[0]
                }
                
                if(Game.time % 5 == 0){
                    var reapirTargets = room.find(FIND_STRUCTURES,{
                        filter:(structure) => {
                            if(room.controller.level < 8){
                                return structure.hits < structure.hitsMax - 500 && 
                                structure.hits < 20000 &&
                                (structure.structureType != STRUCTURE_WALL)
                            }else{
                                return structure.hits < structure.hitsMax - 500 && 
                                structure.hits < 20000 &&
                                (structure.structureType != STRUCTURE_WALL || inCenter(structure.pos))
                            }
                        }
                    })
                    reapirTargets.sort((a,b)=>(a.hits - b.hits))
                    reapirTargets.splice(10)
                    for(var i in reapirTargets){
                        reapirTargets[i] = reapirTargets[i].id;
                    }
                    towers[roomName].reapirTargets = reapirTargets
                }
                if(!Memory.towers){
                    Memory.towers = {}
                }
                if(Game.time % 307 == 0 || !Memory.towers[roomName] ||!Memory.towers[roomName].towerIds){
                    var towerIds = room.find(FIND_STRUCTURES,{filter: { structureType: STRUCTURE_TOWER }})
                    for(var i in towerIds){
                        towerIds[i] = towerIds[i].id;
                    };
                    towers[roomName].towerIds = towerIds
                }
                if(!Memory.towers[roomName]){
                    continue;
                }

                Memory.towers[roomName].towerIds.forEach(towerId => {
                    var tower = Game.getObjectById(towerId)
                    if(tower){
                        var canRepair = true;
                        if(attackTarget){
                            canRepair = false
                            tower.attack(attackTarget)
                        }
                        if(healTarget){
                            canRepair = false;
                            tower.heal(healTarget)
                        }
                        if(canRepair){
                            for(var repairid of towers[roomName].reapirTargets){
                                const reapirTarget = Game.getObjectById(repairid)
                                if(reapirTarget && tower.store[RESOURCE_ENERGY] >= 710 && reapirTarget.hits < reapirTarget.hitsMax-500){
                                    //console.log(tower)
                                    if(reapirTarget.structureType == STRUCTURE_WALL){
                                        //break;
                                    }
                                    if(!(reapirTarget.structureType == STRUCTURE_WALL/* && room.storage && room.storage.store[RESOURCE_ENERGY] <= 600*1000*/)){
                                        tower.repair(reapirTarget)
                                        break;
                                    }
                                }
                            }
                        }
                    }
                });

            }
        }
        Memory.towers = towers;
    }
}