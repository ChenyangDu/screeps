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