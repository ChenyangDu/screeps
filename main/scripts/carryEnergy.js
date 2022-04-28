/**
 * 【功能】房间内能量运维管理
 * 【结构】
 * 占用Memory.room.xxx.carryenergy
 * 其中creeps为一个creep列表，包含所有正在运行的搬运工
 * 
 * 首先生成房间内所有提供能量和需要能量的目标列表withdrawTargets,transferTargets
 * 作为能量中转的单位storage/terminal，在其中一个列表为空的情况下，加入另一个列表
 * 每个目标设置一个est_energy属性，初始化为目标所含的能量
 * 
 * 所有creep分成三类，满能量的、半能量的、没能量的
 * 满能量的找最近的transferTarget，没能量的找withdrawTarget，半能量的二者都找
 * 如果creep和目标距离在5以内，est_energy需要变化
 * 
 */
let carryCtrl = require("carryCtrl")
module.exports = {
    run(){
        for(let room of Game.myrooms){
            // 获取当前carry容量
            let capacity = carryCtrl.getAvgCapacity(room.name);
            // 获取现在掌握的creeps列表
            if(!room.memory.carryenergy)room.memory.carryenergy = {}
            let creepNames = room.memory.carryenergy.creeps
            if(!creepNames){
                room.memory.carryenergy.creeps = []
                creepNames = room.memory.carryenergy.creeps
            }
            let creeps = []
            for(let i=0;i<creepNames.length;i++){
                let name = creepNames[i].name
                if(Game.creeps[name])
                    creeps.push(Game.creeps[name])
                else{
                    creepNames.splice(i,1)
                    i--;
                }
            }
            

            // 获取withdrawTargets,transferTargets
            let withdrawTargets = findWithdrawTargets(room,capacity)
            let transferTargets = findTransferTargets(room)

            // 增加能量中转站，顺便统计各类能量
            let withdrawEnergy,transferEnergy,creepEnergy
            [withdrawEnergy,transferEnergy,creepEnergy] = addMid(withdrawTargets,transferTargets,creeps)

            // 增加est_energy属性
            withdrawTargets.forEach(target =>{
                if(!target.est_energy)
                target.est_energy = target.store.getUsedCapacity("energy")
            })
            transferTargets.forEach(target =>{
                if(!target.est_energy)
                target.est_energy = target.store.getUsedCapacity("energy")
            })

            str = 'withdraw '
            withdrawTargets.forEach(t => {
                str += t.structureType + ' '
            });
            str += '\ntransfer '
            transferTargets.forEach(t => {
                str += t.structureType + ' '
            });
            // console.log(str)

            // 借用creep
            
            if(needBorrow(creeps,withdrawTargets,transferTargets,capacity)){
                let creepName = carryCtrl.borrowCreep(room,60)
                if(creepName && Game.creeps[creepName]){
                    creeps.push(Game.creeps[creepName])
                    creepNames.push({name:creepName})
                }
            }
            

            // 标记所有creep都不在工作
            creeps.forEach(creep=>{
                creep.working = false
            })

            // 处理满能量的
            for(let i=0;i<creeps.length;i++){
                let creep = creeps[i]
                if(creep.store.getFreeCapacity("energy") == 0){
                    creep.say('full')
                    
                    let target = findTransferTarget(creep,transferTargets)
                    if(target){
                        if(creepTransfer(creep,target)){
                            carryCtrl.returnCreep(room,creep.name)
                            creeps.splice(i,1)
                            creepNames.splice(i,1)
                            i--;
                            continue
                        }
                        
                    }
                    creep.working = true
                }
            }

            // 处理半能量的
            for(let i=0;i<creeps.length;i++){
                let creep = creeps[i]
                if(creep.store.getFreeCapacity("energy") > 0 &&
                creep.store.getUsedCapacity("energy") > 0){
                    creep.say('half')
                    // 选出最近的目标
                    let withdrawTarget = findWithdrawTarget(creep,withdrawTargets)
                    let transferTarget = findTransferTarget(creep,transferTargets)
                    let choose = null
                    if(withdrawTarget && transferTarget){
                        choose = (creep.pos.findClosestByPath([withdrawTarget,transferTarget]) 
                        == withdrawTarget)?"withdraw":"transfer"
                    }else{
                        choose = withdrawTarget?"withdraw":(transferTarget?"transfer":null)
                    }
                    if(choose){
                        if(choose == "withdraw"){
                            creepWithdraw(creep,withdrawTarget)
                        }else{
                            if(creepTransfer(creep,transferTarget)){
                                carryCtrl.returnCreep(room,creep.name)
                                creeps.splice(i,1)
                                creepNames.splice(i,1)
                                i--;
                            }
                        }
                        
                    }
                    // todo 没有目标要清空
                    creep.working = true
                }
            }
            // 处理没能量的
            for(let i=0;i<creeps.length;i++){
                let creep = creeps[i]
                if((0|creep.store.getUsedCapacity("energy")) == 0){
                    creep.say('empty')
                    let target = findWithdrawTarget(creep,withdrawTargets)
                    if(target){
                        creepWithdraw(creep,target)
                        creep.working = true
                    }
                }
            }

            //归还闲置creep
            for(let i=0;i<creeps.length;i++){
                if(creeps[i].working == false){
                    carryCtrl.returnCreep(room,creeps[i].name)
                    creeps.splice(i,1)
                    creepNames.splice(i,1)
                    i--;
                }
            }
        }
    }
}

