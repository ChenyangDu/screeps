/*
 * @Author: your name
 * @Date: 2020-04-04 17:53:21
 * @LastEditTime: 2020-04-07 22:03:36
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \default\role.builder.js
 */
var roleHarvester = require('role.harvester_old')
var roleBuilder = {
    
    run: function(creep) {
	    if(creep.memory.building && creep.carry.energy == 0) {
            creep.memory.building = false;
	    }
	    if(!creep.memory.building && creep.carry.energy == creep.carryCapacity) {
            creep.say('building');
            creep.memory.harvestTarget = null;
	        creep.memory.building = true;
        }
        /*var targets = creep.room.find(FIND_CONSTRUCTION_SITES);
        if(targets.length)targets = targets[0];
        else targets = null;*/
        var targets = null;
        if(!targets || targets.room.name != creep.room.name)
            targets = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
	    if(creep.memory.building) {
	       
            if(targets) {
                if(creep.pos.inRangeTo(targets,3)){
                    creep.build(targets)
                }else if(creep.pos.inRangeTo(targets,5)){
                    creep.moveTo(targets,{range:3,ignoreCreeps:false})
                }else{
                    creep.moveTo(targets,{range:3});
                }
            }else{
                if(creep.memory.role == 'Nbuilder'){
                    creep.memory.role = 'Nupgrader'
                }
                creep.moveTo(43,20);
            }
	    }
	    else {
            roleHarvester.getEnergy(creep)
            return;
            let ruin = creep.pos.findClosestByPath(FIND_RUINS,{
                filter:(struct)=>(
                    struct.store.energy
                )
            })
            var container = ruin;
            if(!container)
            container = creep.pos.findClosestByPath(FIND_STRUCTURES,{
                filter:(struct) => {
                    return (struct.structureType == STRUCTURE_CONTAINER && struct.store[RESOURCE_ENERGY] >= creep.carryCapacity) ||
                    (struct.structureType == STRUCTURE_LINK && Memory.inputLinks[creep.room.name][struct.id] == false && struct.energy >= creep.carryCapacity/2)
                }
            })
            
            if(/*!container && */creep.room.controller &&creep.room.controller.level <= 8 && creep.room.terminal &&
                 creep.room.terminal.store[RESOURCE_ENERGY] >= creep.carryCapacity){
                     container = creep.room.terminal;
                 }
                 
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
            if(/*!container &&*/ creep.room.storage && creep.room.storage.store[RESOURCE_ENERGY] > 4000)
                container = creep.room.storage;
            if(container){
                if(creep.pos.isNearTo(container)){
                    if(creep.withdraw(container,RESOURCE_ENERGY) != OK){
                        creep.pickup(container)
                    }
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
	        
	    }
	}
};

module.exports = roleBuilder;