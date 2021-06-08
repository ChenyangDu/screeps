var roleHarvester = {
    /** @param {Creep} creep **/
    getEnergy:function(creep){
        var harvestTarget = null;
        
        
        if(!harvestTarget)
            harvestTarget = Game.getObjectById(creep.memory.harvestTarget);
        if(!canBeHarvestd(creep,harvestTarget))harvestTarget = null;

        if(!harvestTarget){
            let tStorage = creep.room.tStorage();
            var container = creep.pos.findClosestByPath(FIND_STRUCTURES,{
                filter:(struct) => {
                    if(creep.memory.role == 'harvester' || creep.memory.role == 'Nharvester'){
                        if(tStorage && struct.id == tStorage.id)return false;
                    }
                    return (struct.structureType == STRUCTURE_CONTAINER && struct.store[RESOURCE_ENERGY] >= Math.min(400, creep.carryCapacity)) ||
                    (struct.structureType == STRUCTURE_LINK && Memory.inputLinks[creep.room.name][struct.id] == false && struct.energy >= Math.min(400, creep.carryCapacity))
                    //&& struct.id != tStorage.id
                }
            })
            harvestTarget = container;
        }
        
        let resource = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES,{
            filter:(o)=>(o.resourceType == RESOURCE_ENERGY)
        });
        if(resource){
            if(!harvestTarget){
                harvestTarget = resource;
            }else{
                let path_hT = PathFinder.search(creep.pos,harvestTarget)
                let path_resource = PathFinder.search(creep.pos,resource)
                if(path_hT.cost > path_resource.cost){
                    harvestTarget = resource;
                }
            }
        }
        if(!harvestTarget && creep.room.controller && creep.room.controller.level == 8 && creep.room.terminal &&
            creep.room.terminal.store[RESOURCE_ENERGY] >= 75000){
                harvestTarget = creep.room.terminal;
            }
        
        var storage = creep.room.storage;
        if(!harvestTarget &&storage&& storage.store[RESOURCE_ENERGY]>=200)harvestTarget = storage;
        
        if(!harvestTarget && creep.room.controller && creep.room.controller.level < 8 && creep.room.terminal &&
            creep.room.terminal.store[RESOURCE_ENERGY] >= creep.carryCapacity){
                harvestTarget = creep.room.terminal;
            }
        
        
        if(harvestTarget){
            creep.memory.harvestTarget = harvestTarget.id;
            if(creep.pos.isNearTo(harvestTarget)){
                if(creep.withdraw(harvestTarget,RESOURCE_ENERGY) == OK){
                    creep.memory.harvestTarget = null;
                }else{
                    creep.pickup(harvestTarget)
                }
            }else if(creep.pos.inRangeTo(harvestTarget,3)){
                creep.moveTo(harvestTarget,{range:1,ignoreCreeps:false})
            }else{
                creep.moveTo(harvestTarget,{range:1});
            }
        }else{
            var source = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
            if(source){
                if(creep.pos.isNearTo(source)){
                    creep.harvest(source)
                }else{
                    if(creep.pos.inRangeTo(source,3)){
                        creep.moveTo(source,{ignoreCreeps:false})
                    }else{
                        creep.moveTo(source);
                    }
                }
            }
        }
        
        const target = creep.pos.lookFor(LOOK_RESOURCES);
        if(target[0]) {
            creep.pickup(target[0]) 
        }
        const tomb = creep.pos.lookFor(LOOK_TOMBSTONES);
        if(tomb[0]){
            creep.withdraw(tomb[0],RESOURCE_ENERGY)
        }
    },
    run: function(creep) {
        
        creep.say('har')
        if(creep.memory.srole == 'tStorage'){
            creep.say('ss')
        }
        if(creep.memory.harvesting && _.sum(creep.carry) >= creep.carryCapacity*0.9){
            creep.memory.harvesting = false;
        }
        if(!creep.memory.harvesting && creep.carry.energy == 0){
            creep.memory.harvesting = true;
        }
	    if(creep.memory.harvesting) {
            this.getEnergy(creep)
        }
        else {

            if(creep.ticksToLive % 3 == 0){
                let creeps = creep.pos.findInRange(FIND_MY_CREEPS,1,{
                    filter:(o)=>(o.memory.role == creep.memory.role && o.memory.transferTarget == creep.transferTarget
                        && o.store.energy > creep.store.energy && o.store.getFreeCapacity('energy') >= creep.store.energy)
                })
                if(creeps.length){
                    creep.transfer(creeps[0],'energy')
                }
            }

            var transferTarget = null;

            if(!transferTarget)transferTarget = Game.getObjectById(creep.memory.transferTarget);
            if(transferTarget && !transferTarget.store.getFreeCapacity('energy')){
                transferTarget = null;
            }

            let tStorage = creep.room.tStorage();

            if(!transferTarget && creep.memory.srole == 'tStorage'){
                
                if(tStorage)
                transferTarget = tStorage;
            }
            if(!transferTarget){
                transferTarget = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                        filter: (structure) => {
                            return (structure.structureType == STRUCTURE_CONTAINER ||
                                structure.structureType == STRUCTURE_EXTENSION || 
                                structure.structureType == STRUCTURE_LAB || 
                                //structure.structureType == STRUCTURE_NUKER || 
                                (structure.structureType == STRUCTURE_POWER_SPAWN && structure.energy <= 4500) || 
                                (structure.structureType == STRUCTURE_TOWER && 
                                    (structure.energy < 700 || (structure.energy<=900 && creep.room.energyAvailable >= 0.9*creep.room.energyCapacityAvailable))) || 
                                (structure.structureType == STRUCTURE_SPAWN )
                                )&&
                                structure.energy < structure.energyCapacity;
                        }
                });
            }
            
            if(!transferTarget || (creep.memory.srole == 'tStorage' && tStorage && transferTarget.id == tStorage.id)){
                let other = creep.pos.findInRange(FIND_MY_CREEPS,1,{
                    filter:function(o){
                        if(o.store.energy)return false;
                        if(o.memory.role == 'Nbuilder' || o.memory.role == 'Nupgrader')return true;
                        return false;
                    }
                })
                if(other.length)transferTarget = other[0];
            }
            if(!transferTarget && creep.room.controller.level == 8 &&
                creep.room.terminal && creep.room.terminal.store[RESOURCE_ENERGY] < 70*1000){
                transferTarget = creep.room.terminal;
            }

            if(!transferTarget && creep.store.getFreeCapacity('energy') == 0){
                let tStorage = creep.room.tStorage();
                if(tStorage && tStorage.store.energy < 2000)
                    transferTarget = tStorage
            }

            if(!transferTarget){
                transferTarget = creep.room.storage
            }
            
            if(!transferTarget){
                creep.moveTo(39,19)
            }

            if(transferTarget){
                creep.memory.transferTarget = transferTarget.id;
            }
            
            if(creep.pos.isNearTo(transferTarget)){
                creep.transfer(transferTarget,RESOURCE_ENERGY)
                creep.memory.transferTarget = null;
            }else{
                creep.moveTo(transferTarget);
            }
            
            if(creep.carry[RESOURCE_ENERGY] != _.sum(creep.carry)){
                let _s = creep.room.storage;
                if(!creep.room.storage.store.getFreeCapacity()){
                    if(creep.room.terminal && creep.room.terminal.store.getFreeCapacity())
                    _s = creep.room.terminal;
                }
                if(_s){
                    for(var resource in creep.carry){
                        creep.transfer(_s,resource)
                    }
                    creep.moveTo(_s,{range:1})
                }
            }
        }
	}
};

module.exports = roleHarvester;

function canBeHarvestd(creep,target){
    var ok = false;
    if(!target)return false;
    switch(target.structureType){
        case STRUCTURE_CONTAINER :
            if(target.store[RESOURCE_ENERGY] >= Math.min(400, creep.carryCapacity))ok = true;
            break;
        case STRUCTURE_LINK:
            if(Memory.inputLinks[target.room.name][target.id] == false && target.energy >= Math.min(400, creep.carryCapacity))
                ok = true;
            break;
        case STRUCTURE_STORAGE:
            if(target.store[RESOURCE_ENERGY] > 0)ok = true;
            break;
        case STRUCTURE_TERMINAL:
            if(target.store[RESOURCE_ENERGY] >= creep.carryCapacity)ok = true;
            break;
    }
    return ok;
}