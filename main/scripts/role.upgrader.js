var roleHarvester = require('role.harvester_old')
let labCtrl = null
var roleUpgrader = {

    /** @param {Creep} creep **/
    run: function(creep) {
        if(!labCtrl){
            labCtrl = require("labCtrl")
        }
        if(creep.memory.boosted === undefined){
            let terminal = creep.room.terminal
            
            if(terminal && terminal.store.getUsedCapacity('GH') > 0){
                creep.memory = labCtrl.boost_init_creep_memory(
                    {GH:creep.body.filter(o=>o.type == WORK).length},creep.memory
                )
            }
        }
        if(!creep.memory.boosted){
            labCtrl.boost(null,null,creep)
            return;
        }
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
            let tStorage = creep.room.tStorage();
            if(creep.pos.getRangeTo(controller.pos) <= 3){
                creep.upgradeController(controller)
            }
            
            if(tStorage){
                // if(creep.pos.getRangeTo(tStorage.pos) > 3){
                //     creep.moveTo(tStorage,{range:1})
                // }else if (creep.pos.getRangeTo(tStorage.pos) > 1){
                //     creep.moveTo(controller,{range:3,ignoreCreeps:false})
                // }
                

                if(creep.pos.isNearTo(tStorage)){
                    const target = creep.pos.lookFor(LOOK_RESOURCES);
                    if(target[0]) {
                        creep.pickup(target[0]) 
                    }else{
                        creep.withdraw(tStorage,'energy')
                    }
                }
                let notPos = creep.room.memory.notUpgraderPos
                if(!creep.pos.isNearTo(tStorage) || (notPos && creep.pos.isEqualTo(notPos.x,notPos.y))){
                    let poslists = [];
                    for(let x = -1;x <= 1;x++)
                    for(let y = -1;y <= 1;y++){
                        let pos = new RoomPosition(tStorage.pos.x + x,tStorage.pos.y + y,tStorage.pos.roomName)
                        if(pos.lookFor(LOOK_CREEPS).length == 0 &&
                            pos.lookFor(LOOK_TERRAIN) != 'wall' ){
                                if(!notPos ||!pos.isEqualTo(notPos.x,notPos.y)){
                                    poslists.push(pos)
                                }
                            }
                    }
                    if(poslists.length){
                        let targetPos = _.min(poslists,(o)=>(o.getRangeTo(controller)))

                        
                        creep.moveTo(targetPos,{maxRooms:1,/*ignoreCreeps:creep.pos.getRangeTo(targetPos) > 3*/})
                    }
                }
                if(creep.ticksToLive % 7 == 0 || creep.pos.lookFor(LOOK_STRUCTURES).filter(o=>o.structureType=='road').length){
                    let poslists = [];
                    for(let x = -1;x <= 1;x++)
                    for(let y = -1;y <= 1;y++){
                        if(!(x||y))continue;
                        let nx = creep.pos.x + x
                        let ny = creep.pos.y + y
                        if(nx <1 || nx >= 49 || ny < 1 || ny >= 49)continue
                        let pos = new RoomPosition(nx,ny,creep.pos.roomName)
                        if(pos.isNearTo(tStorage) &&
                            pos.lookFor(LOOK_CREEPS).length == 0 && 
                            pos.lookFor(LOOK_STRUCTURES).filter(o=>o.structureType=='road').length == 0 &&
                            pos.lookFor(LOOK_TERRAIN) != 'wall' &&
                            pos.getRangeTo(controller) <= creep.pos.getRangeTo(controller) &&
                            (!creep.room.memory || !creep.room.memory.notUpgraderPos || 
                                !pos.isEqualTo(creep.room.memory.notUpgraderPos.x,creep.room.memory.notUpgraderPos.y))){
                            poslists.push(pos)
                        }
                    }
                    // if(creep.pos.x == 10 && creep.pos.y == 10){
                    //     console.log(poslists)
                    // }
                    if(poslists.length){
                        creep.moveTo(_.min(poslists,(o)=>(o.getRangeTo(controller))),{maxRooms:1})
                    }
                }
            }else{
                
                    if(creep.pos.getRangeTo(controller.pos) > 5){
                        creep.moveTo(controller,{range:RANGE,maxRooms:1})
                    }else if (creep.pos.getRangeTo(controller.pos) > RANGE){
                        creep.moveTo(controller,{range:RANGE/*,ignoreCreeps:false*/,maxRooms:1})
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

