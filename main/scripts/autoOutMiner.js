var autoConSite = require('autoConSite')
var spawnCtrl = require('spawnCtrl')
var harvester_old = require('role.harvester_old')
var badPerson;
/**
 * 【功能】全自动外矿
 * 【结构】占用黄棕色、黄橙色旗子、Memory.rooms.xxx.outminer
 *  todo 修路的时候别造carryer
 */
module.exports = {
    run:function(){
        badPerson = false;
        // 找到黄棕色旗子，命名格式需要为"出生房间_当前房间"
        for(let flagName in Game.flags){
            const flag = Game.flags[flagName]
            if(flag.color == COLOR_YELLOW && flag.secondaryColor == COLOR_BROWN){

                let reserveRoom = {};
                reserveRoom.spawn = flag.name.split('_')[0]
                reserveRoom.name = flag.pos.roomName

                // 出生房间不存在就拔旗
                if(!Game.rooms[reserveRoom.spawn]){
                    removeFlag(Game.rooms[reserveRoom.spawn])
                    // todo 把source上面的旗也拔了
                    continue
                }
                // 能量不足产生reserve
                let energyCap = Game.rooms[reserveRoom.spawn].energyCapacityAvailable;
                if(energyCap < 650)continue;

                //给每个source上面插旗
                // solve(flag);
                
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
    },
    // 判断房间是否适合作为外矿
    /**
     * 
     * @param {Room} outroom 
     * @returns 
     */
    watchReverse(outroom){
        
        // 没控制器不行
        if(!outroom.controller)return
        // 有主的就算了
        if(outroom.controller.level > 0)return;
        let res = findSpawnRoom(outroom)
        if(res == null)return
        let spawnroom = res.room
        let dis = res.dis

        // Memory初始化
        let memory = spawnroom.memory.outminer
        if(!memory){
            memory = spawnroom.memory.outminer = {}
        }
        let outrooms = memory.outrooms
        if(!outrooms){
            outrooms = memory.outrooms = []
        }

        // 加入到spawnroom的外矿备选房间当中
        let isIn = false;
        for(let o of outrooms){
            if(o.roomName == outroom.name){
                o.dis = dis
                isIn = true;
                break;
            }
        }
        if(!isIn){
            outrooms.push({
                roomName:outroom.name,
                dis,
            })
        }
        // 距离最短的4个房间作为外矿
        outrooms.sort((a,b)=>(a.dis - b.dis))
        let len = Math.min(outrooms.length,2)
        for(let i=0;i<len;i++){
            let pos = new RoomPosition(25,25,outrooms[i].roomName)
            let flag = Game.flags[spawnroom.name+"_"+outrooms[i].roomName]
            if(!flag){
                if(Game.rooms[outrooms[i].roomName])
                pos.createFlag(spawnroom.name+"_"+outrooms[i].roomName,COLOR_YELLOW,COLOR_BROWN)
            }
        }
        //其他的旗子拔了
        for(let i=len;i<outrooms.length;i++){
            let flag = Game.flags[spawnroom.name+"_"+outrooms[i].roomName]
            if(flag){
                removeFlag(flag.pos.roomName)
            }
        }
    }
}
// 在每个source上面插"黄橙"旗
function solve(flag){
    if(Game.time %200 != 0)return;
    const roomName = flag.pos.roomName;
    const room = Game.rooms[roomName]
    if(!room){
        console.log('没有视野的旗子',flag.pos);
        return;
    }
    let sources = room.find(FIND_SOURCES)
    sources.forEach(source => {
        let flagName = flag.name.split('_')[0]+'_'+flag.pos.roomName+'_'+source.id[source.id.length-1]
        source.pos.createFlag(flagName,COLOR_YELLOW,COLOR_ORANGE)
        //Game.flags[flagName].memory
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
    // 如果以creepName开头的creep已经在生产队列中就不用添加了
    if(spawnCtrl.getList(Game.rooms[spawnRoomName],(pre)=>{
        return pre.name.indexOf(creepName)==0;
    }).length){
        needToSpawn_name = null;
    }
    if(needToSpawn_name){
        spawnCtrl.addSpawnList(spawnRoomName,body,needToSpawn_name,{memory:{harvesting:false}})
        
    }
}

function removeFlag(roomName){
    for(let flagName in Game.flags){
        const flag = Game.flags[flagName]
        if(flag.pos.roomName == roomName && flag.color == COLOR_YELLOW && 
            (flag.secondaryColor == COLOR_BROWN || flag.secondaryColor == COLOR_ORANGE)){
                flag.remove();
            }
    }
}

function runFlag(flag){
    const roomName = flag.name.split('_')[0]
    const room = Game.rooms[roomName]
    if(!room)return;

    
    autoSpawn('歼20_'+flag.name,
        spawnCtrl.getbody([],[MOVE,MOVE,MOVE,CARRY,CARRY,WORK,WORK,WORK,WORK,],room.energyCapacityAvailable)
        ,100,roomName,harvester,flag)

    autoSpawn('运20_'+flag.name,
        spawnCtrl.getbody([],[CARRY,CARRY,MOVE,],room.energyCapacityAvailable)
        ,100,roomName,carryer,flag)

    let transferTarget = getTransferTarget(room)
    
    if(transferTarget && Game.time % 199 == 0){
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
    if(Game.time % 17 == 0 && creep.store.getFreeCapacity() == 0){
        if(creep.store.energy && creep.room.find(FIND_MY_CONSTRUCTION_SITES).length){
            creep.memory.role = 'builder';
            creep.memory.building = true;
        }
        else creep.memory.role = null
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
            if(storage && storage.store.energy){
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
            if(container){// 这句是有用的，不能删
                creep.moveTo(container)
            }else{
                creep.moveTo(flag,{range:1})
            }
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
        let storage = getTransferTarget(room)
        if(!storage)return;
        if(creep.pos.isNearTo(storage)){
            creep.transfer(storage,'energy')
            creep.moveTo(flag)
        }else{
            creep.moveTo(storage,{range:1})
        }
    }else if(container){
        if(creep.pos.isNearTo(container)){
            if(container.store.energy >= creep.store.getFreeCapacity('energy')){
                creep.withdraw(container,'energy')
            }
            if(!flag.memory.path_length){
                flag.memory.path_length = 1500;
            }
            
            flag.memory.path_length = Math.min(flag.memory.path_length,1500,1500-creep.ticksToLive)
        }else{
            if(creep.pos.inRangeTo(container,3)){
                creep.moveTo(container,{range:1,ignoreCreeps:false})
            }else
                creep.moveTo(container,{range:1})
        }
    }else{
        if(!creep.pos.inRangeTo(flag,2)){
            if(creep.pos.inRangeTo(flag,5)){
                creep.moveTo(flag,{range:2,ignoreCreeps:false})
            }else
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

function getTransferTarget(room){
    if(room.storage)return room.storage;
    if(room.tStorage())return room.tStorage();
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
            if(!badPerson)
                spawnCtrl.addSpawnList(reserveRoom.spawn,body,creepName)
                
        }
    }
}

function defendCoreRoom(defendRoom){
    const creepName = 'defend_' + defendRoom.name;
    var creep = Game.creeps[creepName]
    let room = Game.rooms[defendRoom.name];
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
    if(!creep && Game.time % 10 == 0 && room){
        let targets = room.find(FIND_STRUCTURES,{
            filter:(o)=>(o.structureType == STRUCTURE_INVADER_CORE)
        })
        if(targets.length){
            spawnCtrl.addSpawnList(defendRoom.spawn,
                spawnCtrl.getbody([],[ATTACK,ATTACK,MOVE,],Game.rooms[defendRoom.spawn].energyCapacityAvailable,6),
                creepName);
            
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
        let myCreeps = creep.pos.findInRange(FIND_MY_CREEPS,1,{
            filter:(c)=>(c.hits<c.hitsMax)
        });
        if(myCreeps.length){
            myCreeps.sort((a,b)=>((b.hitsMax-b.hits-(a.hitsMax-a.hits))))
            if(myCreeps[0].pos.isNearTo(creep))
                creep.heal(myCreeps[0])
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
                creep.moveTo(myCreeps,{range:1,ignoreCreeps:false})
            }
        }
        
    }
    if(!creep && Game.time % 10 == 0 && Game.rooms[defendRoom.name]){
        let targets = Game.rooms[defendRoom.name].find(FIND_HOSTILE_CREEPS,{
            filter:(c)=>(c.hits>50)
        })
        if(targets.length){
            badPerson = true;
            spawnCtrl.addSpawnList(defendRoom.spawn,
                spawnCtrl.getbody([],[RANGED_ATTACK,HEAL,MOVE,],Game.rooms[defendRoom.spawn].energyCapacityAvailable,12)
                ,creepName)
        }
    }
}
/**
 * 找到适合这个外矿的出生房间
 * @param {Room} outroom 
 * @returns {Obejct} {room,dis}
 */
function findSpawnRoom(outroom){
    let sources = outroom.find(FIND_SOURCES)
    if(!sources || sources.length == 0)return null;

    let spawnrooms = [];
    for(let room of Game.myrooms){
        
        if(disRoom(room.name,outroom.name) <= 2){
            
            // 计算两个矿点到达出生房间内的距离
            let target = getTransferTarget(room)
            if(!target)continue
            let dis = 0;
            sources.forEach(source=>{
                let res = myPathFinder(source.pos,{pos:target.pos,range:1})
                if(!res.incomplete) dis += res.path.length
            })
            dis /= sources.length
            if(dis > 0){
                spawnrooms.push({
                    room,dis,
                })
            }
            
        }
    }
    if(spawnrooms.length == 0)return null;
    spawnrooms.sort((a,b) => a.dis - b.dis);
    return spawnrooms[0];
}

function myPathFinder(startPos, target){
    let ret = PathFinder.search(
        startPos, target,
        {
          // 我们需要把默认的移动成本设置的更高一点
          // 这样我们就可以在 roomCallback 里把道路移动成本设置的更低
          plainCost: 2,
          swampCost: 10,
    
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
    
            // // 躲避房间中的 creep
            // room.find(FIND_CREEPS).forEach(function(creep) {
            //   costs.set(creep.pos.x, creep.pos.y, 0xff);
            // });
    
            return costs;
          },
        }
    );
    return ret;
}

// 返回a/b房间之间的曼哈顿距离
function disRoom(a,b){
    let pa = roomNameToNum(a)
    let pb = roomNameToNum(b)
    
    return Math.abs(pa.x-pb.x)+Math.abs(pa.y-pb.y);
}

//房间名称和坐标互相转化，其中设E0S0为(0,0),ES区域的坐标为正
function roomNameToNum(roomName){
    let parsed = /^[WE]([0-9]+)[NS]([0-9]+)$/.exec(roomName);
    let x,y;
    x = parseInt(parsed[1]),y = parseInt(parsed[2]);
    if(roomName.indexOf('W') != -1){
        x = -x-1;
    }
    if(roomName.indexOf('N') != -1){
        y = -y-1;
    }
    return {x,y};
}