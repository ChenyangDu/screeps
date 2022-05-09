let spawnCtrl = require("spawnCtrl")
let labCtrl = require("labCtrl")
module.exports = {
    run(){
        for(let flagName in Game.flags){
            if(flagName.startsWith("Main_")){
                let flag = Game.flags[flagName]
                let roomName = flag.pos.roomName
                
                if(!flag.room || !flag.room.controller.my){
                    let helpRooms = getHelpRooms(roomName)
                    if(helpRooms.length){
                        runClaim(flag,helpRooms[0],roomName)
                        helpRooms.forEach(helpRoom=>{
                            runHelpBuilder(flag,helpRoom,roomName)
                        })
                    }
                }else if(flag.room && flag.room.controller.my && flag.room.controller.level <= 2
                    && flag.room.energyCapacityAvailable < 550){
                    
                    let helpRooms = getHelpRooms(roomName)
                    if(helpRooms.length){
                        helpRooms.forEach(helpRoom=>{
                            runHelpBuilder(flag,helpRoom,roomName)
                        })
                    }
                }else if(flag.room && flag.room.controller.my && flag.room.storage && !flag.room.terminal){
                    let helpRooms = getHelpRooms(roomName)
                    if(helpRooms.length){
                        helpRooms.forEach(helpRoom=>{
                            if(Game.rooms[helpRoom] && Game.rooms[helpRoom].controller.level >=6){
                                runHelpEnergy(flag,helpRoom,roomName)
                            }
                        })
                    }
                }
            }
        }
    }
}

function getHelpRooms(roomName){
    let res = []
    for(let flagName in Game.flags){
        if(flagName.startsWith("help_")){
            let flag = Game.flags[flagName]
            if(flag.pos.roomName == roomName){
                res.push(flagName.split('_')[1])
            }
        }
    }
    return res;
}

function runClaim(flag,highRoomName,lowRoomName){
    let creepName = 'claim_'+lowRoomName
    let creep = Game.creeps[creepName]
    if(!creep){
        spawnCtrl.addSpawnList(
            highRoomName,
            spawnCtrl.getbody([CLAIM,],[MOVE,],850),
            creepName
        )
    }else{
        if(creep.pos.roomName == lowRoomName){
            let controller = creep.room.controller
            if(creep.pos.isNearTo(controller)){
                creep.claimController(controller)
            }else{
                creep.moveTo(controller,{
                    maxRooms:1
                })
            }
        }else{
            creep.moveTo(flag,{
                swampCost:1,
                plainCost:1
            })
        }
    }
}

function runHelpBuilder(flag,highRoomName,lowRoomName){
    let creepName = 'help_'+lowRoomName+'_'+highRoomName
    let creep = Game.creeps[creepName]
    if(!creep){
        // todo 如果有boost条件, 对比市场价格，判断boost是否合适
        let terminal = Game.rooms[highRoomName].terminal
        let body = spawnCtrl.getbody([],[WORK,CARRY,MOVE,],Game.rooms[highRoomName].energyCapacityAvailable)
        let memory = {}
        if(terminal && terminal.store.getUsedCapacity('LH')>=30){
            memory = labCtrl.boost_init_creep_memory({'LH':body.length/3},memory)
        }
        if(terminal && terminal.store.getUsedCapacity('ZO')>=30){
            memory = labCtrl.boost_init_creep_memory({'ZO':body.length/3},memory)
        }
        spawnCtrl.addSpawnList(
            highRoomName,
            body,
            creepName,
            {memory}
        )
    }else{
        if(creep.memory.boosted === false){
            // console.log("want to boost")
            labCtrl.boost(null,null,creep)
        }else{
            if(!creep.memory.role){
                creep.moveTo(flag)
                if(creep.pos.roomName == lowRoomName){
                    creep.memory.role = "builder"
                }
            }
        }
        
    }
}

function  runHelpEnergy(flag,highRoomName,lowRoomName){
    let creepName = 'help_e_'+lowRoomName+'_'+highRoomName
    let creep = Game.creeps[creepName]
    let highroom = Game.rooms[highRoomName]
    if(!highroom)return;

    if(!creep){
        let body = spawnCtrl.getbody([],[CARRY,MOVE,],highroom.energyCapacityAvailable)
        spawnCtrl.addSpawnList(
            highRoomName,
            body,
            creepName,
        )
    }else{
        creep.say("help")
        let lowroom = Game.rooms[lowRoomName]
        if(!lowroom)return;
        if(lowroom && lowroom.storage){
            if(creep.store.getUsedCapacity()){//有能量
                if(creep.pos.isNearTo(lowroom.storage)){
                    creep.transfer(lowroom.storage,"energy")
                    creep.suicide()
                }else{
                    creep.moveTo(lowroom.storage)
                }
            }else{//没能量
                let target
                if(highroom.terminal.store.getUsedCapacity("energy") >= creep.store.getFreeCapacity("energy")){
                    target = highroom.terminal
                }else if(highroom.storage.store.getUsedCapacity("energy") >= creep.store.getFreeCapacity("energy")){
                    target = highroom.storage
                }
                if(target){
                    if(creep.pos.isNearTo(target)){
                        creep.withdraw(target,"energy")
                        creep.moveTo(lowroom.storage)
                    }else{
                        creep.moveTo(target)
                    }
                }
            }
        }
    }

}