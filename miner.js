
module.exports = {
    run:function(creep){
        if(creep.memory.harvesting == false && _.sum(creep.carry) < creep.carryCapacity){
            creep.memory.harvesting = true;
        }
        if(creep.memory.harvesting == true && _.sum(creep.carry) == creep.carryCapacity){
            creep.memory.harvesting = false;
        }
        if(creep.memory.harvesting){
            const mineral = creep.room.find(FIND_MINERALS)[0];
            if(creep.harvest(mineral) == ERR_NOT_IN_RANGE){
                creep.moveTo(mineral);
            }
        }else{
            var store;
            store = creep.room.terminal;
            if(!creep.room.terminal||_.sum(creep.room.terminal.store) >= 290000){
                store = creep.room.storage;
            }
            creep.moveTo(store)
            for(const resourceType in creep.carry) {
                creep.transfer(store, resourceType);
            }
        }
    }
};