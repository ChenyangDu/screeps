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
        if(!harvestTarget && creep.room.controller.level == 8 && creep.room.terminal &&
            creep.room.terminal.store[RESOURCE_ENERGY] >= 75000){
                harvestTarget = creep.room.terminal;
            }
        
        var storage = creep.room.storage;
        if(!harvestTarget &&storage&& storage.store[RESOURCE_ENERGY]>=200)harvestTarget = storage;
        
        if(!harvestTarget && creep.room.controller.level < 8 && creep.room.terminal &&
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
        if(tomb){
            creep.withdraw(tomb,RESOURCE_ENERGY)
        }
    },
    run: function(creep) {
        if(creep.room.energyAvailable == creep.room.energyCapacityAvailable){
            creep.say('zzz')
            //return;
        }
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
            var targets2 = null;
            let tStorage = creep.room.tStorage();

            if(!targets2 && creep.memory.srole == 'tStorage'){
                
                if(tStorage && tStorage.store.energy <= 1500)
                targets2 = tStorage;
            }
            if(!targets2){
                targets2 = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                        filter: (structure) => {
                            return (structure.structureType == STRUCTURE_CONTAINER ||
                                structure.structureType == STRUCTURE_EXTENSION || 
                                structure.structureType == STRUCTURE_LAB || 
                                //structure.structureType == STRUCTURE_NUKER || 
                                (structure.structureType == STRUCTURE_POWER_SPAWN && structure.energy <= 4500) || 
                                (structure.structureType == STRUCTURE_TOWER && 
                                    (structure.energy < 700 || (structure.energy<=900 && creep.room.energyAvailable >= 0.9*creep.room.energyCapacityAvailable))) || 
                                structure.structureType == STRUCTURE_SPAWN 
                                )&&
                                structure.energy < structure.energyCapacity;
                        }
                });
            }
            
            if(!targets2 || (creep.memory.srole == 'tStorage' && tStorage && targets2.id == tStorage.id)){
                let other = creep.pos.findInRange(FIND_MY_CREEPS,1,{
                    filter:function(o){
                        if(o.store.energy)return false;
                        if(o.memory.role == 'Nbuilder' || o.memory.role == 'Nupgrader')return true;
                        return false;
                    }
                })
                if(other.length)targets2 = other[0];
            }
            if(!targets2 && creep.room.controller.level == 8 &&
                creep.room.terminal && creep.room.terminal.store[RESOURCE_ENERGY] < 70*1000){
                targets2 = creep.room.terminal;
            }

            if(!targets2){
                let tStorage = creep.room.tStorage();
                if(tStorage && tStorage.store.energy < 1500)
                    targets2 = tStorage
            }

            if(!targets2){
                targets2 = creep.room.storage
            }
            
            if(!targets2){
                creep.moveTo(39,19)
            }
            
            if(creep.pos.isNearTo(targets2)){
                creep.transfer(targets2,RESOURCE_ENERGY)
            }else{
                creep.moveTo(targets2);
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