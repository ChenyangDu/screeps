/**
 * 负责harvester upgrader builder
 * 以及统计所有的carryers
 */
var roleHarvester = require('role.harvester');
var roleUpgrader = require('role.upgrader');
var roleBuilder = require('role.builder');
var carryTaskCtrl = require('carryTaskCtrl')
var spawnCtrl = require('spawnCtrl');

const myrooms = _.filter(Game.rooms, (x) => x.controller && x.controller.my)

let allCreeps = {}

module.exports = {
    run(){
        runCreep();
        spawnCreep();
    },
    init,
    getAllCreeps(){
        return allCreeps
    }
}

function init(){
    allCreeps = {}
    for(let name in Game.creeps){
        let creep = Game.creeps[name]
        let roomName = creep.room.name;

        if(!allCreeps[roomName])allCreeps[roomName] = {}
        
        switch(creep.memory.role){
            case 'harvester':
                addCnt(roomName,creep);break;
            case 'upgrader':
                addCnt(roomName,creep);break;
            case 'builder':
                addCnt(roomName,creep);break;
            case 'carryer':
                addCnt(roomName,creep);break;
        }
        
    }
}

function runCreep(){
    
    // 搬运任务初始化
    carryTaskCtrl.registClear();

    // 是否有建筑点
    let havConstructionSites = {};
    for(let room of Game.myrooms){
        if(Game.time % 23 == 0 && room.find(FIND_CONSTRUCTION_SITES).length)
            havConstructionSites[room.name] = true;
    }

    for(let roomName in allCreeps){
        // harvester
        let creeps = allCreeps[roomName]["harvester"]
        if(creeps && creeps.length)
            for(let creep of creeps){
                // roleHarvester.run(creep);
            }
        // upgrader
        creeps = allCreeps[roomName]["upgrader"]
        if(creeps && creeps.length)
            for(let creep of creeps){
                if(havConstructionSites[roomName]){
                    creep.memory.role = 'builder'
                    roleBuilder.run(creep);
                }
                roleUpgrader.run(creep);
            }
        // builder
        creeps = allCreeps[roomName]["builder"]
        if(creeps && creeps.length)
            for(let creep of creeps){
                roleBuilder.run(creep);
            }
    }
}
/**
 * 统计各类角色的数量
 */
function addCnt(roomName,creep){
    if(!allCreeps[roomName][creep.memory.role]){
        allCreeps[roomName][creep.memory.role] = []
    }
    allCreeps[roomName][creep.memory.role].push(creep)
}

function getCnt(roomName,role){
    if(allCreeps[roomName] && allCreeps[roomName][role])return allCreeps[roomName][role].length;
    return 0;
}

function spawnCreep(){
    for(let room of myrooms){
        room = Game.rooms[room.name];
        spawnHarvester(room);
        spawnUpgrader(room);
    }
}

function spawnListHaveRole(room,role){
    return spawnCtrl.getList(room,o=>o.opt && o.opt.memory && o.opt.memory.role == role).length > 0
    let spawnList = null;
    if(room.memory)
        spawnList = room.memory.spawnList;
    if(spawnList && spawnList.length)
        for(let pre of spawnList){
            if(pre.opt && pre.opt.memory&&pre.opt.memory.role == role){
                return true;
            }
        }
    return false;
}

function spawnHarvester(room){
    if(spawnListHaveRole(room,"harvester")){
        return;
    }
    if(needHarvester(room)){
        spawnHarvesterReal(room);
    }
}

function needHarvester(room){
    // 如果没有搬运工且harvester快挂了
    if (allCreeps[room.name] && !allCreeps[room.name]["carryer"]){
        let maxlife = 0;// 最长的harvester寿命
        if(allCreeps[room.name]["harvester"])
            for(let creep of allCreeps[room.name]["harvester"]){
                maxlife = _.max([maxlife,creep.ticksToLive])
            }
            
        if(maxlife <= 50){
            return true
        }
    }
    // todo 如果upgrader/builder较多
    
    // return !haveEnergyIncome(room)
    
    let max_sum_harvesters
    if(!allCreeps[room.name])allCreeps[room.name] = {}
    let harvesters = getCnt(room.name,"harvester");
    let upgraders = getCnt(room.name,"upgrader")+getCnt(room.name,"builder");
    
    if(room.controller.level < 8){
        max_sum_harvesters = Math.max(1,(upgraders-1)/2)
    }
    if(room.controller.level == 8){
        max_sum_harvesters = 1;
    }
    if(!haveEnergyIncome(room))return true;
    
    return harvesters< max_sum_harvesters;
}