function needBorrow(creeps,withdrawTargets,transferTargets,capacity){
    if (withdrawTargets.length && transferTargets.length){
        if(creeps.length == 0)return true;
        if(creeps.length < 2 && withdrawTargets.length >= 2){
                return true
        }
        if(_.sum(transferTargets,(o)=>{
            if(o.structureType == STRUCTURE_STORAGE || o.structureType == STRUCTURE_TERMINAL)
                return Math.min(capacity,o.store.getFreeCapacity("energy"))
            return o.store.getFreeCapacity("energy")
        }) > capacity * creeps.length){
            return true;
        }
        if(_.sum(withdrawTargets,(o)=>{
            if(o.structureType == STRUCTURE_STORAGE || o.structureType == STRUCTURE_TERMINAL)
                return Math.min(capacity,o.store.getUsedCapacity("energy"))
            return o.store.getUsedCapacity("energy")
        }) > capacity * creeps.length){
            return true
        }
    }
}

// 实际传输能量
/** @param {Creep} creep */
function creepTransfer(creep,target){
    // 如果距离够近就预付能量
    if (creep.pos.inRangeTo(target,5)){
        target.est_energy += creep.store.getUsedCapacity("energy")
    }
    if (creep.pos.isNearTo(target)){
        creep.transfer(target,RESOURCE_ENERGY)
        if(creep.store.getUsedCapacity("energy") <= target.store.getFreeCapacity("energy")){
            return true;
        }
        if(target.structureType == STRUCTURE_EXTENSION ||
            target.structureType == STRUCTURE_SPAWN){
                let nextExt = creep.pos.findClosestByPath(FIND_STRUCTURES,{
                    filter:struct =>{
                        return struct.id != target.id &&
                            (struct.structureType == STRUCTURE_EXTENSION || 
                            struct.structureType == STRUCTURE_SPAWN) &&
                            struct.store.getFreeCapacity("energy")>0
                    },
                    algorithm:'dijkstra'
                })
                if(nextExt && !creep.pos.isNearTo(nextExt)){
                    creep.moveTo(nextExt)
                }
            }
    }else{
        creep.moveTo(target,{range:1})
    }
    return false;
}
// 实际抽取能量
function creepWithdraw(creep,target){
    // 如果距离够近就预定能量
    if (creep.pos.inRangeTo(target,5)){
        target.est_energy -= creep.store.getFreeCapacity("energy")
    }
    if (creep.pos.isNearTo(target)){
        creep.withdraw(target,RESOURCE_ENERGY)
    }else{
        creep.moveTo(target,{range:1})
    }
}


/**
 * 
 * @param {Creep} creep 
 */
