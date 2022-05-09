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
    /**
     * 
     * @param {Creep} creep 
     * @returns 
     */
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
        
	    if(creep.memory.building) {
            var target = null;
            if(!target || target.room.name != creep.room.name){
                target = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
                if(target && 
                    (target.structureType != STRUCTURE_ROAD &&
                        target.structureType != STRUCTURE_CONTAINER)){ //最近的只有是路,容器才能修
                    let targets = creep.room.find(FIND_CONSTRUCTION_SITES)
                    if(targets.length){
                        target = targets[0]
                    }
                }
            }
                
            if(target) {
                if(creep.pos.inRangeTo(target,3)){
                    creep.build(target)
                }else if(creep.pos.inRangeTo(target,5)){
                    creep.moveTo(target,{range:3,ignoreCreeps:false})
                }else{
                    creep.moveTo(target,{range:3});
                }
            }else{
                if(creep.memory.role == 'builder'){
                    creep.memory.role = 'upgrader'
                }
            }
	    }
	    else {
            roleHarvester.getEnergy(creep)
            return;
	    }
	}
};

module.exports = roleBuilder;