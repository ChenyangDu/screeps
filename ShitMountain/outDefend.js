var enermy;

module.exports = {
    run:function(){
        var defendRooms = new Array(
            {room:'W38N23',spawn:'W38N24',freepos:new RoomPosition(25,25,'W38N23')},
            //{room:'W43N26',spawn:'W43N27',freepos:new RoomPosition(26,17,'W43N26')},
            {room:'W39N27',spawn:'W39N26',freepos:new RoomPosition(35,13,'W39N27')},
            //{room:'W47N22',spawn:'W47N21',freepos:new RoomPosition(25,25,'W43N26')},

            //{room:'W38N28',spawn:'W38N26',freepos:new RoomPosition(26,17,'W38N28')},
            //{room:'W37N29',spawn:'W38N26',freepos:new RoomPosition(26,17,'W37N29')},
            //,{room:'W39N27',spawn:'Spawn1'}
        )
        enermy = null;
        for(var defendRoom of defendRooms){
            var creepName = 'outAttacker_' + defendRoom.room;
            var creep = Game.creeps[creepName]
            if(creep){
                enermy = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
                
                if(creep.room.name != defendRoom.room)
                    creep.moveTo(new RoomPosition(25,25,defendRoom.room))
                else attackerRun(creep,defendRoom.freepos)
            }else{
                var spawn = getAvaliableSpawn(defendRoom.spawn)
                if(spawn)spawn.spawnCreep([TOUGH,MOVE,MOVE,MOVE,RANGED_ATTACK,ATTACK,ATTACK,MOVE]
                    ,creepName)
            }

            creepName = 'outhealer_' + defendRoom.room;
            creep = Game.creeps[creepName]
            if(creep){
                if(creep.room.name != defendRoom.room)
                    creep.moveTo(new RoomPosition(25,25,defendRoom.room))
                else healerRun(creep,defendRoom.freepos)
            }else{
                var spawn = getAvaliableSpawn(defendRoom.spawn)
                if(spawn)spawn.spawnCreep([MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,MOVE]
                    ,creepName)
            }

        }
        
    }
};

function attackerRun(creep,freepos) {
    var target = enermy;
    //if(!target)
    //    target = creep.pos.findClosestByPath(FIND_HOSTILE_STRUCTURES)
    if(target){
        if(creep.attack(target) == ERR_NOT_IN_RANGE){
            creep.moveTo(target);
        }
        if(creep.pos.inRangeTo(target, 3)) {
            creep.rangedAttack(target);
        }
    }else{
        if(!creep.pos.isNearTo(freepos))
            creep.moveTo(freepos,{ignoreCreeps:false})
    }
}

function healerRun(creep,freepos){
    if(!enermy){
        creep.moveTo(freepos)
        return;
    }
    var targets = creep.room.find(FIND_MY_CREEPS, {
        filter: function(object) {
            return object.hits < object.hitsMax;
        }
    });
    if(targets.length){
        targets.sort((a,b) => a.hits - b.hits);
    }
    const target = targets[0]
    if(target) {
        if(creep.heal(target) == ERR_NOT_IN_RANGE) {
            creep.moveTo(target);
        }
    }
}

function getAvaliableSpawn(room){
    for (var spawnname in Game.spawns){
        var spawn = Game.spawns[spawnname]
        if(spawn.room.name == room && spawn.spawning == null){
            return spawn
        }
    }
    return null;
}
