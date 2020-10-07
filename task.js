//分为三个部分：建筑生成任务，系统处理任务，CREEP执行任务 
var task = {};

//1 建筑生成任务部分 

function build_task(roomName){
    //分为七个建筑 
    build_task_terminal_storage(roomName);
    build_task_link(roomName);
    build_task_storage(roomName);
    build_task_towers(roomName);
    build_task_spawns(roomName);
    build_task_terminal(roomName)
    build_task_powerSpawn(roomName);
}

function push_task(roomName,type,supply,structure){
    if(!task[roomName]){
        task[roomName] = {};
    }
    if(!task[roomName][type]){
        task[roomName][type] = {
            'supply':[],
            'demand':[]
        };
    }
    let other_supply;
    if(supply == 'supply')other_supply = 'demand';
    else other_supply = 'supply'
    if(!task[roomName][type][supply].find((o)=>(o.id == structure.id))
    &&(structure.structureType == STRUCTURE_STORAGE || !task[roomName][type][other_supply].find((o)=>(o.id == structure.id)))){
        task[roomName][type][supply].push({type:structure.structureType,id:structure.id})
        //if(type == 'energy' && roomName == 'E41N42' && structure.structureType == STRUCTURE_TERMINAL)
        //    console.log(type,structure.structureType,structure.id,supply,structure.store.energy) 
    }
}

function build_task_link(roomName){
    const link = getStruct(roomName,'link')
    if(!link)return;
    if(link.store.energy){
        push_task(roomName,'energy','supply',link)
    }
}

function build_task_storage(roomName){
    const storage = Game.rooms[roomName].storage;
    if(!storage)return
    if(task[roomName] &&task[roomName]['energy']&& task[roomName]['energy']['supply'].length && storage.store.energy <= 800000 && storage.store.getFreeCapacity('energy') >= 10000){
        push_task(roomName,'energy','demand',storage)
    }
    for(let type in storage.store){
        if(storage.store[type] > 0){
            push_task(roomName,type,'supply',storage)
        }
    }
    
}

function build_task_towers(roomName){
    const towers = getStruct(roomName,'tower');
    for(let tower of towers){
        if(tower.store.energy < 900){
            push_task(roomName,'energy','demand',tower)
        }
    }
}

function build_task_spawns(roomName){
    const spawns = getStruct(roomName,'spawn')
    if(spawns)
    for(let spawn of spawns){
        if(spawn.store.energy < 300){
            push_task(roomName,'energy','demand',spawn)
        }
    }
}

function build_task_terminal(roomName){
    const terminal = Game.rooms[roomName].terminal;
    let room = Game.rooms[roomName]
    if(!terminal)return;
    if(room.controller.level < 8){
        let storage = room.storage;
        if(terminal.store.energy){
            if(!storage || storage.store.energy <= 50000)
            push_task(roomName,'energy','supply',terminal)
        }
    }else{
        
        if(terminal.store.energy >= 50000){
            push_task(roomName,'energy','supply',terminal)
        }else if(terminal.store.energy <= 40000){
            push_task(roomName,'energy','demand',terminal)
        }
    }
    for(let type in terminal.store){
        if(terminal.store[type] > 0 && type != 'energy'){
            push_task(roomName,type,'supply',terminal)
        }
    }
}

function build_task_terminal_storage(roomName){
    let room = Game.rooms[roomName]
    let terminal = room.terminal;
    let storage = room.storage;
    if(!terminal || !storage)return;
    for(let type in terminal.store){
        if(type != 'energy')
        if(terminal.store[type] >= 12000 && storage.store.getFreeCapacity(type) >=10000){ 
            push_task(roomName,type,'supply',terminal)
            push_task(roomName,type,'demand',storage)
        }
    }
    for(let type in storage.store){
        if(type != 'energy')
        if(terminal.store[type]<10000 &&terminal.store.getFreeCapacity(type) >=10000&& storage.store[type] >0){
            push_task(roomName,type,'supply',storage)
            push_task(roomName,type,'demand',terminal)
        }
    }
}

function build_task_powerSpawn(roomName){
    let room = Game.rooms[roomName]
    const powerSpawn = room.powerSpawn()
    if(powerSpawn){
        if(powerSpawn.store.energy <= 4000){
            push_task(roomName,'energy','demand',powerSpawn)
        }
        if(!powerSpawn.store.power || powerSpawn.store.power <= 20){
            push_task(roomName,'power','demand',powerSpawn)
        }
    }
}

//2 系统处理任务

function analye_task(roomName){
    for(var type in task[roomName]){
        if(type == 'energy')
        for(var sd of ['supply','demand']){
            task[roomName][type][sd].sort((a,b)=>(
                priority[type][sd][a.type] - priority[type][sd][b.type]
            ))
            for(var a in task[roomName][type][sd]){
                //console.log('analye',a,task[roomName][type][sd][a].type)
            }
        }
    }
}
const priority = {
    'energy':{
        'supply':{
            'link':1,
            'terminal':2,
            'factory':3,
            'storage':4,
            'spawn':7,
            'tower':7,
            'powerSpawn':7,
        },
        'demand':{
            'spawn':1,
            'tower':2,
            'factory':3,
            'powerSpawn':4,
            'terminal':5,
            'storage':6,
            'link':7,
        }
    }
}
//3 CREEP执行任务

