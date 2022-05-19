let spawnCtrl = require("spawnCtrl")
let labCtrl = require("labCtrl")
let longmove = require("longmove")
let shardmove = require("shardmove")
module.exports = {
    run(){
        runHelpEnergy('shard3','E39N49','shard1','E36N41',200,20)
        runHelpEnergy('shard2','E41N35','shard1','E36N41',200,15)
        runHelpEnergy('shard1','E39N51','shard1','E36N41',500,10)
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

function runHelpBuilder(highRoomShard,highRoomName,lowRoomShard,lowRoomName,){
    // let highRoomName = 'E39N49'
    if(Game.shard.name == highRoomShard){
        if(Game.time % 750 == 0){
            let terminal = Game.rooms[highRoomName].terminal
            let body = spawnCtrl.getbody([],[WORK,CARRY,MOVE,],Game.rooms[highRoomName].energyCapacityAvailable)
            let memory = {}
            if(terminal && terminal.store.getUsedCapacity('LH')>=30){
                memory = labCtrl.boost_init_creep_memory({'LH':body.length/3},memory)
            }
            if(terminal && terminal.store.getUsedCapacity('ZO')>=30){
                memory = labCtrl.boost_init_creep_memory({'ZO':body.length/3},memory)
            }
            console.log('add help ','help_'+highRoomName+(Game.time%4500)/750)
        //    spawnCtrl.addSpawnList(
            //    highRoomName,
          //      body,
             //   'help_'+highRoomName+(Game.time%3000)/750,
             //   {memory}
           // )
        }
    }
    for(let i = 0;i<6;i++){
        let creepName = 'help_e_'+highRoomName+i;
        let creep = Game.creeps[creepName]
        if(creep){
            if(Game.shard.name == highRoomShard && creep.room.name == highRoomName){
                if(creep.memory.boosted === false){
                    // console.log("want to boost")
                    labCtrl.boost(null,null,creep)
                }
                if(creep.memory.boosted){
                    shardmove.start(creep.name,lowRoomShard,lowRoomName)
                }
            }
            if(Game.shard.name == lowRoomShard && creep.room.name == lowRoomName){
                // shardmove.stop(creep.name)
                if(!creep.memory.overshard){
                    creep.memory.overshard = true;
                    shardmove.stop(creep.name)
                }
                if(!creep.memory.role){
                    creep.moveTo(new RoomPosition(25,25,lowRoomName))
                    if(creep.pos.roomName == lowRoomName){
                        creep.memory.role = "builder"
                    }
                }
            }
        }
    }
}

function  runHelpEnergy(highRoomShard,highRoomName,lowRoomShard,lowRoomName,ticks=750,nums=10){
    let creepName = 'help_e_'+highRoomShard+'_'+highRoomName+'_'
    if(Game.shard.name == highRoomShard){
        if(Game.time % ticks == 0){
            if(Game.rooms[highRoomName]){
                let body = spawnCtrl.getbody([],[CARRY,MOVE,],Game.rooms[highRoomName].energyCapacityAvailable)
                spawnCtrl.addSpawnList(
                    highRoomName,
                    body,
                    creepName+(Game.time%(ticks*nums))/ticks,
                )
            }else{
                console.log(highRoomShard,highRoomName,'runHelpEnergy error')
            }
        }
    }
    for(let i = 0;i<nums;i++){
        let creep = Game.creeps[creepName+i]
        if(creep){
            // creep.say("help")
            // 如果在出生房间
            
            if( Game.shard.name == highRoomShard && creep.room.name == highRoomName){
                if(creep.store.getFreeCapacity() > 0){
                    let target = null
                    if(creep.room.terminal && creep.room.terminal.store.getUsedCapacity("energy")>0){
                        target = creep.room.terminal
                    }else if(creep.room.storage && creep.room.storage.store.getUsedCapacity("energy")>0){
                        target = creep.room.storage
                    }
                    if(target){
                        if(creep.pos.isNearTo(target)){
                            creep.withdraw(target,"energy")
                        }else{
                            creep.moveTo(target)
                        }
                    }
                    shardmove.stop(creep.name)
                }else{
                    // 启动星门
                    shardmove.start(creep.name,lowRoomShard,lowRoomName)
                }
            }
            
            if(Game.shard.name == lowRoomShard && creep.room.name == lowRoomName){
                // 停止星门
                shardmove.stop(creep.name)
                // if(!creep.memory.overshard){
                //     creep.memory.overshard = true;
                //     shardmove.stop(creep.name)
                // }
                // if(!creep.memory.role){
                //     creep.moveTo(new RoomPosition(25,25,lowRoomName))
                //     if(creep.pos.roomName == lowRoomName){
                //         creep.memory.role = "carryer"
                //     }
                // }
                
                let target = null
                if(creep.room.tStorage())target = creep.room.tStorage()

                if(target){
                    if(target.store.getFreeCapacity()>=creep.store.getUsedCapacity()){
                        if(creep.pos.isNearTo(target)){
                            creep.transfer(target,"energy")
                        }else{
                            creep.moveTo(target)
                        }
                    }else{
                        creep.moveTo(target,
                            {range:5,ignoreCreeps:creep.pos.getRangeTo(target)>7})
                    }
                }
                
                
                if(creep.store.getUsedCapacity("energy") == 0){
                    creep.suicide();
                }
                // shardmove.stop(creep.name)
                // if(!creep.memory.overshard){
                //     creep.memory.overshard = true;
                //     shardmove.stop(creep.name)
                // }
                // let target = null
                
                // if(creep.room.terminal)target = creep.room.terminal
                // else if(creep.room.storage)target = creep.room.storage
                // else if(creep.room.tStorage())target = creep.room.tStorage()
                // else {
                //     let spawns = creep.room.find(FIND_STRUCTURES,{
                //         filter:o=>o.structureType == STRUCTURE_SPAWN
                //     })
                //     if(spawns.length){
                //         target = spawns[0]
                //     }
                // }
                // if(target){
                //     if(creep.pos.isNearTo(target)){
                //         creep.transfer(target,"energy")
                //         // creep.suicide();
                //     }else{
                //         creep.moveTo(target)
                //     }
                // }
            }
        }
    }

}