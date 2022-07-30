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
                        target.structureType != STRUCTURE_CONTAINER && 
                        target.structureType != STRUCTURE_RAMPART)){ //最近的只有是路,容器才能修
                    let targets = creep.room.find(FIND_CONSTRUCTION_SITES)
                    if(targets.length){
                        target = targets[0]
                        
                    }
                }
            }
                
            if(target) {
                let range = creep.pos.getRangeTo(target)
                if(range <= 3){
                    creep.build(target)
                    if(!creep.pos.isNearTo(target)){
                        let closePos = null
                        for(let x = -1;x <= 1;x++)
                        for(let y = -1;y <= 1;y++){
                            if(!(x||y))continue;
                            if(closePos)break;
                            let nx = creep.pos.x + x
                            let ny = creep.pos.y + y
                            if(nx <1 || nx >= 49 || ny < 1 || ny >= 49)continue
                            let pos = new RoomPosition(nx,ny,creep.pos.roomName)
                            // console.log(pos,pos.lookFor(LOOK_STRUCTURES),pos.lookFor(LOOK_STRUCTURES).filter(o=> OBSTACLE_OBJECT_TYPES.indexOf(o.structureType)!=-1),
                            // pos.lookFor(LOOK_STRUCTURES).filter(o=> OBSTACLE_OBJECT_TYPES.indexOf(o.structureType)!=-1).length)
                            if(pos.inRangeTo(target,range-1) && pos.lookFor(LOOK_STRUCTURES).filter(o=> OBSTACLE_OBJECT_TYPES.indexOf(o.structureType)!=-1).length == 0
                             && pos.lookFor(LOOK_CREEPS).length == 0){
                                closePos = pos
                                break;
                            }
                        }
                        if(closePos){
                            creep.moveTo(closePos,{maxRooms:1})
                        }
                    }
                }else {
                    let pos = creep.pos
                    // if(pos.x < 5 || pos.x >=45 || pos.y < 5 || pos.y > 45){
                    //     console.log('near border')
                    //     PathFinder.use(true);
                    //     creep.moveTo(target,{
                    //         costCallback: function(roomName, costMatrix) {
                    //             console.log(roomName)
                    //             let exits = pos.findInRange(FIND_EXIT,5)
                    //             console.log(exits)
                    //             exits.forEach(e=>{
                    //                 costMatrix.set(e.x,e.y,255)
                    //                 new RoomVisual(creep.room.name).text("N",e.x,e.y)
                    //             })
                    //         },
                    //         maxRooms:1,
                    //         range:3,
                    //     })
                    // }else{
                        if(creep.pos.inRangeTo(target,5)){
                            creep.moveTo(target,{range:3,ignoreCreeps:false,maxRooms:1})
                        }else{
                            creep.moveTo(target,{range:3,maxRooms:1});
                        }
                    
                    
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