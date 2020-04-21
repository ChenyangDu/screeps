function batteryTransfer(creep){
    var terminal = creep.room.terminal
    if(terminal && terminal.store[RESOURCE_BATTERY] <= 30000){
        var factory = Game.getObjectById(Memory.factory[creep.room.name].factoryId)
        if(factory && factory.store[RESOURCE_BATTERY]){
            if(WAT(creep,factory,terminal,RESOURCE_BATTERY) == true){
                return false
            }
        }
    }
    
    if(terminal && terminal.store['battery']>30000){
        return false
    }
    return true;
}
function storageClean(creep){
    var storage = creep.room.storage
    var terminal = creep.room.terminal
    const max_store = 9000;
    if(storage && terminal){
        if(_.sum(creep.store) > 0){
            var type,target;
            for (type in creep.store);
            if(terminal.store[type]>=max_store){
                if(storage.store.getFreeCapacity() > 0)
                    target = storage;
            }else{
                if(terminal.store.getFreeCapacity(type) > 0)   
                    target = terminal;
            }
            creep.moveTo(target)
            if(creep.pos.isNearTo(target)){
                creep.transfer(target,type)
            }
            return true;
        }else{
            for(var type in storage.store){
                if(type != 'energy' && terminal.store[type]<max_store){
                    if((creep.pos.isNearTo(storage))){
                        creep.withdraw(storage,type)
                    }else{
                        creep.moveTo(storage)
                    }
                    return true;
                }
            }

            for(var type in terminal.store){
                if(type != 'energy' && terminal.store[type]>=max_store + creep.store.getCapacity()){
                    if((creep.pos.isNearTo(terminal))){
                        creep.withdraw(terminal,type)
                    }else{
                        creep.moveTo(terminal)
                    }
                    return true;
                }
            }
        }
    }
    return false;
}
const labInfo = {
   //W9S11:['XLHO2','XLH2O','XGHO2']
}
function labboost(creep){
    creep.say('lab')
    const roomName = creep.room.name;
    var labIds = Memory.lab[roomName].labs;
    var lab = null,type;

    for(var i in labInfo[roomName]){
        type = labInfo[roomName][i];
        lab = Game.getObjectById(labIds[i]);
        if(lab.store[type] < 3000){
            break;
        }
    }
    
    if(lab.store[type] >= 3000 && creep.store.getUsedCapacity() == 0 )return false;

    var target;
    
    if(creep.store.getUsedCapacity() > 0){
        if(creep.store[type] > 0 && lab.store[type] < 3000 && (!lab.mineralType || lab.mineralType == type)){
            target = lab;
        }else{
            target = creep.room.terminal;
        }

        if(creep.pos.isNearTo(target)){
            for(var t in creep.store)
                creep.transfer(target,t)
        }else{
            creep.moveTo(target)
        }
        return true;
    }
    if(lab.mineralType && lab.mineralType != type){
        if(creep.pos.isNearTo(lab)){
            creep.withdraw(lab,lab.mineralType)
        }else{
            creep.moveTo(lab)
        }
    }else{
        target = null;
        if(creep.room.storage.store[type]){
            target = creep.room.storage
        }else if (creep.room.terminal.store[type]){
            target = creep.room.terminal
        }
        console.log(type,target)
        if(!target)return false;
        
        if(creep.pos.isNearTo(target)){
            creep.withdraw(target,type)
        }else{
            creep.moveTo(target)
        }
    }
    return true;
}
function factory(creep){
    if(creep.ticksToLive < 10 && creep.store.getUsedCapacity() == 0){
        creep.suicide();
        return true;
    }
    creep.say('fac')
    //if(creep.ticksToLive % 5 != 0)return
    var factoryMemory = Memory.factory[creep.room.name]
    if(!factoryMemory)return false
    if(!factoryMemory.out)return false
    var factory = Game.getObjectById(factoryMemory.factoryId)
    var terminal = creep.room.terminal
    var storage = creep.room.storage;
    if(!factory)return false
    if(creep.store.getUsedCapacity() != 0){
        var type;
        for(type in creep.store){
            if(factoryMemory.in.indexOf(type) == -1){
                if(creep.pos.isNearTo(terminal)){
                    creep.transfer(terminal,type)
                }else{
                    creep.moveTo(terminal)
                }
                return true;
            }else{
                if(creep.pos.isNearTo(factory)){
                    creep.transfer(factory,type)
                }else{
                    creep.moveTo(factory)
                }
                return true;
            }
        }
    }else{
        if((!factoryMemory.out) || (!factoryMemory.in))return false

        for(var type of factoryMemory.in){
            var min_amount = 600; 
            if(['wire','condensate','alloy','cell'].indexOf(type) != -1)min_amount = 120;
            if(type == 'energy')min_amount = 1000
            if(COMMODITIES[type]){
                if(COMMODITIES[type].level == 1)min_amount = 50;
                if(COMMODITIES[type].level > 1)min_amount = 10
            }
            if(factory.store[type] >= min_amount)continue;
            var target = null;
            if(terminal && terminal.store[type])target = terminal
            if(storage && storage.store[type])target = storage
            if(target){
                if(creep.pos.isNearTo(target)){
                    creep.withdraw(target,type)
                }else{
                    creep.moveTo(target)
                }
                return true;
            }
        }
        
        for(var type in factory.store){
            if(factoryMemory.in.indexOf(type) == -1/* && type != 'energy'*/){
                if(creep.pos.isNearTo(factory)){
                    creep.withdraw(factory,type)
                }else{
                    creep.moveTo(factory)
                }
                return true;
            }
        }
        
    }
    return false
}

