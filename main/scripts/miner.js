let spawnCtrl = require("spawnCtrl")
let carryCtrl = require("carryCtrl")

module.exports = {
    run(){
        Game.myrooms.forEach(room=>{
            if(room.controller && room.controller.level >= 6){
                runRoom(room)
            }
        })
    },
    /**
     * 
     * @param {Creep} creep 
     */
    runCreep:function(creep){
        if(creep.memory.harvesting == false && _.sum(creep.carry) < creep.carryCapacity){
            creep.memory.harvesting = true;
        }
        if(creep.memory.harvesting == true && _.sum(creep.carry) == creep.carryCapacity){
            creep.memory.harvesting = false;
        }
        if(creep.memory.harvesting){
            let targetID = creep.memory.mineral;
            if(!targetID){
                targetID = creep.memory.mineral = creep.room.find(FIND_MINERALS)[0].id;
            }
            let mineral = Game.getObjectById(targetID)
            if(creep.pos.isNearTo(mineral)){
                creep.harvest(mineral)
            }else{
                creep.moveTo(mineral);
            }
        }else{
            var store;
            store = creep.room.terminal;
            if(!creep.room.terminal||_.sum(creep.room.terminal.store) >= 290000){
                store = creep.room.storage;
            }
            creep.moveTo(store)
            for(const resourceType in creep.carry) {
                creep.transfer(store, resourceType);
            }
        }
    }
};
/**
 * 
 * @param {Room} room 
 * @returns 
 */
function runRoom(room){
    if(!room.memory.miner)return
    let memory = room.memory.miner
    let miner = Game.getObjectById(memory.id)
    // console.log(miner.mineralAmount)
    if(!miner || !miner.mineralAmount)return;
    let pos = new RoomPosition(memory.pos.x,memory.pos.y,room.name)
    let container = pos.findInRange(FIND_STRUCTURES,1,{
        filter:o=>o.structureType == STRUCTURE_CONTAINER
    })
    if(container.length){
        container = container[0]
    }else{
        return;
    }

    let harvester = Game.creeps["miner_"+room.name]
    if(!harvester){
        let body = spawnCtrl.getbody([],[WORK,WORK,WORK,WORK,MOVE,],room.energyCapacityAvailable)
        spawnCtrl.addSpawnList(room.name,body,"miner_"+room.name)
    }else{
        if(harvester.pos.isEqualTo(pos)){
            
            if(miner && Game.time%6==0){
                harvester.harvest(miner)
            }
        }else{
            harvester.moveTo(pos)
        }
    }
    let carryerName = memory.carryer

    if(container.store.getUsedCapacity() >= 1000){
        if(!carryerName){
            carryerName = carryCtrl.borrowCreep(room,100)
            if(carryerName){
                memory.carryer = carryerName
            }
        }
        if(carryerName){
            let carryer = Game.creeps[carryerName]
            if(carryer){
                if(carryer.store.getUsedCapacity() == 0){
                    if(carryer.pos.isNearTo(container)){
                        carryer.withdraw(container,Object.keys(container.store)[0])
                        let storage = carryer.room.storage
                        if(storage){
                            carryer.moveTo(storage)
                        }
                    }else{
                        carryer.moveTo(container)
                    }
                }
            }
        }
    }

    if(carryerName){
        let carryer = Game.creeps[carryerName]
        if(carryer){
            if(carryer.store.getUsedCapacity() > 0){
                let terminal = carryer.room.terminal
                if(terminal){
                    if(carryer.pos.isNearTo(terminal)){
                        carryer.transfer(terminal,Object.keys(carryer.store)[0])
                    }else{
                        carryer.moveTo(terminal)
                    }
                }else{
                    console.log("error");
                }
            }else if(container.store.getUsedCapacity() < 1000){
                carryCtrl.returnCreep(room,carryer.name)
                memory.carryer = null
            }
        }
    }
}