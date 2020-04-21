const STATE_FILL = 0
const STATE_REACTION = 1
const STATE_RECOVERY = 2

var needs,creep,labs,room

module.exports = {
    run:function(roomName){
        room = Game.rooms[roomName]
        var state = Memory.lab[roomName]['state'];
        labs = new Array();
        var _id = 0;
        Memory.lab[roomName]['labs'].forEach(labid => {
            labs.push(Game.getObjectById(labid))
            new RoomVisual(roomName).text(_id,labs[_id].pos,{color: 'white', font: 0.5})
            _id++;
        });
        
        const creepName = 'laber' + roomName;
        creep = Game.creeps[creepName];

        needs = new Array();
        needs.push([RESOURCE_CATALYZED_LEMERGIUM_ALKALIDE,5000],roomName);
        pushMission(needs[0],roomName)
        //console.log(needs)
        var product = needs[needs.length-1][0],amount = Math.min(3000, needs[needs.length-1][1]);
        var materials = findMaterial(product)
        if(amount % 5)amount += 5-amount%5;
        //console.log(product,materials,amount)
        

        if(materials == null && state == STATE_FILL){
            if(creep)
                creepKill(creep)
            return
        }
        //change state 

        if(state == STATE_REACTION && (labs[0].mineralType == undefined || labs[1].mineralType == undefined)){
            console.log('state change to STATE_RECOVERY')
            state = STATE_RECOVERY
        }
        if(state == STATE_RECOVERY){
            var allclear = true;
            labs.forEach(lab => {
                if(lab.mineralType != undefined)allclear = false;
            });
            if(allclear){
                console.log('state change to STATE_FILL')
                state = STATE_FILL
            }
        }
        if(state == STATE_FILL){
            if(labs[0].store[materials[0]] >= amount && labs[1].store[materials[1]] >= amount){
                console.log('state change to STATE_REACTION')
                state = STATE_REACTION
            }
        }
        
        //console.log('state is ',state)
        // run state
        
        if(creep)creep.say('laber')
        if(state == STATE_REACTION && Game.time % REACTION_TIME[product] == 0){
            if(creep){
                creepKill(creep)
            }
            for(var i = 2;i<labs.length;i++){
                if(labs[0] && labs[1] && labs[i]){
                    if(labs[i].runSTATE_REACTION(labs[0],labs[1]) != OK){
                        console.log('wa')
                        state = STATE_RECOVERY;
                    }
                }
            }
        }
        else if(state == STATE_FILL){
            if(!creep){
                autoSpawnCreep(creepName)
            }else{
                var withdrawTarget;
                var type = materials[0]
                if(labs[0].store[type] ==undefined || labs[0].store[type] < amount){
                    if(room.storage.store[type])withdrawTarget = room.storage;
                    else if(room.terminal.store[type])withdrawTarget = room.terminal;
                    if(labs[0].store[type])amount -= labs[0].store[type];
                    if(creep.store[type] >= amount)withdrawTarget = null;
                    //console.log(withdrawTarget,type,amount)
                    WAT(creep,withdrawTarget,labs[0],type,amount)
                }else{
                    type = materials[1]
                    if(labs[1].store[type] ==undefined || labs[1].store[type] < amount){
                        if(room.storage.store[type])withdrawTarget = room.storage;
                        else if(room.terminal.store[type])withdrawTarget = room.terminal;
                        if(labs[1].store[type])amount -= labs[1].store[type];
                        WAT(creep,withdrawTarget,labs[1],type,amount)
                    }
                }
            }
        }else if(state == STATE_RECOVERY){
            if(!creep){
                autoSpawnCreep(creepName)
            }else{
                var mission = false;
                labs.forEach(lab => {
                    if(mission == false && lab.mineralType){
                        WAT(creep,lab,room.storage,lab.mineralType,creep.store.getFreeCapacity(RESOURCE_ENERGY))
                        mission = true;
                    }
                });
            }
        }
        Memory.lab[roomName]['state'] = state;
    }
};

function findMaterial(product){
    for(var i in STATE_REACTIONS){
        for(var j in STATE_REACTIONS[i]){
            if(STATE_REACTIONS[i][j] == product){
                return [i,j]
            }
        }
    }
    return null
}
function getAvaliableSpawn(room){
    for (var spawnname in Game.spawns){
        var spawn = Game.spawns[spawnname]
        if(spawn.room.name == room && spawn.spawning == null){
            return spawn
        }
    }
    return null;
}
function creepKill(creep){
    const spawn = creep.pos.findClosestByPath(FIND_STRUCTURES,{filter:{structureType:STRUCTURE_SPAWN}})
    if(!creep.pos.isNearTo(spawn))creep.moveTo(spawn)
    else spawn.recycleCreep(creep)
}
function WAT(creep,withdrawTarget,transferTarget,type,amount){
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
        amount = Math.min(amount,creep.store.getFreeCapacity(type),withdrawTarget.store[type]);
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
            }
        }
    }
}

function autoSpawnCreep(creepName){
    var spawn = getAvaliableSpawn(room.name)
    if(spawn){
        spawn.spawnCreep([CARRY,CARRY,MOVE,CARRY,CARRY,MOVE,CARRY,CARRY,MOVE,CARRY,CARRY,MOVE,CARRY,CARRY,MOVE,
            CARRY,CARRY,MOVE,CARRY,CARRY,MOVE,CARRY,CARRY,MOVE,CARRY,CARRY,MOVE,CARRY,CARRY,MOVE,],
            creepName)
    }
}
function getAllType(type){
    if(type == RESOURCE_LEMERGIUM)return 1000*1000
    if(type == RESOURCE_HYDROGEN)return 1000*1000
    var amount = 0;
    amount += room.storage.store[type]
    amount += room.terminal.store[type]
    labs.forEach(lab => {
        amount += lab.store[type];
    });
    if(creep)
    amount += creep.store[type]
    return amount;
}
function pushMission(mission,roomName){
    mission[1] -= getAllType(mission[0])
    if(mission[1] <= 0)return;
    else {
        needs.push(mission)
        var materials = findMaterial(mission[0])
        if(materials){
            pushMission([materials[0],mission[1]],roomName)
            pushMission([materials[1],mission[1]],roomName)
        }
    }
}