/**
 * 【功能】本模块主要提供房间内搬运工服务，提供含有move/carry的creep
 * 
 * 【结构】
 * {
 *  carryers:[],
 *  busyTicks:0,
 * }
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
    end,
}

function init(){
    let allCreeps = baseCreep.getAllCreeps()
    let labCtrl = require('labCtrl')
    for(let roomName in allCreeps){
        let room = Game.rooms[roomName]
        let creeps = allCreeps[roomName]["carryer"]
        
        if(!creeps || creeps.length == 0){
            if(room.controller && room.controller.my)
                spawn(room,true)
            continue;
        }
        let carryctrl = Game.rooms[roomName].memory.carryctrl
        if(!carryctrl){
            room.memory.carryctrl = {}
            carryctrl = room.memory.carryctrl
        }
        if(!carryctrl.carryers)carryctrl.carryers = []
        let carryers = carryctrl.carryers
        carryctrl.busyTicks_old = carryctrl.busyTicks
        for(let creep of creeps){
            let carry = carryers.filter(c=>c.name == creep.name)
            if(!carry || carry.length == 0){
                carry = {name:creep.name}
                carryers.push(carry)
            }
        }
        for(let i=0;i<carryers.length;i++){
            carry = carryers[i]
            carry.registed = false
            if(!Game.creeps[carry.name]){
                carryers.splice(i,1)
                i--;
            }else{
                
                let creep = Game.creeps[carry.name]
                if(creep.memory.boosted === false){
                    labCtrl.boost(null,null,creep)
                    // carryers.splice(i,1)
                    // i--;
                }
            }
            
        }
    }

}

function getAvgCapacity(roomName){
    let allCreeps = baseCreep.getAllCreeps()
    let cap = 0;
    let creeps = null
    if(allCreeps[roomName] && allCreeps[roomName].carryer){
        creeps = allCreeps[roomName].carryer
    }
    if(!creeps)return 0;
    cap = _.sum(creeps,'carryCapacity')
    
    return cap/creeps.length
}
/**
 * 
 * @param {Room} room 
 */
function borrowCreep(room,ticks = 50,busy=true){
    if(!room.memory.carryctrl)return null;
    let creeps = room.memory.carryctrl.carryers
    for(let creep of creeps){
        if(!creep.used && Game.creeps[creep.name] &&
            !Game.creeps[creep.name].spawning &&
            // Game.creeps[creep.name].memory.boosted !== false && 
            Game.creeps[creep.name].ticksToLive >= ticks){

            creep.used = true
            return creep.name
        }
    }
    // 借不到
    if(busy)
        room.memory.carryctrl.busyTicks ++;
    return null
}

function returnCreep(room,creepName){
    if(!room.memory.carryctrl)return null;
    let creeps = room.memory.carryctrl.carryers
    creeps.forEach(creep => {
        if(creep.name == creepName){
            creep.used = false
            return;
        }
    });
    return;
}

// 结束统计
function end(){
    Game.myrooms.forEach(room=>{
        if(needCarryer(room)){
            room.memory.carryctrl.busyTicks = -1*(room.controller.level*10+30)
            spawn(room)
        }
    })
}

/**
 * 
 * @param {Room} room 
 * @returns 
 */
function needCarryer(room){
    if(!room.memory.carryctrl)return;
    let creeps = room.memory.carryctrl.carryers
    creeps.forEach(creep => {
        if(!creep.used){
            let target = null
            if(room.storage)target = room.storage
            else{
                let spawns = room.find(FIND_STRUCTURES,{filter:o=>{
                    return o.structureType == STRUCTURE_SPAWN
                }})
                if(spawns.length)target = spawns[0]
            }
            
            if(target){
                let c = Game.creeps[creep.name]
                // 闲置的creep
                if(c && c.pos.getRangeTo(target) > 5){
                    c.moveTo(target,{range:5,ignoreCreeps:false})
                }
            }
        }
    })
    

    // 没有失败的借creep请求
    if(room.memory.carryctrl.busyTicks >0 && room.memory.carryctrl.busyTicks == room.memory.carryctrl.busyTicks_old){
        room.memory.carryctrl.busyTicks = Math.floor(room.memory.carryctrl.busyTicks*0.7);
    }
    // console.log(room.memory.carryctrl.busyTicks)
    try{
        let flag = Game.flags["Main_"+room.name]
        new RoomVisual(room.name).text(room.memory.carryctrl.busyTicks,flag.pos.x,flag.pos.y-1)
    }catch(e){}
    if(room.memory.carryctrl.busyTicks <= -95){
        return false
    }
    if(room.memory.carryctrl.busyTicks >= 50){
        // console.log("busyTicks >= 50",room.memory.carryctrl.busyTicks)
        return true
    }

    let allCreeps = baseCreep.getAllCreeps()
    if(!allCreeps || !allCreeps[room.name] || !allCreeps[room.name]["carryer"] ||
        allCreeps[room.name]["carryer"].length == 0){
            // console.log("no carryer")
            return true;// 如果没有carryer
        }
    // 最长寿命的creep不足100ticks
    let carryers = allCreeps[room.name]["carryer"]
    let maxTicks = 0;
    // console.log(carryers.length,Game.time)
    carryers.forEach(carryer=>{
        let ticks = carryer.ticksToLive
        if(ticks === undefined || carryer.spawning == true){
            ticks = 1500;
        }
        // console.log(carryer,ticks)
        maxTicks = _.max([maxTicks,ticks])
    })
    if(maxTicks <= 150){
        // console.log("maxTicks <= 150",maxTicks)
        return true
    }
    return false
    // if(maxTicks < )
}
/**
 * 
 * @param {Room} room 
 * @param {*} isEmergency 
 * @returns 
 */
function spawn(room,isEmergency=false){
    // 如果spawn列表中存在carryer
    let spawnlist = spawnCtrl.getList(room,
        o=>o.opt && o.opt.memory && o.opt.memory.role == 'carryer')
    

    let body_len = 24
    if(room.energyCapacityAvailable >= 4000)body_len = 48;
    let body = spawnCtrl.getbody([],[CARRY,CARRY,MOVE,],
        room.energyCapacityAvailable,body_len)
    let memory = {role:'carryer'}

    let allCreeps = baseCreep.getAllCreeps()
    
    if(!allCreeps || !allCreeps[room.name] || !allCreeps[room.name]["carryer"] ||
        allCreeps[room.name]["carryer"].length == 0){
            // 紧急情况的carryer
            // console.log('emergency',room.energyAvailable)
        body = spawnCtrl.getbody([],[CARRY,CARRY,MOVE,],
            room.energyAvailable,body_len)
            
        }else{
            // 非紧急情况的carryer
            
            
        }
    // todo 如果有boost条件, 对比市场价格，判断boost是否合适
    let terminal = room.terminal
    if(terminal && terminal.store.getUsedCapacity('KH') >= body_len*2/3*30){
        // console.log('boost carry spawn');
        body = spawnCtrl.getbody([],[CARRY,CARRY,MOVE,],
            room.energyCapacityAvailable,body_len/2)
        let labCtrl = require('labCtrl')
        memory = labCtrl.boost_init_creep_memory({'KH':body.length/3*2},memory)
    }

    if(spawnlist.length > 0){
        spawnlist[0].body = body
        return;
    }
    spawnCtrl.addSpawnList(room.name,body,'carryer'+Game.time%1000,
        {memory},3)
}