function spawnHarvesterReal(room){
    var body = [];
    let energyAvai = room.energyCapacityAvailable;
    let harvesters = getCnt(room.name,"harvester");
    let priority = 3

    if(haveEnergyIncome(room)){
        // 如果房间中有矿机
        if(harvesters == 0)energyAvai = room.energyAvailable
        if(energyAvai <= 300)
            body = [CARRY,CARRY,CARRY,MOVE,MOVE,MOVE]
        else{
            let baseBody = [CARRY,CARRY,MOVE,],baseCost = 150
            body = [],cost = 0
            while(cost + baseCost <= energyAvai && body.length + baseBody.length <= 50){
                cost += baseCost
                body = body.concat(baseBody)
            }
        }
    }else{
        // 如果房间中没有矿机，
        energyAvai = room.energyAvailable
        let baseBody = [CARRY,CARRY,MOVE,],baseCost = 150
        body = [WORK,CARRY,MOVE,MOVE],cost = 250
        while(cost + baseCost <= energyAvai && body.length + baseBody.length <= 50){
            cost += baseCost
            body = body.concat(baseBody)
        }
        priority = 2
    }
    spawnCtrl.addSpawnList(room.name,body,
        'harvester'+Game.time%1000,
        {memory:{role:'harvester',harvesting : false}},priority)
}
/**
 * 判断房间是否有能量来源
 */
function haveEnergyIncome(room){
    // 首先判断所有harvester是否有work部件
    if(allCreeps[room.name] && allCreeps[room.name]["harvester"])
        for(let creep of allCreeps[room.name]["harvester"]){
            let havework = false;
            for(let part of creep.body){
                if(part.type == WORK){
                    havework = true;
                }
            }
            if(havework)return true;
        }
    return haveSourceKeeper(room)
}
/**
 * 判断是否有专业矿机
 */
function haveSourceKeeper(room){
    // 找到所有"黄黄"旗
    const flags = room.find(FIND_FLAGS,{
        filter:{color : COLOR_YELLOW , secondaryColor : COLOR_YELLOW}
    })
    for(let flag of flags){
        for(let id of [0,1]){
            let creepname = flag.name+"_"+id;
            // 如果creep存在返回真
            if(Game.creeps[creepname])return true;
        }
    }
    //不存在矿机的creep
    return false;
}

function spawnUpgrader(room){
    if(spawnListHaveRole(room,"upgrader")){
        return;
    }
    if(needUpgrader(room)){
        spawnUpgraderReal(room);
    }
}

function needUpgrader(room){
    let needToSpawn = false;
    let upgraders = getCnt(room.name,"upgrader")+getCnt(room.name,"builder");
    
    if(room.controller.level <= 1 && upgraders <= 6){
        needToSpawn = true;
    }else if(room.controller.level <8){
        //console.log(energyInContainer(room))
        if(upgraders < 1 || energyInContainer(room) >= 1000 )
            needToSpawn = true;
        if(room.storage && room.storage.store[RESOURCE_ENERGY] >= 25*1000){
            needToSpawn = true;
        }
        if(room.terminal && room.terminal.store[RESOURCE_ENERGY] >= 50*1000){
            needToSpawn = true;
        }
        
        if(upgraders >= 8){
            needToSpawn = false;
        } 
        /*
        if(upgraders  >= 7 && Game.rooms[room].controller.level == 7)
            needToSpawnUpgrader = false;*/
    }else if(Game.rooms[room].controller.level == 8){
        if(upgraders < 1 && Game.rooms[room].storage && Game.rooms[room].storage.store.energy >= 500*1000){
            needToSpawn = true;
        }
        if(Game.rooms[room].controller.ticksToDowngrade <= 150000 && upgraders  == 0)
            needToSpawn = true;
        if(havConstructionSite && upgraders  < 1){
            needToSpawn = true;
        }
    }
    //console.log(needToSpawnUpgrader)
    if(upgraders >= 1 && spawnListHaveRole("harvester")){
        needToSpawn = false;
    }
    return needToSpawn;
}

function spawnUpgraderReal(room){
    let energyAvai = room.energyCapacityAvailable
    
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
    spawnCtrl.addSpawnList(room.name,body,
        'upgrader_'+room.name+'_'+Game.time,
        {memory:{role:'upgrader',upgrading : false}})
}

function energyInContainer(room){
    var amount = 0;
    let containers = room.find(FIND_STRUCTURES,{
        filter:(o)=>(o.structureType == STRUCTURE_CONTAINER && 
            o.pos.lookFor(LOOK_FLAGS).length)
    })
    containers.forEach(container => {
        amount += container.store[RESOURCE_ENERGY]
    });
    if(containers.length)return amount/containers.length;
    else return 1000;
}