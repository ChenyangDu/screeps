let spawnCtrl = require("spawnCtrl")
let labCtrl = require("labCtrl")
let shardmove = require("./shardmove")
module.exports = {
    run(){
        runHelpEnergy('shard3','E39N49','shard3','E21N41',200,20,false)
        runHelpEnergy('shard2','E41N35','shard2','E35N39',200,20,false)

        runHelpBuilder('shard2','E35N39','shard1','E13N41',500,20,false)
        // runHelpEnergy('shard2','E41N35','shard3','E31N41',200,20,false)
        
        runClaim('shard1','E13N41')
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

function runClaim(lowRoomShard,lowRoomName,){
    let creep = Game.creeps.claim;
    if(creep){
        if(creep.ticksToLive >= 500){
            shardmove.start(creep.name,lowRoomShard,lowRoomName)
            console.log('cla')
        }
            
        if(Game.shard.name == lowRoomShard && creep.room.name == lowRoomName){
            // if(!creep.memory.overshard){
            //     creep.memory.overshard = true;
                shardmove.stop(creep.name)
            // }
            if(creep.pos.isNearTo(creep.room.controller)){
                if(!creep.room.controller.my)
                    creep.claimController(creep.room.controller)
            }else{
                creep.moveTo(creep.room.controller,{
                    plainCost:1,
                    swampCost:1,
                    visualizePathStyle:{
                        fill: 'transparent',
                        stroke: '#fff',
                        lineStyle: 'dashed',
                        strokeWidth: .15,
                        opacity: .1
                    }
                })
            }
            
        }
    }
}

function runHelpBuilder(highRoomShard,highRoomName,lowRoomShard,lowRoomName,ticks=750,nums=10,spawn=true){
    // let highRoomName = 'E39N49'
    let creepName = 'help_b_'+highRoomShard+'_'+highRoomName+'_'+lowRoomShard+'_'+lowRoomName+'_'
    if(spawn && Game.shard.name == highRoomShard){
        if(Game.time % ticks == 0){
            let terminal = Game.rooms[highRoomName].terminal
            let body = spawnCtrl.getbody([],[WORK,CARRY,MOVE,],Game.rooms[highRoomName].energyCapacityAvailable)
            let memory = {}

            // LH:build/repair GH:upgrade
            if(terminal && terminal.store.getUsedCapacity('LH')>=30){
                memory = labCtrl.boost_init_creep_memory({'LH':body.length/3},memory)
            }
            if(terminal && terminal.store.getUsedCapacity('ZO')>=30){
                memory = labCtrl.boost_init_creep_memory({'ZO':body.length/3},memory)
            }
            spawnCtrl.addSpawnList(
                highRoomName,
                body,
                creepName+(Game.time%(ticks*nums))/ticks,
                {memory}
            )
        }
    }
    for(let i = 0;i<nums;i++){
        let creep = Game.creeps[creepName+i]
        if(creep){
            if(Game.shard.name == highRoomShard && creep.room.name == highRoomName){
                if(creep.memory.boosted === false){
                    labCtrl.boost(null,null,creep)
                }
                if(creep.memory.boosted || creep.memory.boosted === undefined){
                    shardmove.start(creep.name,lowRoomShard,lowRoomName)
                }
            }
            if(Game.shard.name == lowRoomShard && creep.room.name == lowRoomName){
                shardmove.stop(creep.name)
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

function runHelpAttack(highRoomShard,highRoomName,lowRoomShard,lowRoomName,ticks=750,nums=10,spawn=true){
    // let highRoomName = 'E39N49'
    let creepName = 'help_b_'+highRoomShard+'_'+highRoomName+'_'+lowRoomShard+'_'+lowRoomName+'_'
    if(spawn && Game.shard.name == highRoomShard){
        if(Game.time % ticks == 0){
            let terminal = Game.rooms[highRoomName].terminal
            let body = spawnCtrl.getbody([],[WORK,CARRY,MOVE,],Game.rooms[highRoomName].energyCapacityAvailable)
            let memory = {}

            // LH:build/repair GH:upgrade
            if(terminal && terminal.store.getUsedCapacity('LH')>=30){
                memory = labCtrl.boost_init_creep_memory({'LH':body.length/3},memory)
            }
            if(terminal && terminal.store.getUsedCapacity('ZO')>=30){
                memory = labCtrl.boost_init_creep_memory({'ZO':body.length/3},memory)
            }
            spawnCtrl.addSpawnList(
                highRoomName,
                body,
                creepName+(Game.time%(ticks*nums))/ticks,
                {memory}
            )
        }
    }
    for(let i = 0;i<nums;i++){
        let creep = Game.creeps[creepName+i]
        if(creep){
            if(Game.shard.name == highRoomShard && creep.room.name == highRoomName){
                if(creep.memory.boosted === false){
                    labCtrl.boost(null,null,creep)
                }
                if(creep.memory.boosted || creep.memory.boosted === undefined){
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

function runHelpEnergy(highRoomShard,highRoomName,lowRoomShard,lowRoomName,ticks=750,nums=10,spawn=true){
    let creepName = 'help_e_'+highRoomShard+'_'+highRoomName+'_'+lowRoomShard+'_'+lowRoomName+'_'
    if(spawn&& Game.shard.name == highRoomShard){
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
                // if(!target){
                //     let spawns = creep.room.find(FIND_STRUCTURES,{
                //         filter:o=>o.structureType == STRUCTURE_SPAWN
                //     })
                //     if(spawns.length){
                //         target = spawns[0]
                //     }
                // }
                // console.log(target)
                if(!target)creep.memory.role = 'carryer'

                if(target){
                    // console.log(target.store.getFreeCapacity('energy')>= Math.min(100,creep.store.getUsedCapacity()),
                    // target.store.getFreeCapacity('energy'), Math.min(100,creep.store.getUsedCapacity()))
                    if(target.store.getFreeCapacity('energy')>= Math.min(100,creep.store.getUsedCapacity())){
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