function energyLink(creep){
    if(creep.store.energy != creep.store.getUsedCapacity())return false;

    if(!creep.room.storage || !creep.room.storage.store.getFreeCapacity())return false;
    const main_flag = Game.flags['main_' + creep.room.name]
    if(main_flag){
        var link = Game.getObjectById(main_flag.memory.linkId)
        if(creep.store.energy){
            creep.transfer(creep.room.storage,RESOURCE_ENERGY)
            return true;
        }else if(link.store.energy){
            creep.withdraw(link,RESOURCE_ENERGY)
            return true;
        }else if(creep.room.terminal.store.energy > 80000){
            creep.withdraw(creep.room.terminal,RESOURCE_ENERGY)
            return true;
        }else{
            return false;
        }
    }else{
        return false;
    }
    
}
/*
Game.spawns.W43N27_3.spawnCreep([CARRY,CARRY,MOVE,CARRY,CARRY,MOVE,CARRY,CARRY,MOVE,],'SUP2',
{memory:{role:'supCarryer',job:'energy'}})
*/
module.exports = {
    run:function(creep){
        creep.say(creep.memory.job)
        //creep.memory.job = 'factory'
        if(creep.memory.job == 'battery'){
            if(batteryTransfer(creep) ==false){
                creep.memory.job = 'storageClean'
            }
        }else if (creep.memory.job == 'lab'){
            if(labInfo[creep.room.name] && labboost(creep) == false){
                creep.memory.job = 'factory'
            }
        }
        else if(creep.memory.job == 'storageClean'){
            if(storageClean(creep) == false){
                if(labInfo[creep.room.name]){
                    creep.memory.job = 'lab'
                }else
                    creep.memory.job = 'energy'
            }
        }else if(creep.memory.job == 'factory'){
            if(factory(creep) == false){
                creep.memory.job = 'storageClean'
            }
        }
        if(creep.memory.job == 'energy'){
            creep.say('energy')
            if(energyLink(creep) == false){
                creep.memory.job = 'factory'
            }
        }
    }
}

function WAT(creep,withdrawTarget,transferTarget,type,amount){
    if(type == undefined){
        console.log(creep.store)
        for(var t in creep.store){
            console.log(t)
            type = t
        }
    }
    if(amount == undefined)amount = 100000
    //console.log(creep.store[type])
    if(_.sum(creep.store) && creep.store[type] != _.sum(creep.store)){
        //console.log(creep.store[type] , _.sum(creep.store),type)
        creep.moveTo(creep.room.storage)
        if(creep.pos.isNearTo(creep.room.storage)){
            for (var resourceType in creep.store){
                if(resourceType != type){
                    creep.transfer(creep.room.storage,resourceType)
                }
            }
        }
        return;
    }
    amount = Math.min(amount,creep.store.getFreeCapacity(type));
    //console.log('amount',amount)
    if(_.sum(creep.store) == 0){
        amount = Math.min(amount,withdrawTarget.store[type]);
        creep.moveTo(withdrawTarget)
        if(creep.pos.isNearTo(withdrawTarget)){
            creep.withdraw(withdrawTarget,type,amount)
        }
    }else{
        //console.log(withdrawTarget,creep.store.getFreeCapacity(type),withdrawTarget.store[type])
        if(withdrawTarget && creep.store[type] < amount && creep.store.getFreeCapacity(type) > 0 && withdrawTarget.store[type] > 0){
            amount = Math.min(amount,creep.store.getFreeCapacity(type),withdrawTarget.store[type]);
            creep.moveTo(withdrawTarget)
            if(creep.pos.isNearTo(withdrawTarget)){
                creep.withdraw(withdrawTarget,type,amount)
            }
        }else{
            creep.moveTo(transferTarget)
            if(creep.pos.isNearTo(transferTarget)){
                creep.transfer(transferTarget,type)
                return true;
            }
        }
    }
    return false;
}