function findWithdrawTarget(creep,withdrawTargets){
    let target = creep.pos.findClosestByPath(withdrawTargets,{
        filter:struct =>{
            if(struct instanceof Tombstone && struct.est_energy >= 0){
                return true
            }
            switch(struct.structureType){
                case STRUCTURE_CONTAINER:
                    if(struct.est_energy >= Math.min(400, creep.store.getFreeCapacity('energy')))
                        return true;
                    break;
                case STRUCTURE_LINK:
                    if(struct.est_energy > 0)return true;
                default:
                    return struct.est_energy >= creep.store.getFreeCapacity("energy")
            }
        }
    })
    return target
}
function findTransferTarget(creep,transferTargets){
    let target = creep.pos.findClosestByPath(transferTargets,{
        filter:struct=>{
            
            return struct.est_energy <
                struct.store.getCapacity("energy")
        }
    })
    return target
}

function findWithdrawTargets(room,capacity){
    let tStorage = room.tStorage();
    let withdrawTargets = room.find(FIND_STRUCTURES,{
        filter:(struct) => {
            if(tStorage && struct.id == tStorage.id)return false;
            return struct.structureType == STRUCTURE_CONTAINER &&
            struct.store[RESOURCE_ENERGY] >= Math.min(400, capacity)
        }
    })
    let centerLink = room.centerLink()
    if(centerLink && centerLink.store.getUsedCapacity("energy") > 0){
        withdrawTargets.push(centerLink)
    }
    let tombs = room.find(FIND_TOMBSTONES,{
        filter:o=>{
            return o.store[RESOURCE_ENERGY] > 0
        }
    })
    withdrawTargets = withdrawTargets.concat(tombs)
    
    return withdrawTargets
}


/**
 * 
 * @param {Room} room 
 */
function findTransferTargets(room){
    let tStorage = room.tStorage();
    let transferTargets = [];
    
    
    transferTargets = room.find(FIND_STRUCTURES,{
        filter: (struct) => {
            return (struct.structureType == STRUCTURE_EXTENSION ||
            struct.structureType == STRUCTURE_SPAWN ||
            struct.structureType == STRUCTURE_LAB ||
            (struct.structureType == STRUCTURE_TOWER && 
                (struct.energy < 700 || (struct.energy<=900 && room.energyAvailable >= 0.9*room.energyCapacityAvailable)
            ))) &&
            struct.store.getFreeCapacity("energy") > 0
        }
    })
    
    if(tStorage && tStorage.store.getFreeCapacity("energy") > 400){
        transferTargets.push(tStorage)
    }
    return transferTargets;
}

function addMid(withdrawTargets,transferTargets,creeps){
    let midStruct = null
    if(room.storage)midStruct = room.storage
    
    // 分别计算可抽取能量、可存放能量、运输中的能量
    let withdrawEnergy = _.sum(withdrawTargets,
        o=>{return o.store.getUsedCapacity("energy")})
    let transferEnergy = _.sum(transferTargets,
        o=>{return o.store.getFreeCapacity("energy")})
    let creepEnergy = _.sum(creeps,
        o=>{return o.store.getUsedCapacity("energy")})
    // console.log(withdrawEnergy,transferEnergy,creepEnergy)
    if(midStruct){
        // if(withdrawEnergy + creepEnergy > transferEnergy){
        //     midStruct.est_energy = Math.max(
        //         midStruct.store.getFreeCapacity("energy") - 
        //             (withdrawEnergy + creepEnergy - transferEnergy),
        //         midStruct.store.getUsedCapacity("energy")
        //     )
        //     transferTargets.push(midStruct)
        //     transferEnergy += midStruct.store.getCapacity("energy") - midStruct.est_energy
        // }else if(transferEnergy > withdrawEnergy + creepEnergy){
        //     midStruct.est_energy = Math.min(
        //         transferEnergy - (withdrawEnergy + creepEnergy),
        //         midStruct.store.getUsedCapacity("energy")
        //     )
        //     withdrawTargets.push(midStruct)
        //     withdrawEnergy += midStruct.est_energy
        // }
        if(withdrawTargets.length == 0 && transferTargets.length > 0){
            withdrawTargets.push(midStruct)
        }else if(transferTargets.length == 0){
            transferTargets.push(midStruct)
        }
    }
    return [withdrawEnergy,transferEnergy,creepEnergy]
}