function runCreep(creep){
    var mission = creep.memory.mission;
    
    if(!mission){
        if(creep.ticksToLive <= 10){
            creep.suicide();
            return;
        }
        if(creep.ticksToLive <= 1000){
            let spawn = creep.room.find(FIND_STRUCTURES,
                {filter:(o)=>(o.structureType == STRUCTURE_SPAWN && o.spawning == null)})
            if(spawn.length){
                creep.moveTo(spawn[0],{range:1})
                spawn[0].renewCreep(creep)
            }
        }
        mission = getMission(creep.room.name)
    }
    
    if(!mission){
        creep.say('bor')
        let storage = creep.room.storage;
        
        if(creep.store.getUsedCapacity() && storage && storage.store.getFreeCapacity()){
            creep.moveTo(storage,{range:1})
            if(creep.pos.isNearTo(storage)){
                for(let _type in creep.store){
                    creep.transfer(storage,_type)
                }
            }
        }else{
            const roomName = creep.room.name
            const main_flag = Game.flags['Main_'+roomName]
            if(main_flag){
                const pos = new RoomPosition(main_flag.pos.x + 5,main_flag.pos.y+8,roomName)
                if(!creep.pos.isEqualTo(pos))
                    creep.moveTo(pos)
            }
            
            let target = creep.pos.findInRange(FIND_DROPPED_RESOURCES,5);
            if(!target.length){
                target = creep.pos.findInRange(FIND_TOMBSTONES,5,{
                    filter:(o)=>(o.store.getUsedCapacity())
                })
            }
            if(target.length){
                target = target[0]
                if(creep.pos.isNearTo(target)){
                    creep.pickup(target)
                    for(var type in target.store);
                    creep.withdraw(target,type)
                }
            }else{
                creep.moveTo(target)
            }
            
        }
        return false;
    }

    if(creep.store.getUsedCapacity(mission.type) != creep.store.getCapacity() -  creep.store.getFreeCapacity(mission.type)){
        let storage = creep.room.storage;
        if(storage && storage.store.getFreeCapacity()){
            creep.moveTo(storage,{range:1})
            if(creep.pos.isNearTo(storage)){
                for(let _type in creep.store){
                    if(_type != mission.type){
                        creep.transfer(storage,_type)
                    }
                }
            }
        }else{
            for(let _type in creep.store){
                if(_type != mission.type){
                    creep.drop(_type)
                }
            }
        }
        return
    }
 
    if(creep.store[mission.type]){
        let target = Game.getObjectById(mission.demand)
        if(target)
            if(creep.pos.isNearTo(target)){
                creep.transfer(target,mission.type)
                mission = getMission(creep.room.name)
                if(mission){
                    let next_target = Game.getObjectById(mission.supply)
                    if(next_target){
                        creep.moveTo(next_target,{range:1})
                    }
                }
            }else
                creep.moveTo(target,{range:1})
        else{
            mission = null
        }
    }else{
        let target = Game.getObjectById(mission.supply)
        if(target)
            if(creep.pos.isNearTo(target)){
                if(creep.withdraw(target,mission.type) != OK){
                    mission = null;
                    
                }
                if(mission){
                    let next_target = Game.getObjectById(mission.demand)
                    if(next_target){
                        creep.moveTo(next_target,{range:1})
                    }
                }
            }else
                creep.moveTo(target,{range:1})
        else{
            mission = null
        }
    }

    creep.memory.mission = mission;
    if(mission == null)return false;
    return true;
}

function getMissionType(roomName,type){
    let res = null;
    
    if(task[roomName][type] && task[roomName][type].supply.length && task[roomName][type].demand.length){
        if(task[roomName][type].supply[0].id == task[roomName][type].demand[0].id)return null;
        res = {
            'type':type,
            'supply':task[roomName][type].supply[0].id,
            'demand':task[roomName][type].demand[0].id,
        }
        task[roomName][type].supply.shift();
        task[roomName][type].demand.shift();
        
    }
    return res;
}

function getMission(roomName){
    var res = null;
    res = getMissionType(roomName,'energy')
    if(res)return res;
    for (var type in task[roomName]){
        res = getMissionType(roomName,type)
        if(res) return res;
    }
    return res;
}

module.exports = {
    run:function(){
        var roomNames
        if(Game.shard.name == 'shard2'){
            roomNames = ["E41N42","E41N35",'E39N51']
        }
        if(Game.shard.name == 'shard3'){
            roomNames = ['W47N21','W43N27','E39N49']
        }
        if(Game.shard.name == 'shard1'){
            roomNames = ['E39N51']
        }
        if(!roomNames)return;
        roomNames.forEach(roomName => {
            let room = Game.rooms[roomName]
            if(!room)return;
            if(!task[roomName]){
                task[roomName] = {}
            }
            var creep = Game.creeps['SUP_' + roomName];
            
            let busy = true;
            if(creep){
                if(runCreep(creep) == false){
                    busy = false;
                }
            }
            if(!busy){
                build_task(roomName)
                analye_task(roomName)
            }
        });
    }
}

var structures = {}

function getStruct(roomName,structureName){
    let room = Game.rooms[roomName]
    if(!structures[roomName]){
        structures[roomName] = {}
    }
    const main_flag = Game.flags['Main_'+roomName]
    var struct;
    if(main_flag){
        struct = room.find(FIND_STRUCTURES,{filter:(o)=>(
            o.structureType == structureName &&
            o.pos.x - main_flag.pos.x <=10 && o.pos.x - main_flag.pos.x >=3&&
            o.pos.y - main_flag.pos.y <=10 && o.pos.y - main_flag.pos.y >=3
        )})
    }else{
        if(structureName == 'link'){
            struct = room.find(FIND_STRUCTURES,{filter:(o)=>(
                o.structureType == structureName && Memory.inputLinks[room.name][o.id] == false
            )})
        }else{
            struct = room.find(FIND_STRUCTURES,{filter:(o)=>(
                o.structureType == structureName
            )})
        }
    }
    if(['spawn','tower'].indexOf(structureName) != -1){
        return struct;
    }
    if(struct.length>0){
        return struct[0]
    }
    return null;
}

