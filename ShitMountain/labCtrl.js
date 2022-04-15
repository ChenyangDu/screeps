/**********************************************
author：ChenyangDu, Tracer
version:1.7
lab半自动

【更新说明】：
1、修复了好多bug，例如拿着原料不知道该干啥，creep生出来立马自杀
2、creep可以快结束反应时提前生产
3、增加了适应operate_lab的情况
4、可以分批提供原料，如果目标大于3000，将会拆解成若干个小的3000任务，所以可以一次设置很大的任务量

5、修复了creep只有在跑反应那一tick才动的bug
6、修复了creep可能在即将进行下一个任务前自杀的情况
7、修复了合成化合物时反复合成 5*8 原料的bug
8、修复了有operate_lab的情况下错误进入RECOVERY的bug
9、修复了1.5版本修复导致的willEnd()计算错误
10、修复了在REACTION状态下仍因资源不足开摆的bug
11、修复了因为operate_lab导致数量不能整除5时不能正常生成任务的问题

【使用方法】：
1、需要占用Memory.lab，不要和其他代码冲突
2、需要手动提供原矿或者其他中间产物,提前放在房间的storage 或者terminal里面都行
    比如想生产1000 XGH2O，可以准备1000 X, 1000 G, 1000 O, 2000 H
    也可以准备500 GH2O, 1000 X, 500 GH, 500 OH
    总之能合成就行
3、如果想生产多于3000的产物，例如想生产10000 G，在刚开始，只需要提供3000 L/Z/K/U，当生产完3000 G之后，再补充原料即可。
4、如果你的房间物流能够保证原矿不断，那么可以使用下面的UNLIMITED_RESOURCES来避开检测某些矿物数量不足。
5、storage不要满，要不没地方放产物
6、尽量科学摆放LAB（有两个lab离其他lab的距离<=2），代码会自动寻找生产效率最大的方式
7、请保证pc仅在lab有cd的时候再进行强化（因为底料lab中只会保证最少有5个底物） <- 重要，可能导致死锁

【代码部分】：
var labCtrl = require('labCtrl')
module.exports.loop = function () {
    labCtrl.run('W43N27',RESOURCE_GHODIUM,2000)
    labCtrl.run('W47N21','XGH2O',200000)
    //your code
}

【TODO】
1、REACTION状态下不需要再计算配方，节省CPU
2、如果lab位置摆放不合理，并且该lab在labs数组中，会因为反应时无法获取底物而切换状态
***************************************************/

const STATE_FILL = 0
const STATE_REACTION = 1
const STATE_RECOVERY = 2

const body = [CARRY,CARRY,MOVE,CARRY,CARRY,MOVE,CARRY,CARRY,MOVE,CARRY,CARRY,MOVE,CARRY,CARRY,MOVE]
//lab专用creep的身体部件，如果嫌多，或者嫌少，自行调整
const UNLIMITED_RESOURCES = ['Z','K','U','L','H','O','X'];//如果你的房间物流能够保证提供这些基础矿物，那么程序会默认这些矿物数量为无穷大

var queen_name="SUP_${room.name}"; // 中心搬运工名字，用于包含在化合物数量统计中

var room,needs,labs,creep

