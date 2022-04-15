var roleHarvester = require('role.harvester_old')
var roleUpgrader = {

    /** @param {Creep} creep **/
    run: function(creep) {

        if(creep.memory.upgrading && creep.carry.energy == 0) {
            creep.memory.upgrading = false;
	    }
	    if(!creep.memory.upgrading && creep.carry.energy >= 0.8*creep.carryCapacity) {
            creep.memory.harvestTarget = null;
	        creep.memory.upgrading = true;
        }
        

	    if(creep.memory.upgrading) {
            let RANGE = 3;
            let controller = creep.room.controller;
            
            if(creep.pos.getRangeTo(controller.pos) > 5){
                creep.moveTo(controller,{range:RANGE})
            }else if (creep.pos.getRangeTo(controller.pos) > RANGE){
                creep.moveTo(controller,{range:RANGE,ignoreCreeps:false})
            }
            if(creep.pos.getRangeTo(controller.pos) <= 3){
                creep.upgradeController(controller)
            }

            let tStorage = creep.room.tStorage();
            if(tStorage){
                
                if(creep.pos.isNearTo(tStorage)){
                    
                    const target = creep.pos.lookFor(LOOK_RESOURCES);
                    if(target[0]) {
                        creep.pickup(target[0]) 
                    }else{
                        creep.withdraw(tStorage,'energy')
                    }
                }
                if(creep.ticksToLive % 17 == 0){
                    let poslists = [];
                    for(let x = -1;x <= 1;x++)
                    for(let y = -1;y <= 1;y++){
                        if(!(x||y))continue;
                        let pos = new RoomPosition(creep.pos.x + x,creep.pos.y + y,creep.pos.roomName)
                        if(pos.isNearTo(tStorage) &&
                            pos.lookFor(LOOK_CREEPS).length == 0 &&
                            pos.getRangeTo(controller) <= creep.pos.getRangeTo(controller) &&
                            (!creep.room.memory || !creep.room.memory.notUpgraderPos || 
                                !pos.isEqualTo(creep.room.memory.notUpgraderPos.x,creep.room.memory.notUpgraderPos.y))){
                            poslists.push(pos)
                        }
                    }
                    if(poslists.length){
                        creep.moveTo(_.min(poslists,(o)=>(o.getRangeTo(controller))))
                    }
                }
            }
        }
        else {
            roleHarvester.getEnergy(creep)
            return;
        }
	}
};

module.exports = roleUpgrader;

