
var roleminer = require('miner')
 
function getAvaliableSpawn(room){
    for (var spawnname in Game.spawns){
        var spawn = Game.spawns[spawnname]
        if(spawn.room.name == room && spawn.spawning == null){
            return spawn
        }
    }
    return null;
}

module.exports = {
    run:function(room){
        spawn = getAvaliableSpawn(room)
        var upgraders = 0,harvesters = 0,miners = 0,supCarryers = 0,repairers = 0;
        let tStorage_helper = null;
        let tStorage = Game.rooms[room].tStorage();
        var main_flag = Game.flags['main_'+room];
        for(var name in Game.creeps){
            var creep = Game.creeps[name];
            if(creep.room.name == room)
                switch(creep.memory.role){
                    case 'Nupgrader':
                        upgraders++;
                        break;
                    case 'Nharvester':
                        harvesters++;
                        if(tStorage_helper == null){
                            tStorage_helper = creep;
                        }else if(creep.memory.srole == 'tStorage'){
                            tStorage_helper = creep;
                        }
                        break;
                    case 'Nbuilder':
                        upgraders++
                        break;
                    case 'miner':
                        miners++
                        roleminer.run(creep)
                        break;
                    case 'supCarryer':
                        supCarryers++
                        break;
                    case 'repairer':
                        repairers++;
                        break;
                }
        }
        let busy = false;
        
        if(tStorage_helper){
            if(harvesters > 1 && tStorage && tStorage.store.energy < 2000)
                tStorage_helper.memory.srole = 'tStorage';
            else{
                tStorage_helper.memory.srole = 'Nharvester'
            }
        }

        var havConstructionSite = 0;
        if(Game.time % 20 == 0 && Game.rooms[room].find(FIND_CONSTRUCTION_SITES).length)
            havConstructionSite = Game.rooms[room].find(FIND_CONSTRUCTION_SITES).length;
        
        if(havConstructionSite){
            for(var name in Game.creeps){
                var creep = Game.creeps[name];
                if(creep.room.name == room && creep.memory.role == 'Nupgrader'){
                    creep.memory.role = 'Nbuilder'
                    creep.memory.building = true;
                }
            }
            
        }

        if(!spawn)return;

        var energyAvai = spawn.room.energyAvailable;
        var energyCap = spawn.room.energyCapacityAvailable;
        /*
        if(energyAvai == energyCap && room == 'E41N42' && Game.time % 1000 < 30){
            spawn.spawnCreep([WORK,WORK,WORK,WORK,WORK,WORK,
                CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,
                MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,
                WORK,WORK,WORK,WORK,WORK,WORK,
                CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,
                MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,],'tmpBuilder_'+Game.time,{memory:{role:'tmpbuilder'}})
        }*/
        
        var max_sum_harvesters = 2
        if(Game.rooms[room].controller.level < 8){
            max_sum_harvesters = Math.max(2,upgraders+1)
        }
        if(Game.rooms[room].controller.level == 8 && room != 'W9S11'){
            max_sum_harvesters = 1;
        }
        
        if(harvesters < max_sum_harvesters){
            var body = [];
            if(harvesters != 0){
                energyAvai = spawn.room.energyCapacityAvailable;
            }
            if(energyAvai <= 300)
                body = [WORK,CARRY,MOVE,MOVE]
            else{
                var baseBody = [CARRY,CARRY,MOVE,],baseCost = 150
                var body = [WORK,CARRY,MOVE,],cost = 200
                while(cost + baseCost <= energyAvai && body.length + baseBody.length <= 50){
                    cost += baseCost
                    body = body.concat(baseBody)
                }
            }
            spawn.spawnCreep(body,'Nharvester'+Game.time%1000,{memory:{role:'Nharvester',harvesting : false}})
            busy = true;
        }
        

        
        if(Game.rooms[room].controller.level < 8){
            new RoomVisual(room).text(Game.rooms[room].energyAvailable + '/' + Game.rooms[room].energyCapacityAvailable,spawn.pos.x,spawn.pos.y-1);
        }
        const storage = Game.rooms[room].storage;
        if(storage){
            new RoomVisual(room).text(storage.store['energy'],storage.x,storage.y-1)
        }
        
        var needToSpawnUpgrader = false;
        if(Game.rooms[room].controller.level <= 1){
            needToSpawnUpgrader = true;
        }else if(Game.rooms[room].controller.level <8){
            //console.log(energyInContainer(room))
            if(upgraders < 1 || energyInContainer(room) >= 666 )
                needToSpawnUpgrader = true;
            if(Game.rooms[room].storage && Game.rooms[room].storage.store[RESOURCE_ENERGY] >= 25*1000){
                needToSpawnUpgrader = true;
            }
            if(Game.rooms[room].terminal && Game.rooms[room].terminal.store[RESOURCE_ENERGY] >= 50*1000){
                needToSpawnUpgrader = true;
            }
            
            if(upgraders >= 8){
                needToSpawnUpgrader = false;
            } 
            /*
            if(upgraders  >= 7 && Game.rooms[room].controller.level == 7)
                needToSpawnUpgrader = false;*/
        }else if(Game.rooms[room].controller.level == 8){
            if(upgraders < 1 && Game.rooms[room].storage && Game.rooms[room].storage.store.energy >= 500*1000){
                needToSpawnUpgrader = true;
            }
            if(Game.rooms[room].controller.ticksToDowngrade <= 150000 && upgraders  == 0)
                needToSpawnUpgrader = true;
            if(havConstructionSite && upgraders  < 1){
                needToSpawnUpgrader = true;
            }
        }
        //console.log(needToSpawnUpgrader)
        if(upgraders >= 1 && harvesters < max_sum_harvesters){
            needToSpawnUpgrader = false;
        }
        energyAvai = Game.rooms[room].energyCapacityAvailable
        if(needToSpawnUpgrader ){

            if(energyAvai <= 300)
                body = [WORK,WORK,CARRY,MOVE]
            else{
                var baseBody = [WORK,CARRY,MOVE,],baseCost = 200
                var body = [WORK,CARRY,MOVE,],cost = 200
                while(cost + baseCost <= energyAvai && body.length + baseBody.length <= 50){
                    cost += baseCost
                    body = body.concat(baseBody)
                }/*
                baseBody = [WORK,WORK,MOVE,],baseCost = 250
                while(cost + baseCost <= energyAvai && body.length + baseBody.length <= 50){
                    cost += baseCost
                    body = body.concat(baseBody)
                }*/
                baseBody = [WORK,MOVE,],baseCost = 150
                while(cost + baseCost <= energyAvai && body.length + baseBody.length <= 50){
                    cost += baseCost
                    body = body.concat(baseBody)
                }
            }
            spawn.spawnCreep(body,
                'Nupgrader_'+spawn.room.name+'_'+Game.time,{memory:{role:'Nupgrader',upgrading : false}})
            busy = true;
        }
        
        
        
        
        if(spawn.room.controller.level >= 6){
            var max_sum_miners = 1;
            var body;
            if(spawn.room.energyCapacityAvailable>=3250)
                body = [WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,
                    WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,
                    MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,]
            else{
                body = [WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,
                    CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,
                    MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,]
            }
            if(Game.time % 10 == 0 && miners < max_sum_miners){
                let mineral = spawn.room.find(FIND_MINERALS)[0]
                if(spawn.room.storage && mineral.mineralAmount > 0 && spawn.room.storage.store[mineral.mineralType] <= 50000){
                    spawn.spawnCreep(body,'miner_'+spawn.room.name+'_'+Game.time,{memory:{role:'miner',harvesting : false}})
                    busy = true;
                }
            }
        }
        
        if(supCarryers < 1 && Game.rooms[room].controller.level >= 5){
            if(main_flag){
                var spawn_main = Game.spawns[room+'_0']
                if(spawn_main)
                spawn_main.spawnCreep([CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,
                    CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,],'SUP_'+room,
                {memory:{role:'supCarryer',job:'energy'},directions:[spawn_main.pos.getDirectionTo(main_flag)]});
                
            }else{
                let body = [CARRY,CARRY,MOVE,CARRY,CARRY,MOVE,CARRY,CARRY,MOVE,CARRY,CARRY,MOVE,];
                if(room == 'E41N42'){
                    body = [CARRY,CARRY,MOVE,CARRY,CARRY,MOVE,CARRY,CARRY,MOVE,CARRY,CARRY,MOVE,
                        CARRY,CARRY,MOVE,CARRY,CARRY,MOVE,CARRY,CARRY,MOVE,CARRY,CARRY,MOVE,
                        CARRY,CARRY,MOVE,CARRY,CARRY,MOVE,CARRY,CARRY,MOVE,CARRY,CARRY,MOVE,]
                }
                spawn.spawnCreep(body,'SUP_'+room,
                {memory:{role:'supCarryer',job:'energy'}})
            }
            busy = true;
        }
        
        if(main_flag){
            const creep = Game.creeps['SUP_'+room]
            if(creep && creep.ticksToLive < 1400){
                const spawn_main = Game.spawns[room+'_0']
                if(spawn_main)
                    spawn_main.renewCreep(creep)
            }
            
        }
        let needRepairer = false;
        if(repairers < 1 && spawn.room.storage && 
            (spawn.room.storage.store.getUsedCapacity() >= 800000 || 
            spawn.room.storage.store.getUsedCapacity('energy') >= 500000)){
            needRepairer = true;
        }
        if(repairers < 0 && (room == 'W39N26' || room == 'W47N21')){
            needRepairer = true;
        }
        if(repairers < 4 && Game.shard.name == 'shard2' && spawn.room.controller.level == 8 && 
        spawn.room.storage && spawn.room.storage.store.energy >= 300000){
            needRepairer = true;
        }
        
        if(needRepairer){
            const creepName = 'repair_'+room;
            spawn.spawnCreep([WORK,CARRY,MOVE,WORK,CARRY,MOVE,WORK,CARRY,MOVE,WORK,CARRY,MOVE,
                WORK,CARRY,MOVE,WORK,CARRY,MOVE,WORK,CARRY,MOVE,WORK,CARRY,MOVE,
                WORK,CARRY,MOVE,WORK,CARRY,MOVE,WORK,CARRY,MOVE,WORK,CARRY,MOVE,
                WORK,CARRY,MOVE,WORK,CARRY,MOVE,WORK,CARRY,MOVE,WORK,CARRY,MOVE,],
                creepName + Game.time,{memory:{role:'repairer'}})
            busy = true;
        }

        if(!busy){
            let list = spawn.room.memory.spawnList
            if(list && list.length){
                if(spawn.spawnCreep(list[0].body,list[0].name,list[0].opt) == OK)
                    list.splice(0,1)
                    
            }
        }
        
        if(main_flag && Game.time % 100 == 0){
            var structures = main_flag.pos.findInRange(FIND_STRUCTURES,1)
            const spawn = structures.filter((o)=>o.structureType == STRUCTURE_SPAWN)
            if(spawn.length){
                main_flag.memory.spawnId = spawn[0].id;
            }
            const link = structures.filter((o)=>o.structureType == STRUCTURE_LINK)
            if(link.length){
                main_flag.memory.linkId = link[0].id;
            }
            const towers = structures.filter((o)=>o.structureType == STRUCTURE_TOWER)
            if(towers.length){
                main_flag.memory.towersId = [];
                towers.forEach(tower => {
                    main_flag.memory.towersId.push(tower.id)
                });
            }
        }
    }
   
};
function haveSourceKeeper(roomName){
    var ok = true;
    for(var flagName in Game.flags){
        var flag = Game.flags[flagName];
        if(flag.pos.roomName == roomName && flag.color == COLOR_YELLOW){
            ok = false;
            if((Game.creeps[flagName + '_0'] && Game.creeps[flagName + '_0'].ticksToLive<=1499)|| 
            (Game.creeps[flagName + '_1'] && Game.creeps[flagName + '_1'].ticksToLive<=1499)){
                ok = true;
            }
        }
    }
    return ok;
}

function energyInContainer(roomName){
    var amount = 0;
    let containers = Game.rooms[roomName].find(FIND_STRUCTURES,{
        filter:(o)=>(o.structureType == STRUCTURE_CONTAINER)
    })
    containers.forEach(container => {
        amount += container.store[RESOURCE_ENERGY]
    });
    if(containers.length)return amount/containers.length;
    else return 1000;
}