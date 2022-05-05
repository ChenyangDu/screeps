if(!Memory['prototype'])Memory['prototype'] = {};

Room.prototype.tStorage = function(){
    let controller = this.controller;

    if(!Memory['prototype'][this.name])Memory['prototype'][this.name] = {}

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

Room.prototype.centerLink = function(){
    let link = Game.getObjectById(Memory['prototype'][this.name].centerLink)
    if(link) return link;
    link = this.find(FIND_STRUCTURES,{
        filter:(o)=>{
            if(o.structureType != STRUCTURE_LINK)return false;
            return o.pos.isNearTo(this.storage)
        }
    })
    if(link.length){
        Memory['prototype'][this.name].centerLink = link[0].id;
        return link[0];
    }
    return null;
}

Room.prototype.war = function(){
    
    let war = Memory.prototype[this.name].war;
    return war;
}