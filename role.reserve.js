
function getAvaliableSpawn(room){
    for (var spawnname in Game.spawns){
        var spawn = Game.spawns[spawnname]
        if(spawn.room.name == room && spawn.spawning == null){
            return spawn
        }
    }
    return null;
}

module.exports = {
    run:function(){
        
        const reserveRooms = new Array(
            {name:'W1N1',spawn:'W1N2'},
            {name:'W2N2',spawn:'W1N2'},
            {name:'W1N3',spawn:'W1N2'},
            )
        reserveRooms.forEach(reserveRoom => {
            const creepName = 'reserve_' + reserveRoom.name;
            var creep = Game.creeps[creepName]
            if(creep){
                if(creep.room.name != reserveRoom.name){
                    creep.moveTo(new RoomPosition(25,25,reserveRoom.name))
                    return;
                }
                const controller = creep.room.controller;
                
                if(!creep.pos.isNearTo(controller)){
                    creep.moveTo(controller)
                }else{
                  creep.signController(controller,"星星之火，可以燎原");
                    if(creep.reserveController(controller) != OK){
                        creep.attackController(controller)
                    }
                }
                
            }
            const room = Game.rooms[reserveRoom.name]
            if(!creep){
                var tick = 3000;
                if(room && room.controller && 
                    room.controller.reservation && room.controller.reservation.username == 'ChenyangDu'){
                        tick = room.controller.reservation.ticksToEnd
                    }
                    
                if(tick <= 2000 && (!Memory.badAss[reserveRoom.spawn] || Game.time - Memory.badAss[reserveRoom.spawn] > 1500)){
                    var spawn = getAvaliableSpawn(reserveRoom.spawn)
                    if(spawn)spawn.spawnCreep([CLAIM,MOVE,CLAIM,MOVE,CLAIM,MOVE,CLAIM,MOVE,],creepName)
                }
            }

        });
    }
};