let spawnCtrl = require("spawnCtrl")

module.exports = {
    run(){
        for(let flagName in Game.flags){
            if(flagName.startsWith("Main_")){
                let flag = Game.flags[flagName]
                let roomName = flag.pos.roomName
                
                if(!flag.room || !flag.room.controller.my){
                    let helpRoom = getHelpRoom(roomName)
                    if(helpRoom){
                        runClaim(flag,helpRoom,roomName)
                    }
                }
                if(flag.room && flag.room.controller.my && flag.room.controller.level <= 2){
                    
                    let helpRoom = getHelpRoom(roomName)
                    if(helpRoom){
                        runHelpBuilder(flag,helpRoom,roomName)
                    }
                }
            }
        }
    }
}

function getHelpRoom(roomName){
    for(let flagName in Game.flags){
        if(flagName.startsWith("help_")){
            let flag = Game.flags[flagName]
            if(flag.pos.roomName == roomName){
                return flagName.split('_')[1]
            }
        }
    }
    return null;
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
    let creepName = 'help_'+lowRoomName
    let creep = Game.creeps[creepName]
    if(!creep){
        spawnCtrl.addSpawnList(
            highRoomName,
            spawnCtrl.getbody([],[WORK,CARRY,MOVE,],Game.rooms[highRoomName].energyCapacityAvailable),
            creepName,
        )
    }else{
        if(!creep.memory.role){
            creep.moveTo(flag)
            if(creep.pos.roomName == lowRoomName){
                creep.memory.role = "builder"
            }
        }
    }
}