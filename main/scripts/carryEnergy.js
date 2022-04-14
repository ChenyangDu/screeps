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
            // 获取现在掌握的creeps列表
            if(!room.memory.carryenergy)room.memory.carryenergy = {}
            let creeps = room.memory.carryenergy.creeps
            if(!creeps){
                room.memory.carryenergy.creeps = []
                creeps = room.memory.carryenergy.creeps
            }
            

            // 获取withdrawTargets,transferTargets
            let withdrawTargets = findWithdrawTargets(room)
            let transferTargets = findTransferTargets(room)

            // 增加能量中转站
            addMid(withdrawTargets,transferTargets)

            // 增加est_energy属性
            withdrawTargets.forEach(target =>{
                target.est_energy = target.store.getUsedCapacity("energy")
            })
            transferTargets.forEach(target =>{
                target.est_energy = target.store.getUsedCapacity("energy")
            })

            console.log('withdraw')
            withdrawTargets.forEach(t => {
                console.log(t)
            });
            console.log('transfer')
            transferTargets.forEach(t => {
                console.log(t)
            });

            // 借用creep
            if (withdrawTargets.length && transferTargets.length){
                console.log("creeps length ",creeps.length)
                creeps.forEach(o=>{
                    console.log(o.name)
                })
                if(creeps.length < 2){
                    let creepName = carryCtrl.borrowCreep(room)
                    console.log(creepName)
                    if(creepName){
                        creeps.push({name:creepName})
                        console.log("borrow ",creepName)
                    }
                }
            }

            // 标记所有creep都不在工作
            creeps.forEach(o=>{
                o.working = false
            })

            // 处理满能量的
            creeps.forEach(o=>{
                let creep = Game.creeps[o.name]
                if(creep.store.getFreeCapacity("energy") == 0){
                    creep.say('full')
                    
                    let target = findTransferTarget(creep,transferTargets)
                    console.log('transfer target',target)
                    if(target){
                        creepTransfer(creep,target)
                        o.working = true
                    }
                }
            })

            // 处理半能量的
            creeps.forEach(o => {
                let creep = Game.creeps[o.name]
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
                            creepTransfer(creep,transferTarget)
                        }
                        o.working = true
                    }
                    // todo 没有目标要清空
                }
            })
            // 处理没能量的
            creeps.forEach(o => {
                let creep = Game.creeps[o.name]
                if((0|creep.store.getUsedCapacity("energy")) == 0){
                    creep.say('empty')
                    let target = findWithdrawTarget(creep,withdrawTargets)
                    if(target){
                        creepWithdraw(creep,target)
                        o.working = true
                    }
                }
            });

            //归还闲置creep
            for(let i=0;i<creeps.length;i++){
                if(creeps[i].working == false){
                    console.log('return ',creeps[i].name)
                    carryCtrl.returnCreep(room,creeps[i].name)
                    creeps.splice(i,1)
                    i--;
                }
            }
        }
    }
}

// 实际传输能量
function creepTransfer(creep,target){
    // 如果距离够近就预付能量
    if (creep.pos.inRangeTo(target,5)){
        target.est_energy += creep.store.getUsedCapacity("energy")
    }
    if (creep.pos.isNearTo(target)){
        creep.transfer(target,RESOURCE_ENERGY)
    }else{
        creep.moveTo(target,{range:1})
    }
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
            switch(struct.structureType){
                case STRUCTURE_CONTAINER:
                    if(struct.est_energy >= Math.min(400, creep.store.getFreeCapacity('energy')))
                        return true;
                    break;
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
            console.log(struct.est_energy , creep.store.getUsedCapacity("energy"),
            struct.store.getCapacity("energy"),
            struct.est_energy + creep.store.getUsedCapacity("energy") <
                struct.store.getCapacity("energy"))
            return struct.est_energy <
                struct.store.getCapacity("energy")
        }
    })
    return target
}

function findWithdrawTargets(room){
    let capacity = carryCtrl.getAvgCapacity(room.name);
    let tStorage = room.tStorage();
    let withdrawTargets = room.find(FIND_STRUCTURES,{
        filter:(struct) => {
            if(tStorage && struct.id == tStorage.id)return false;
            return struct.structureType == STRUCTURE_CONTAINER &&
            struct.store[RESOURCE_ENERGY] >= Math.min(400, capacity)
        }
    })
    return withdrawTargets
}


/**
 * 
 * @param {Room} room 
 */
function findTransferTargets(room){
    let tStorage = room.tStorage();
    let transferTargets = [];
    
    if(room.energyAvailable < room.energyCapacityAvailable){
        transferTargets = room.find(FIND_STRUCTURES,{
            filter: (struct) => {
                return (struct.structureType == STRUCTURE_EXTENSION ||
                struct.structureType == STRUCTURE_SPAWN) &&
                struct.store.getFreeCapacity("energy") > 0
            }
        })
    }
    return transferTargets;
}

function addMid(withdrawTargets,transferTargets){
    let midStruct = null
    if(room.storage)midStruct = room.storage
    if(midStruct){
        if(withdrawTargets.length == 0 && transferTargets.length > 0){
            withdrawTargets.push(midStruct)
        }else if(transferTargets.length == 0){
            transferTargets.push(midStruct)
        }
    }
}