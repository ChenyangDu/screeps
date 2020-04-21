var autoConSite = require('autoConSite')
var harvester_old = require('role.harvester_old')
var badPerson;
module.exports = {
    run:function(){
        badPerson = false;
        for(let flagName in Game.flags){
            const flag = Game.flags[flagName]
            if(flag.color == COLOR_YELLOW && flag.secondaryColor == COLOR_BROWN){
                solve(flag);
                let reserveRoom = {};
                reserveRoom.spawn = flag.name.split('_')[0]
                reserveRoom.name = flag.pos.roomName
                
                runReserve(reserveRoom)
                defendCoreRoom(reserveRoom)
                defendCreepRoom(reserveRoom)
            }
        }
        for(let flagName in Game.flags){
            const flag = Game.flags[flagName]
            if(flag.color == COLOR_YELLOW && flag.secondaryColor == COLOR_ORANGE){
                let room = Game.rooms[flag.name.split('_')[0]];
                //if(!room || room.controller.level)
                runFlag(flag)
            }
        }
    }
}

function solve(flag){
    const roomName = flag.pos.roomName;
    const room = Game.rooms[roomName]
    if(!room || Game.time %100 != 0)return;
    let sources = room.find(FIND_SOURCES)
    sources.forEach(source => {
        let flagName = flag.name.split('_')[0]+'_'+flag.pos.roomName+'_'+source.id[source.id.length-1]
        source.pos.createFlag(flagName,COLOR_YELLOW,COLOR_ORANGE)
        Game.flags[flagName].memory
    });
}

function autoSpawn(creepName,body,dyingTick,spawnRoomName,work,flag){
    const creep0 = Game.creeps[creepName+'0'];
    const creep1 = Game.creeps[creepName+'1']
    var needToSpawn_name = null;
    if(!creep0 && !creep1){
        needToSpawn_name = creepName+'0'
    }
    if(creep0){
        work(creep0,flag)
        if(!creep1 && creep0.ticksToLive <= dyingTick)needToSpawn_name = creepName+'1'
    }
    if(creep1){
        work(creep1,flag)
        if(!creep0 && creep1.ticksToLive <= dyingTick)needToSpawn_name = creepName+'0'
    }
    if(Game.time - Memory.badAss[flag.pos.roomName] < 1500){
        //needToSpawn_name = null;
    }
    if(badPerson){
        needToSpawn_name = null;
    }
    if(needToSpawn_name){
        var spawn = getAvaliableSpawn(spawnRoomName)
        
        if(spawn){
            spawn.spawnCreep(body,needToSpawn_name,{memory:{harvesting:false}})
        }
    }
}

function runFlag(flag){
    const roomName = flag.name.split('_')[0]
    const room = Game.rooms[roomName]
    if(!room)return;
    const creepName = flag.name;

    
    autoSpawn('J_20_'+flag.name,[MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,CARRY,CARRY,CARRY,CARRY,
        WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,],100,roomName,harvester,flag)

    var baseBody = [CARRY,CARRY,MOVE],baseCost = 150
    var body = [],cost = 0
    while(cost + baseCost < room.energyCapacityAvailable && body.length + baseBody.length <= 50){
        cost += baseCost
        body = body.concat(baseBody)
    }
    autoSpawn('Y_20_'+flag.name,body,100,roomName,carryer,flag)

    let transferTarget = room.storage
    if(transferTarget && Game.time % 100 == 0){
        transferTarget.range = 1;
        //let path = 
        //let path = PathFinder.search(flag.pos,transferTarget).path
        let path = PathFinder.search(
            flag.pos, transferTarget,
            {
            // 我们需要把默认的移动成本设置的更高一点
            // 这样我们就可以在 roomCallback 里把道路移动成本设置的更低
            plainCost: 2,
            swampCost: 4,

            roomCallback: function(roomName) {

                let room = Game.rooms[roomName];
                // 在这个示例中，`room` 始终存在
                // 但是由于 PathFinder 支持跨多房间检索
                // 所以你要更加小心！
                if (!room) return;
                let costs = new PathFinder.CostMatrix;

                room.find(FIND_STRUCTURES).forEach(function(struct) {
                    if (struct.structureType === STRUCTURE_ROAD) {
                        // 相对于平原，寻路时将更倾向于道路
                        costs.set(struct.pos.x, struct.pos.y, 1);
                    } else if (struct.structureType !== STRUCTURE_CONTAINER &&
                                (struct.structureType !== STRUCTURE_RAMPART ||
                                !struct.my)) {
                        // 不能穿过无法行走的建筑
                        costs.set(struct.pos.x, struct.pos.y, 0xff);
                    }
                });
                room.find(FIND_CONSTRUCTION_SITES).forEach(function(site) {
                    if(site.structureType == STRUCTURE_ROAD){
                        costs.set(site.pos.x,site.pos.y,1);
                    }
                })

                return costs;
            },
            }
        );
        for(let i=0;i<path.path.length;i++){
            let pos = path.path[i];
            let type = STRUCTURE_ROAD
            if(i==0){
                type = STRUCTURE_CONTAINER
            }
            if(Game.rooms[pos.roomName] && i!=1){
                new RoomVisual(pos.roomName).circle(pos.x,pos.y);
                pos.createConstructionSite(type)
            }
        }
    }
}