module.exports = {
    run:function(roomName,need_type,need_amount){
        room = Game.rooms[roomName];
        const creepName = 'Laber_' + roomName;
        creep = Game.creeps[creepName];
        if(!initMemory(roomName)) return;//这句是初始化用的，如果目标房间已经运行稳定了，就可以把这句删掉
        
        if(!need_type || !need_amount){
            console.log('ERROR: What do you want Room '+roomName+' do?')
            return;
        }
        var state = Memory.lab[roomName].state;
        labs = new Array();
        var _id = 0;
        
        Memory.lab[roomName]['labs'].forEach(labid => {
            labs.push(Game.getObjectById(labid))
            new RoomVisual(roomName).text(_id,labs[_id].pos,{color: 'white', font: 0.5})//如不需要绘制编号，这句也可以删了
            _id++;
        });
        
        needs = new Array();

        let cache_amount=getAllType(need_type); // 省一点cpu
        
        need_amount = need_amount - cache_amount
        if(need_amount > 3000) need_amount = 3000;
        need_amount += cache_amount
        
        pushMission([need_type,need_amount],roomName)
        // console.log(roomName,needs) 
        if(needs.length >= 1){
            var product = _.last(needs)[0], amount = Math.min(3000, _.last(needs)[1]);
            var materials = findMaterial(product)
        }else{
            console.log(roomName,'already has',need_amount,need_type)
        }
        // if(amount % 5) amount += 5-amount%5; // 应在每次递归时保证
        // console.log(materials);
        if(materials == null && needs.length >= 1){
            console.log('Room '+roomName+' need '+ amount + product)
        }
        if(materials == null && state != STATE_REACTION){
            if(creep)
                creepKill(creep);
            return
        }
        
        // console.log(roomName + ' state is',state);

        //change state 
        
        if(state == STATE_REACTION && (labs[0].mineralType == undefined || labs[1].mineralType == undefined)){
            console.log(roomName + ' state change to STATE_RECOVERY','合成完了')
            state = STATE_RECOVERY
        }
        if(state == STATE_REACTION){
            if((labs[0].mineralType && labs[0].store[labs[0].mineralType] < 5) || 
            (labs[1].mineralType && labs[1].store[labs[1].mineralType] < 5)){
                console.log(roomName + ' state change to STATE_RECOVERY','原料不足')
                state = STATE_RECOVERY
            }
        }
        if(state == STATE_RECOVERY){
            var allclear = true;
            labs.forEach(lab => {
                if(lab.mineralType != undefined) allclear = false;
            });
            if(allclear){
                console.log(roomName + ' state change to STATE_FILL')
                state = STATE_FILL
            }
        }
        if(state == STATE_FILL){
            if(labs[0].store[materials[0]] >= amount && labs[1].store[materials[1]] >= amount){
                console.log(roomName + ' state change to STATE_REACTION')
                state = STATE_REACTION
            }
            if(labs[0].mineralType && labs[0].mineralType != materials[0]){
                state = STATE_RECOVERY
            }
            if(labs[1].mineralType && labs[1].mineralType != materials[1]){
                state = STATE_RECOVERY
            }
        }

        
        // run state
        
        if(creep) creep.say('Saber')
        if(state == STATE_REACTION && labs[0] && labs[1]){
            let product=REACTIONS[labs[0].mineralType][labs[1].mineralType]; // 将product从 needs最后两种原料的制品 的改为 两个原料lab将要生产的制品
            if(!willEnd()){ //如果还有用就先不杀
                if(creep) creepKill(creep);
            }else{
                autoSpawnCreep(creepName);
            }

            if(Game.time % REACTION_TIME[product] == 0){
                for(var i = 2;i<labs.length;i++){
                    if(labs[0] && labs[1] && labs[i]){
                        
                        new RoomVisual(roomName).text(i,labs[i].pos,{color: 'white', font: 0.5});
    
                        if (labs[i].effect && labs[i].effect.length) {
                            if (labs[0].store[labs[0].mineralType] < labs[i].effect[0].level * 2 + 5 || labs[1].store[labs[1].mineralType] < labs[i].effect[0].level * 2 + 5) { // 修复
                                console.log(roomName + ' state change to STATE_RECOVERY','加power属性以后原料不足');
                                state = STATE_RECOVERY;
                            }
                        }
                        
                        if(labs[i].runReaction(labs[0],labs[1]) != OK){ // 如果前面没有修改为正确的product, 这里将因为cd进入 RECOVERY 阶段。
                            // console.log(i,labs[0],labs[1],labs[i].runReaction(labs[0],labs[1]));
                            state = STATE_RECOVERY;
                        }
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
                //console.log(labs[0].store[type])
                
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
                        if(room.storage.store.getFreeCapacity() == 0 && room.terminal){
                            WAT(creep,lab,room.terminal,lab.mineralType,3000)
                        }
                        WAT(creep,lab,room.storage,lab.mineralType,3000)
                        mission = true;
                    }
                });
            }
        }
        
        Memory.lab[roomName].state = state;

    }
};

