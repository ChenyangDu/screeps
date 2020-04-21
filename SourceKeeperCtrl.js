/**********************************************

author：ChenyangDu
version:2.1

矿机自动化：
功能：新老矿机自动交替，矿机位置自动建造container，矿机自动寻找周围一格内的link并填充

使用方法：
1、在energy临近一格的位置插上旗，旗的两个颜色要都是黄色。
2、该房间内有自己的spawn，该代码不适用于外矿
2、（非必须）在旗子附近一格内建造link，矿机会自动填充link，以及从container里面取能量填充到link。

代码部分如下

var SourceKeeperCtrl = require('SourceKeeperCtrl')

module.exports.loop = function () {
    SourceKeeperCtrl.run();

    //your code

}

***************************************************/


//该部分代码主要实现新老creep交替，用命名来区分，后缀分别为0或1

const needContainer = true;
const needToSaveCpu = true;//可以生产10WORK的creep快速挖矿，然后休息，用能量换CPU的方法
const usdCreepMove_Yuan = false;//如果你使用了Yuandiaodiaodiao所写的对穿，那么可以把这个设置为true，要不然新老creep交替会鬼畜

function flagRun(flag){
    const creep0 = Game.creeps[flag.name + '_0']
    const creep1 = Game.creeps[flag.name + '_1']
    const dyingTick = 50;//其中一个寿命不足50就生产另一个，常数可以调整，也可以不用常数
    var needToSpawnName = null;
    if(!creep0 && !creep1){
        needToSpawnName = flag.name + '_1'
    }
    if(creep0){
        SourceKeeper(creep0,flag)
        if(!creep1 & creep0.ticksToLive <= dyingTick){
            needToSpawnName = flag.name + '_1';
        }
    }
    if(creep1){
        SourceKeeper(creep1,flag)
        if(!creep0 & creep1.ticksToLive <= dyingTick){
            needToSpawnName = flag.name + '_0';
        }
    }
    if(needToSpawnName){
        var spawn = getAvaliableSpawn(flag.pos.roomName)
        if(spawn){
            //这里的body如不满意可以自行调整
            var body = [WORK,WORK,MOVE]
            var energyHave = spawn.room.energyCapacityAvailable
            if(energyHave >= 350){
                body = [WORK,WORK,WORK,MOVE]
            }
            if(energyHave >= 450){
                body = [WORK,WORK,WORK,WORK,MOVE]
            }
            if(spawn.room.energyCapacityAvailable >= 550){
                body = [WORK,WORK,WORK,WORK,WORK,MOVE]
            }
            if(spawn.room.energyCapacityAvailable >= 700){
                body = [MOVE,MOVE,MOVE,CARRY,WORK,WORK,WORK,WORK,WORK]
            }
            if(needToSaveCpu && spawn.room.energyCapacityAvailable >= 2000){
                body = [MOVE,MOVE,MOVE,CARRY,WORK,WORK,WORK,WORK,WORK,
                    MOVE,MOVE,WORK,WORK,WORK,WORK,WORK]
            }
            spawn.spawnCreep(body,needToSpawnName)
        }
    }
}

module.exports = {
    run:function(){
        for(var flagName in Game.flags){
            var flag = Game.flags[flagName]
            if(flag.color == COLOR_YELLOW && flag.secondaryColor == COLOR_YELLOW){
                flagRun(flag)
            }
        }
    }
};
//找到可以该房间内空闲的spawn
function getAvaliableSpawn(roomName){
    for (var spawnName in Game.spawns){
        var spawn = Game.spawns[spawnName]
        if(spawn.room.name == roomName && spawn.spawning == null){
            return spawn
        }
    }
    return null;
}

//这部分主要负责控制creep
function SourceKeeper (creep,flag){
    //container不存在就建一个
    var container = Game.getObjectById(flag.memory.container);
    if(needContainer){
        if(!container){
            container = flag.pos.lookFor(LOOK_STRUCTURES).find(o =>(o.structureType == STRUCTURE_CONTAINER))
            if(!container){
                flag.pos.createConstructionSite(STRUCTURE_CONTAINER)
            }else{
                flag.memory.container = container.id;
            }
        }else {
        creep.say(container.store[RESOURCE_ENERGY])
        }
    }
    //移动到旗子
    if(!creep.pos.isEqualTo(flag.pos)){
        if(usdCreepMove_Yuan){
            creep.moveTo(flag,{ignoreCreeps:false})
        }else{
            creep.moveTo(flag);
        }
        return;
    }
    //现在确保移动到了旗子位置
    let drop_source = creep.pos.lookFor(LOOK_RESOURCES)
    if(drop_source.length){
        creep.pickup(drop_source[0])
    }
    //读取flag里面存的资源，不合法再找
    
    var source = Game.getObjectById(flag.memory.source);
    if(source){
        if(source.energy > 0){
            creep.harvest(source)
        }
    }else{
        source = flag.pos.findInRange(FIND_SOURCES,1)
        source = source[source.length-1]
        flag.memory.source = source.id;
    }
    if(!container){
        const target = creep.pos.lookFor(LOOK_RESOURCES);
        if(target[0]) {
            creep.pickup(target[0]) 
        }
    }

    //有link，就往link里面填，没有就隔100ticks找一下
    var link = Game.getObjectById(flag.memory.link);
    if(creep.store.getFreeCapacity(RESOURCE_ENERGY) == 0){
        if(link && link.store.getFreeCapacity(RESOURCE_ENERGY)){
            creep.transfer(link,RESOURCE_ENERGY);
        }else if(container){
            creep.transfer(container,RESOURCE_ENERGY);
        }
    }
    if(Game.time % 100 == 0){
        var links = flag.pos.findInRange(FIND_STRUCTURES,1,
            {filter:o=>(o.structureType == STRUCTURE_LINK)});
        if(links.length){
            flag.memory.link = links[0].id;
        }
    }
    if(link && container){
        if(link.store[RESOURCE_ENERGY] < link.store.getCapacity(RESOURCE_ENERGY) &&
        container.store[RESOURCE_ENERGY] >= creep.store.getFreeCapacity(RESOURCE_ENERGY)){
            if(creep.store.getFreeCapacity(RESOURCE_ENERGY)){
                creep.withdraw(container,RESOURCE_ENERGY)
            }
        }
    }
}