function harvester(creep,flag){
    if(Game.time % 11 == 0){
        if(creep.room.find(FIND_MY_CONSTRUCTION_SITES).length)
            creep.memory.role = 'Nbuilder'
        else
            creep.memory.role = null;
    }
    if(creep.memory.role)return;
    let resource;
    if(flag.memory.resourceID){
        resource = Game.getObjectById(flag.memory.resourceID)
    }
    if(!resource && Game.rooms[flag.pos.roomName]){
        var resources = flag.pos.lookFor(LOOK_SOURCES)
        if(resources.length){
            resource = resources[0];
            flag.memory.resourceID = resource.id;
        }
    }

    let container = null;
    if(!flag.name.split('_')[0])return;
    let room = Game.rooms[flag.name.split('_')[0]];
    if(!room)return;
    if(flag.memory.resourceID){
        container = Game.getObjectById(flag.memory.containerID)
    }
    
    if(creep.pos.isNearTo(flag)){
        if(!container || container.store.getFreeCapacity('energy'))
        creep.harvest(resource)
        
        if(container && !creep.pos.isEqualTo(container)){
            creep.moveTo(container)
        }
    }else{
        if(creep.memory.getEnergy != true){
            let storage = creep.room.storage;
            if(storage.store.energy){
                if(creep.pos.isNearTo(storage)){
                    creep.withdraw(storage,'energy')
                }else{
                    creep.moveTo(storage,{range:1})
                }
            }else{
                harvester_old.getEnergy(creep)
            }
            if(creep.store.getFreeCapacity() == 0){
                creep.memory.getEnergy = true;
            }
        }else{
            creep.moveTo(flag,{range:1})
        }
    }
    let struct = creep.pos.lookFor(LOOK_STRUCTURES)
    if(struct.length)struct = struct[0];
    else struct = null;
    if(struct && struct.hitsMax - struct.hits >= 500 && creep.store.energy){
        creep.repair(struct)
    }
    
}

function carryer(creep,flag){
    let container = null;
    if(!flag.name.split('_')[0])return;
    let room = Game.rooms[flag.name.split('_')[0]];
    if(!room)return;
    if(flag.memory.resourceID){
        container = Game.getObjectById(flag.memory.containerID)
    }
    if(!container && Game.rooms[flag.pos.roomName]){
        var resources = flag.pos.findInRange(FIND_STRUCTURES,1,{
            filter:(o)=>(o.structureType == STRUCTURE_CONTAINER)
        })
        if(resources.length){
            container = resources[0];
            flag.memory.containerID = container.id;
        }
    }
    if(creep.store.getFreeCapacity() == 0){
        let storage = room.storage;
        if(!storage)return;
        if(creep.pos.isNearTo(storage)){
            creep.transfer(storage,'energy')
        }else{
            creep.moveTo(storage,{range:1})
        }
    }else if(container){
        if(creep.pos.isNearTo(container)){
            if(container.store.energy >= creep.store.getFreeCapacity('energy')){
                creep.withdraw(container,'energy')
            }
        }else{
            creep.moveTo(container,{range:1})
        }
    }else{
        if(!creep.pos.inRangeTo(flag,2)){
            creep.moveTo(flag,{range:2})
        }
    }
    const droppedResources = creep.pos.lookFor(LOOK_RESOURCES);
    if(droppedResources.length) {
        creep.pickup(droppedResources[0]) 
    }
    const tomb = creep.pos.lookFor(LOOK_TOMBSTONES);
    if(tomb.length){
        creep.withdraw(tomb[0],'energy')
    }
}

function getAvaliableSpawn(roomName){
    for (var spawnname in Game.spawns){
        var spawn = Game.spawns[spawnname]
        if(spawn.room.name == roomName && spawn.spawning == null){
            return spawn
        }
    }
    return null;
}

