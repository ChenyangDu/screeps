/*
 * @Author: your name
 * @Date: 2020-04-08 13:33:40
 * @LastEditTime: 2020-04-08 14:28:21
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \default\prototype.Room.js
 */
if(!Memory['prototype'])Memory['prototype'] = {};
if(!Memory['prototype'][this.name])Memory['prototype'][this.name] = {};


Room.prototype.tStorage = function(){
    let controller = this.controller;
    let tStorage = Game.getObjectById(Memory['prototype'][this.name].tStorage)
    if(tStorage)return tStorage;
    
    tStorage = this.find(FIND_STRUCTURES,{
        filter:function(o){
            if(o.structureType != STRUCTURE_CONTAINER)return false;
            let flags = o.pos.lookFor(LOOK_FLAGS);
            flags.forEach(flag => {
                if(flag.color == COLOR_YELLOW && flag.secondaryColor == COLOR_YELLOW){
                    return false;
                }
            });
            if(!o.pos.inRangeTo(controller,3)){
                return false;
            }
            return true;
        }
    })
    if(tStorage.length){
        tStorage = tStorage[0];
        Memory['prototype'][this.name].tStorage = tStorage.id;
        return tStorage;
    }
    return null;
}

Room.prototype.powerSpawn = function(){
    
    
    let powerSpawn = Game.getObjectById(Memory['prototype'][this.name].powerSpawn)
    if(powerSpawn)return powerSpawn;
    
    powerSpawn = this.find(FIND_STRUCTURES,{
        filter:(o)=>(o.structureType == STRUCTURE_POWER_SPAWN)
    })

    if(powerSpawn.length){
        powerSpawn = powerSpawn[0];
        Memory['prototype'][this.name].powerSpawn = powerSpawn.id;
        return powerSpawn;
    }
    return null;
}

Room.prototype.war = function(){
    
    let war = Memory.prototype[this.name].war;
    return war;
}