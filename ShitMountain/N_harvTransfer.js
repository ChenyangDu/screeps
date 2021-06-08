module.exports = {
    run:function(creep,resourceID,room,link){/*
        const droppedResources = creep.pos.findInRange(FIND_DROPPED_RESOURCES,1);
            if(droppedResources[0]) {
                creep.pickup(droppedResources[0]) 
            }*/
        var resource = Game.getObjectById(resourceID)
        if(creep.memory.harvesting == true  && creep.room.name != room){
            creep.moveTo(new RoomPosition(25,25,room),{reusePath:100})
            return
        }
        if(creep.memory.role){
            return;
        }
        if(creep.hits < creep.hitsMax){
            if(Game.time - Memory.badAss[room] > 1500 || !Memory.badAss[room]){
                Memory.badAss[room] = Game.time;
            }
        }
        if(creep.memory.harvesting == false && _.sum(creep.carry) < creep.carryCapacity/3){
            creep.memory.harvesting = true;
        }
        if(creep.memory.harvesting == true && _.sum(creep.carry) == creep.carryCapacity){
            creep.memory.harvesting = false;
        }
        var road = creep.pos.look(LOOK_STRUCTURES,{
            filter:(struct)=>{
                return struct.structureType == STRUCTURE_ROAD && 
                struct.hits < struct.hitsMax - 500
            }
        })
        if(road.length && creep.carry.energy>0){
            creep.repair(road[0])
        }
        
        if(creep.memory.harvesting == true){
            if(creep.harvest(resource) == ERR_NOT_IN_RANGE){
                creep.moveTo(resource,{reusePath:50})
            }
        }else{
            if(creep.pos.isNearTo(link)){
                creep.transfer(link,RESOURCE_ENERGY)
            }else{
                creep.moveTo(link,{reusePath:100})
            }
        }
        
    }
};