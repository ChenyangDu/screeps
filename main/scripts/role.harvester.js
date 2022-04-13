/*
 * @Author: your name
 * @Date: 2020-02-01 00:50:04
 * @LastEditTime: 2020-04-09 00:44:53
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \default\role.harvester.js
 */
var old = require('role.harvester_old')
var roleHarvester = {
    /** @param {Creep} creep **/
    run: function(creep) {
        let room = creep.room;
        let shouldSleep = false;
        
        let withDrawTarget;
        if(Game.shard.name == 'shard3' && room.name != 'W47N21'){
            old.run(creep)
            return;
        }
        if(!Game.creeps['SUP_'+room.name] || !room.storage || !room.storage.store.energy || room.controller.level <8){
            old.run(creep)
            return;
        }

        if(room.energyCapacityAvailable-room.energyAvailable-energyUsdInSpawn(room) <= 0){
            creep.say('zzz')
            shouldSleep = true;
            if(Game.flags["Main_"+creep.room.name] && Game.time %2 == 0){
                let pos = new RoomPosition(Game.flags["Main_"+creep.room.name].pos.x+8,Game.flags["Main_"+creep.room.name].pos.y+5,creep.room.name)
                if(!creep.pos.isNearTo(pos)){
                    creep.moveTo(pos,{range:1})
                }
            }
            //return;
        }
        
        const target = creep.pos.lookFor(LOOK_RESOURCES);
        if(target[0]) {
            creep.pickup(target[0]) 
        }
        const tomb = creep.pos.lookFor(LOOK_TOMBSTONES);
        if(tomb){
            creep.withdraw(tomb,RESOURCE_ENERGY)
        }
        
        if(room.storage){
            withDrawTarget = room.storage
        }else{
            withDrawTarget = creep.pos.findClosestByPath(FIND_STRUCTURES,{
                filter:(o)=>(o.structureType == STRUCTURE_CONTAINER && o.store.energy >= creep.store.getFreeCapacity('energy')/2)
            })
            if(!withDrawTarget){
                withDrawTarget = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES,{
                    filter:(o)=>(o.resourceType == RESOURCE_ENERGY)
                })
            }
            if(!withDrawTarget){
                withDrawTarget = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE)
            }
        }

        var extension = creep.pos.findClosestByPath(FIND_STRUCTURES,{
            filter:(o)=>(o.structureType == STRUCTURE_EXTENSION && o.store.getFreeCapacity('energy'))})
            
        if(creep.store.energy > 0){
            creep.moveTo(extension,{range:1})
            if(creep.pos.isNearTo(extension)){
                creep.transfer(extension,RESOURCE_ENERGY)
                var extension_next = creep.pos.findClosestByPath(FIND_STRUCTURES,{
                    filter:(o)=>(o.structureType == STRUCTURE_EXTENSION && o.store.getFreeCapacity('energy')&&
                    o.id != extension.id)})
                if(extension_next){
                    creep.moveTo(extension_next,{range:1})
                }else{
                    creep.moveTo(withDrawTarget)
                }
            }
        }else{
            creep.moveTo(withDrawTarget,{range:1})
            if(creep.pos.isNearTo(withDrawTarget)){
                if(creep.withdraw(withDrawTarget,RESOURCE_ENERGY) != OK){
                    if(creep.pickup(withDrawTarget) != OK){
                        creep.harvest(withDrawTarget)
                    }
                }
                creep.moveTo(extension)
            }
        }
	}
};

function energyUsdInSpawn(room){
    let spawns = room.find(FIND_STRUCTURES,{filter:(o)=>(o.structureType == STRUCTURE_SPAWN)})
    let ans = 0;
    for(let spawn of spawns){
        ans += 300-spawn.store.energy;
    }
    return ans;
}

module.exports = roleHarvester;
