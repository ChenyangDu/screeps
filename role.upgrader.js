var roleUpgrader = {

    /** @param {Creep} creep **/
    run: function(creep) {

        if(creep.memory.upgrading && creep.carry.energy == 0) {
            creep.memory.upgrading = false;
	    }
	    if(!creep.memory.upgrading && creep.carry.energy >= 0.8*creep.carryCapacity) {
	        creep.memory.upgrading = true;
	    }

	    if(creep.memory.upgrading) {
            let RANGE = 3;
            if(Game.shard.name == 'shard2')RANGE = 2;
            if(creep.pos.getRangeTo(creep.room.controller.pos) > 5){
                creep.moveTo(creep.room.controller,{range:RANGE})
            }else if (creep.pos.getRangeTo(creep.room.controller.pos) > RANGE){
                creep.moveTo(creep.room.controller,{range:RANGE,ignoreCreeps:false})
            }
            if(creep.pos.getRangeTo(creep.room.controller.pos) <= 3){
                creep.upgradeController(creep.room.controller)
            }
            var container = creep.pos.lookFor(LOOK_STRUCTURES)
            if(container.length && container[0].structureType == STRUCTURE_CONTAINER){
                creep.move(Game.time % 8 +1)
            }
            /*
            if(creep.room.controller.level == 7){
                if(!creep.pos.isNearTo(creep.room.terminal)){
                    creep.moveTo(creep.room.terminal,{ignoreCreeps:false})
                }
            }*/
        }
        else {
                var harvestTarget = Game.getObjectById(creep.memory.harvestTarget);
                if(!canBeHarvestd(creep,harvestTarget))harvestTarget = null;
    
                var container = harvestTarget;
                
                if(!container) container = creep.pos.findClosestByPath(FIND_STRUCTURES,{
                    filter:(struct) => {
                        return (struct.structureType == STRUCTURE_CONTAINER && struct.store[RESOURCE_ENERGY] >= creep.carryCapacity) ||
                        (struct.structureType == STRUCTURE_LINK && Memory.inputLinks[creep.room.name][struct.id] == false && struct.energy >= creep.carryCapacity/2) ||
                        (struct.structureType == STRUCTURE_STORAGE && struct.store[RESOURCE_ENERGY] >= creep.carryCapacity) ||
                        (struct.structureType == STRUCTURE_TERMINAL && creep.room.controller.level < 8 && 
                            struct.store[RESOURCE_ENERGY] >= creep.carryCapacity)
                    }
                })
                
                
                if(!container){
                    var flag;
                    for(var flName in Game.flags){
                        var fl = Game.flags[flName]
                        if(fl.color == COLOR_YELLOW && fl.secondaryColor==COLOR_YELLOW &&fl.pos.roomName == creep.room.name){
                            flag = fl;
                        }
                    }
                    if(flag){
                        var reources = flag.pos.lookFor(LOOK_RESOURCES);
                        if(reources.length){
                            container = reources[0]
                        }
                    }
                }
                if(container){
                    creep.memory.harvestTarget = container.id;
                    if(creep.pos.isNearTo(container)){
                        if(creep.withdraw(container,RESOURCE_ENERGY) != OK){
                            creep.pickup(container)
                        }
                        creep.memory.harvestTarget = null;
                    }else{
                        creep.moveTo(container)
                    }
                }else{
                    var source = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
                    if(source){
                        if(creep.pos.isNearTo(source)){
                            creep.harvest(source)
                        }else if (creep.pos.inRangeTo(source,5)){
                            creep.moveTo(source,{ignoreCreeps:false})
                        }else{
                            creep.moveTo(source);
                        }
                    }
                }
                const tomb = creep.pos.findInRange(FIND_TOMBSTONES,1)[0];
                if(tomb){
                    creep.withdraw(tomb,RESOURCE_ENERGY)
                }
        }
	}
};

module.exports = roleUpgrader;


function canBeHarvestd(creep,target){
    var ok = false;
    if(!target)return false;
    switch(target.structureType){
        case STRUCTURE_CONTAINER :
            if(target.store[RESOURCE_ENERGY] >= creep.carryCapacity)ok = true;
            break;
        case STRUCTURE_LINK:
            if(Memory.inputLinks[target.room.name][target.id] == false && target.energy >= creep.carryCapacity/2)
                ok = true;
            break;
        case STRUCTURE_STORAGE:
            if(target.store[RESOURCE_ENERGY] > 0)ok = true;
            break;
        case STRUCTURE_TERMINAL:
            if(target.store[RESOURCE_ENERGY] >= creep.carryCapacity)ok = true;
            break;
    }
    //if(creep.room.name == 'W47N21') console.log()
    return ok;
}