function willEnd(){
    if(!labs[0].mineralType || !labs[1].mineralType){
        return true;
    }
    if(labs.length == 2) return false;
    return Math.min(labs[0].store.getUsedCapacity(labs[0].mineralType),labs[1].store.getUsedCapacity(labs[1].mineralType)) / 5 / 
        (labs.length - 2) * REACTION_TIME[REACTIONS[labs[0].mineralType][labs[1].mineralType]] < body.length * 3;
}

function initMemory(roomName){
    if(!Memory.lab){
        Memory.lab = {}
    }
    if(!Memory.lab[roomName]){
        Memory.lab[roomName] = {}
    }
    if(Memory.lab[roomName].state === undefined){
        Memory.lab[roomName].state = STATE_REACTION
    }
    if(!Memory.lab[roomName].labs || Game.time % 3 == 0){
        var labs = room.find(FIND_STRUCTURES,{filter:o=>(o.structureType == STRUCTURE_LAB)})
        labs.forEach(lab => {
            lab.value = 0;
            labs.forEach(l => {
                if(lab.pos.inRangeTo(l,2)){
                    lab.value ++;
                }
            });
        });
        labs.sort((a,b)=>(b.value - a.value));
        for(var i = 0;i<labs.length;i++){
            labs[i] = labs[i].id;
        }
        Memory.lab[roomName].labs = labs;
    }
    if(Memory.lab[roomName].labs.length >= 3){
        return true;
    }else{
        console.log('ERROR: Room '+roomName+' must have more than 3 labs');
        return false;
    }
}

function findMaterial(product){
    for(var i in REACTIONS){
        for(var j in REACTIONS[i]){
            if(REACTIONS[i][j] == product){
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
    //console.log(creep.store[type])
    if(_.sum(creep.store) && creep.store[type] != _.sum(creep.store)){
        //console.log(creep.store[type] , _.sum(creep.store),type)
        creep.moveTo(creep.room.storage,{range:1})
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
        if(!withdrawTarget)return;
        amount = Math.min(amount,withdrawTarget.store[type]);
        creep.moveTo(withdrawTarget,{range:1})
        if(creep.pos.isNearTo(withdrawTarget)){
            if(creep.withdraw(withdrawTarget,type,amount)==OK && transferTarget)
                creep.moveTo(transferTarget)
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
                if(creep.transfer(transferTarget,type)==OK && withdrawTarget)
                    creep.moveTo(withdrawTarget)
            }
        }
    }
}

function autoSpawnCreep(creepName){
    var spawn = getAvaliableSpawn(room.name)
    if(spawn){
        spawn.spawnCreep(body,creepName)
    }
}
function getAllType(type){
    if(UNLIMITED_RESOURCES.indexOf(type) != -1) return 1000000;
    var amount = 0;
    amount += room.storage.store[type];
    amount += room.terminal.store[type];
    labs.forEach(lab => {
        amount += lab.store[type];
    });
    if(creep)
        amount += creep.store[type];
    let sup = Game.creeps[queen_name.replace('${room.name}',room.name)];
    if(sup){
        amount += sup.store[type];
    }
    return amount;
}
function pushMission(mission,roomName){
    mission[1] -= getAllType(mission[0])
    if(mission[1] <= 0)return;
    else {
        if(mission[1] % 5) mission[1] += 5-mission[1]%5;
        needs.push(mission)
        var materials = findMaterial(mission[0])
        if(materials){
            pushMission([materials[0],mission[1]],roomName)
            pushMission([materials[1],mission[1]],roomName)
        }
    }
}