/**
 * 【功能】本模块主要提供房间内搬运工服务，提供含有move/carry的creep
 * 
 * 【结构】
 * 在Memory.rooms.xxxx.carryctrl中维护一个carryers的队列
 * 其中used属性记录他们是否被其他模块借用
 * 
 * 【对外】：
 * 其他模块需要搬运工的时候可以向本模块提交申请，同时提出预计使用时长
 * 本模块会返回一个寿命在大于使用时长的creep，
 * 如果没有空余creep就下一tick再来申请
 * 用完搬运工要返回给本模块，并保证已经清空creep的store
 * 
 * 【对内】：
 * 固定数量carryer
 * 
 * todo:根据当前tick的被拒绝申请记录、正在工作中的creep状态，判断是否增加新的creep
 */
let baseCreep = require("baseCreep")
var spawnCtrl = require('spawnCtrl');

module.exports = {
    init,
    getAvgCapacity,
    borrowCreep,
    returnCreep,
}

function init(){
    let allCreeps = baseCreep.getAllCreeps()
    for(let roomName in allCreeps){
        let room = Game.rooms[roomName]
        let creeps = allCreeps[roomName]["carryer"]
        
        if(!creeps || creeps.length == 0){
            spawn(room)
            continue;
        }
        let carryctrl = Game.rooms[roomName].memory.carryctrl
        if(!carryctrl)carryctrl = room.memory.carryctrl = {}
        if(!carryctrl.carryers)carryctrl.carryers = []
        let carryers = carryctrl.carryers

        for(let creep of creeps){
            let carry = carryers.filter(c=>c.name == creep.name)
            if(!carry || carry.length == 0){
                carry = {name:creep.name}
                carryers.push(carry)
            }
        }
        for(let carry of carryers){
            carry.registed = false
        }
    }
}

function getAvgCapacity(roomName){
    let allCreeps = baseCreep.getAllCreeps()
    let cap = 0;
    let creeps = allCreeps[roomName]["carryer"]
    cap = _.sum(creeps,'carryCapacity')
    
    return cap/creeps.length
}
/**
 * 
 * @param {Room} room 
 */
function borrowCreep(room){
    let creeps = room.memory.carryctrl.carryers
    for(let creep of creeps){
        if(!creep.used){
            creep.used = true
            console.log(creep.name)
            return creep.name
        }
    }
    return null
}

function returnCreep(room,creepName){
    let creeps = room.memory.carryctrl.carryers
    creeps.forEach(creep => {
        if(creep.name == creepName){
            creep.used = false
            return;
        }
    });
    return;
}

function spawn(room){
    
    // 如果spawn列表中存在carryer
    if(spawnCtrl.getList(room,
        o=>o.opt && o.opt.memory && o.opt.memory.role == 'carryer').length > 0){
            return;
        }

    let body = spawnCtrl.getbody([],[CARRY,CARRY,MOVE,],
        room.energyCapacityAvailable,24)
        
    spawnCtrl.addSpawnList(room.name,body,'carryer'+Game.time%1000,
        {memory:{role:'carryer'}})
}