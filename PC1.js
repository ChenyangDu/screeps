const fight = true;
function PC(creep){
    var pos = freePos[creep.room.name]
    if(pos && !creep.pos.isEqualTo(pos)){
        creep.moveTo(pos)
    }
    
    creep.usePower(PWR_GENERATE_OPS)
    withdrawTerminal(creep)
    
        if(creep.name == '水')opFactory(creep)
        if(creep.name == '木')opFactory(creep)
        if(creep.name == '火')opFactory(creep)
    if(creep.name == '蚩尤' && fight){
        opSpawn(creep)
        //opTower(creep)
        opExt(creep)
    }
    dying(creep)
}

function withdrawTerminal(creep){

    var terminal = creep.room.terminal;
    
    if(terminal.store[RESOURCE_OPS] > 0 && creep.store[RESOURCE_OPS] < 100){
        creep.moveTo(terminal)
        creep.withdraw(terminal,RESOURCE_OPS,Math.min(100,terminal.store[RESOURCE_OPS]))
    }
    if(creep.store[RESOURCE_OPS] > 200 && terminal.store.getFreeCapacity(RESOURCE_OPS) >= 100){
        creep.moveTo(terminal)
        creep.transfer(terminal,RESOURCE_OPS)
    }

}

function opSpawn(creep){
    let spawns = creep.room.find(FIND_STRUCTURES,{
        filter: { structureType: STRUCTURE_SPAWN }
    })
    spawns.forEach(spawn => {
        var ticks = 0;
        if(spawn.effects){
            for(var a of spawn.effects){
                ticks = a.ticksRemaining
            }
        }
        
        if(creep.store[RESOURCE_OPS] >= 100 && ticks == 0 && creep.powers[PWR_OPERATE_SPAWN].cooldown == 0){
            creep.moveTo(spawn,{range:1})
            creep.usePower(PWR_OPERATE_SPAWN,spawn)
        }
    });
}

function opTower(creep){
    let towers = creep.room.find(FIND_STRUCTURES,{
        filter: { structureType: STRUCTURE_TOWER}
    })
    towers.forEach(tower => {
        var ticks = 0;
        if(tower.effects){
            for(var a of tower.effects){
                ticks = a.ticksRemaining
            }
        }
        
        if(creep.store[RESOURCE_OPS] >= 10 && ticks == 0 && creep.powers[PWR_OPERATE_TOWER].cooldown == 0){
            creep.moveTo(tower,{range:3})
            creep.usePower(PWR_OPERATE_TOWER,tower)
        }
    });
}

function opExt(creep){
    let target = creep.room.terminal;
    if(!target || target.store.energy <= 10000){
        let storage = creep.room.storage;
        if(storage && storage.store.energy)target = storage;
        else target = null;
    }
    
    if(creep.room.energyAvailable <= 0.5* creep.room.energyCapacityAvailable && creep.store[RESOURCE_OPS] >= 10 && creep.powers[PWR_OPERATE_EXTENSION].cooldown == 0){
        creep.moveTo(target,{range:3})
        creep.usePower(PWR_OPERATE_EXTENSION,target)
    }
    
}

function opFactory(creep){
    
    var needOps = false;
    if(!Memory.factory[creep.room.name])return
    for(var type of Memory.factory[creep.room.name].out){
        if(isReady(type) && amountOf(type)<=5000){
            needOps = true;
            break;
        }
    }

    if(!needOps){
        for(var type of Memory.factory[creep.room.name].out){
            //isReady(type,true)
        }
        return;
    }
    //console.log(creep)
    /*
    var factory 
    if(Memory.factory)
    factory = Game.getObjectById(Memory.factory[creep.room.name].factoryId);
    if(factory){
        var ticks = 0;
        if(factory.effects){
            for(var a of factory.effects){
                ticks = a.ticksRemaining
            }
        }
        if(creep.store[RESOURCE_OPS] >= 100 && ticks == 0 && factory.cooldown == 0){
            creep.moveTo(factory)
            creep.usePower(PWR_OPERATE_FACTORY,factory)
        }
    }*/
}
function dying(creep){
    if(creep.ticksToLive >= 4500)return;
    var powerSpawn = creep.room.find(FIND_STRUCTURES,{filter:o=>(o.structureType == STRUCTURE_POWER_SPAWN)})
    if(powerSpawn.length)powerSpawn = powerSpawn[0]
    else powerSpawn = null;
    if(powerSpawn){
        creep.moveTo(powerSpawn)
        creep.renew(powerSpawn)
    }
}

module.exports = {
    run:function(){
        /*
        const names = ['水','木','火','金']
        names.forEach(name =>{
            var creep = Game.powerCreeps[name]
            if(creep.room){
                PC(creep)
            }
        })*/
        let creep = Game.powerCreeps['蚩尤']
        if(creep.room){
            PC(creep)
        }
        
    },
    report:function(){
        const rooms = _.filter(Game.rooms, (x) => x.controller && x.controller.my && Memory.factory[x.name])
        for(var room of rooms){
            
            var working = false;
            for(var type of Memory.factory[room.name].out){
                if(isReady(type) == true){
                    working = true;
                    console.log(room.name ,': producing',type)
                    break;
                }
            }
            if(!working){
                console.log(room.name ,':')
                for(var type of Memory.factory[room.name].out){
                    isReady(type,true)
                }
            }
        }
        return 'over'
    }
};

const freePos = {
    W47N21:new RoomPosition(26,30,'W47N21'),
    W38N24:new RoomPosition(23,24,'W38N24'),
    W38N26:new RoomPosition(26,19,'W38N26'),
    W43N27:new RoomPosition(36,35,'W43N27'),
}

function amountOf(type){
    const rooms = _.filter(Game.rooms, (x) => x.controller && x.controller.my && x.terminal&&Memory.factory[x.name])
    var amount = 0;
    rooms.forEach(room => {
        amount += room.terminal.store[type]
        if(room.storage){
            amount += room.storage.store[type]
        }
        if(Memory.factory[room.name].factoryId && Game.getObjectById(Memory.factory[room.name].factoryId)){
            amount += Game.getObjectById(Memory.factory[room.name].factoryId).store[type]
        }
    });
    //console.log(type,amount)
    return amount
}

function isReady(type,show){
    if(show){
        console.log('   ',type,':')
    }
    var amount = 1000000;
    if(!COMMODITIES[type]){
        //console.log(type)
        return false;
    }
    var sons = COMMODITIES[type].components
    for(var subType in sons){
        //console.log(subType,amountOf(subType),sons[subType],Math.floor(amountOf(subType)/sons[subType]))
        if(Math.floor(amountOf(subType)/sons[subType]) < Math.ceil(1000/COMMODITIES[type].cooldown)){
            if(show)console.log('       need ',subType)
        }
        amount = Math.min(amount,Math.floor(amountOf(subType)/sons[subType]))
    }
    //console.log(amount,Math.ceil(1000/COMMODITIES[type].cooldown))
    if(show && amount >= Math.ceil(1000/COMMODITIES[type].cooldown))console.log('       OK')
    return amount >= Math.ceil(1000/COMMODITIES[type].cooldown)
}
