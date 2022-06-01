let carryCtrl = require("carryCtrl")

module.exports = {
    run(){
        Game.myrooms.forEach(room=>{
            if(room.terminal){
                runRoom(room)
            }
        })
    },
}
/**
 * 
 * @param {Room} room 
 */
function runRoom(room){
    let terminal = room.terminal
    let storage = room.storage
    if(!terminal || !storage)return;
    let creep = getCreep(room)
    if(creep && creep.store.getUsedCapacity() == 0 && creep.ticksToLive<10){
        carryCtrl.returnCreep(creep.room,creep.name)
        delete creep.memory.srole
        return
    }
    if(creep && creep.store.getUsedCapacity() > 0){ // creep已经在忙了
        let type = _.head(_.keys(creep.store))
        let target = terminal.store[type] < getLimit(type)?terminal:
                    storage.store.getFreeCapacity()?storage:
                    terminal.store.getFreeCapacity()?terminal:null
        if(target){
            if(creep.pos.isNearTo(target)){
                creep.transfer(target,type)
            }else{
                creep.moveTo(target,{range:1})
            }
        }
        
        
    }else{
        var busy = false

        // storage => terminal
        if(terminal.store.getFreeCapacity() > 0){
            for(let type in storage.store){ 
                if(busy)break;
                if(terminal.store.getUsedCapacity(type) < getLimit(type)){
                    if(!creep){
                        let carryerName = carryCtrl.borrowCreep(room)
                        if(carryerName && Game.creeps[carryerName]){
                            creep = Game.creeps[carryerName]
                            creep.memory.srole = 'carryterminal'
                        }else{
                            busy = true;
                            break;
                        }
                    }
                    if(creep){
                        if(creep.pos.isNearTo(storage)){
                            creep.withdraw(storage,type,_.min([
                                creep.store.getFreeCapacity(),
                                getLimit(type) - terminal.store.getUsedCapacity(type),
                                storage.store.getUsedCapacity(type)
                            ]))
                        }else{
                            creep.moveTo(storage,{range:1})
                        }
                        busy = true;
                        break;
                    }
                }
            }
        }

        // terminal => storage
        if(storage.store.getFreeCapacity() > 0){
            for(let type in terminal.store){ 
                if(busy)break;
                if(terminal.store[type] > getLimit(type)){
                    if(!creep){
                        let carryerName = carryCtrl.borrowCreep(room)
                        if(carryerName && Game.creeps[carryerName]){
                            creep = Game.creeps[carryerName]
                            creep.memory.srole = 'carryterminal'
                        }else{
                            busy = true;
                            break;
                        }
                    }
                    if(creep){
                        if(creep.pos.isNearTo(terminal)){
                            creep.withdraw(terminal,type,_.min([
                                creep.store.getFreeCapacity(),
                                terminal.store[type] - getLimit(type)
                            ]))
                        }else{
                            creep.moveTo(terminal,{range:1})
                        }
                        busy = true;
                        break;
                    }
                }
            }
        }
    }
    // 没事就还回去
    if(creep && creep.store.getUsedCapacity() == 0 && !busy){
        carryCtrl.returnCreep(creep.room,creep.name)
        delete creep.memory.srole
    }
    
}

function getLimit(type){
    if(type == 'energy')return 50*1000
    return 3000
}

/**
 * 
 * @param {Room} room 
 */
function getCreep(room){
    return _.head(room.find(FIND_MY_CREEPS,{filter:o=>o.memory.srole == 'carryterminal'}))
}