function runReserve(reserveRoom){
    const creepName = 'reserve_' + reserveRoom.name;
    var creep = Game.creeps[creepName]
    if(creep){
        if(creep.room.name != reserveRoom.name){
            creep.moveTo(new RoomPosition(25,25,reserveRoom.name))
            return;
        }
        const controller = creep.room.controller;
        
        if(!creep.pos.isNearTo(controller)){
            creep.moveTo(controller,{range:1,maxRooms:1})
        }else{
          //creep.signController(controller,"星星之火，可以燎原");
            if(creep.reserveController(controller) != OK){
                creep.attackController(controller)
            }
        }
        
    }
    if(!Memory.badAss){
        Memory.badAss = {}
    }
    const room = Game.rooms[reserveRoom.name]
    if(!creep){
        var tick = 0;
        if(room && room.controller && 
            room.controller.reservation && room.controller.reservation.username == 'ChenyangDu'){
                tick = room.controller.reservation.ticksToEnd
            }
        if(tick <= 2000 ){
            var spawn = getAvaliableSpawn(reserveRoom.spawn)
            var baseBody = [CLAIM,MOVE],baseCost = 650
            var body = [],cost = 0
            while(cost + baseCost <= Game.rooms[reserveRoom.spawn].energyCapacityAvailable && body.length + baseBody.length <= 8){
                cost += baseCost
                body = body.concat(baseBody)
            }
            if(spawn && !badPerson)spawn.spawnCreep(body,creepName)
        }
    }
}

function defendCoreRoom(defendRoom){
    const creepName = 'defend_' + defendRoom.name;
    var creep = Game.creeps[creepName]
    if(creep){
        if(creep.room.name != defendRoom.name){
            creep.moveTo(new RoomPosition(25,25,defendRoom.name))
            return;
        }
        let targets = creep.room.find(FIND_STRUCTURES,{
            filter:(o)=>(o.structureType == STRUCTURE_INVADER_CORE)
        })
        if(targets.length){
            if(creep.pos.isNearTo(targets[0])){
                creep.attack(targets[0])
            }else{
                creep.moveTo(targets[0],{range:1,maxRooms:1})
            }
        }
        
    }
    if(!creep && Game.time % 10 == 0 && Game.rooms[defendRoom.name]){
        let targets = Game.rooms[defendRoom.name].find(FIND_STRUCTURES,{
            filter:(o)=>(o.structureType == STRUCTURE_INVADER_CORE)
        })
        if(targets.length){
            var spawn = getAvaliableSpawn(defendRoom.spawn)
            
            if(spawn)spawn.spawnCreep([ATTACK,ATTACK,ATTACK,ATTACK,MOVE,MOVE],creepName)
        }
    }
}

function defendCreepRoom(defendRoom){
    const creepName = 'defend_creep_' + defendRoom.name;
    var creep = Game.creeps[creepName]
    if(creep){
        if(creep.room.name != defendRoom.name){
            creep.moveTo(new RoomPosition(25,25,defendRoom.name))
            return;
        }
        let myCreeps = creep.pos.findInRange(FIND_MY_CREEPS,3,{
            filter:(c)=>(c.hits<c.hitsMax)
        });
        if(myCreeps.length){
            myCreeps.sort((a,b)=>((b.hitsMax-b.hits-(a.hitsMax-a.hits))))
            if(myCreeps[0].pos.isNearTo(creep))
                creep.heal(myCreeps[0])
            else creep.rangedHeal(myCreeps[0])
        }
        let target = creep.pos.findClosestByPath(FIND_HOSTILE_CREEPS);
        if(target){
            
            if(creep.pos.inRangeTo(target,3)){
                creep.rangedAttack(target)
            }
            
            creep.moveTo(target,{range:1,maxRooms:1})
            
            let enermys = creep.pos.findInRange(FIND_HOSTILE_CREEPS,3)
            if(enermys.length > 1){
                creep.rangedMassAttack();
            }

        }else{
            myCreeps = creep.pos.findClosestByPath(FIND_MY_CREEPS,{
                filter:(c)=>(c.hits<c.hitsMax)
            })
            if(myCreeps){
                if(creep.pos.isNearTo(myCreeps)){
                    creep.heal(myCreeps)
                }else
                creep.moveTo(myCreeps,{range:1})
            }
        }
        
    }
    if(!creep && Game.time % 10 == 0 && Game.rooms[defendRoom.name]){
        let targets = Game.rooms[defendRoom.name].find(FIND_HOSTILE_CREEPS,{
            filter:(c)=>(c.hits>50)
        })
        if(targets.length){
            var spawn = getAvaliableSpawn(defendRoom.spawn)
            badPerson = true;
            if(spawn)spawn.spawnCreep([RANGED_ATTACK,RANGED_ATTACK,RANGED_ATTACK,RANGED_ATTACK,RANGED_ATTACK,
            HEAL,HEAL,HEAL,MOVE,MOVE,MOVE,MOVE,],creepName)
        }
    }
}