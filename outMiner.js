var N_harvTransfer = require('N_harvTransfer')

const resources = [/*
    {
        id:'3f8647eb2b22010',
        room:'W2N2',
        spawnRoom:'W1N2',
        link:'5e211bfe5d14850cbed9d778'
    },
    {
        id:'613647eaa533dc6',
        room:'W1N1',
        spawnRoom:'W1N2',
        link:'5e211ba40072840cc5c51c66'
    },*/
    {
        id:'4c8147eaa06f08f',
        room:'W1N3',
        spawnRoom:'W1N2',
        link:'5e211adf0bb7340cc4cbb32f'
    },
    
]


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
        

        for(var i =0;i<resources.length;i++){
            const resource = resources[i];
            const creepname = 'outMiner_'+resource.room+'_'+resource.id + '_';
            const creep0 = Game.creeps[creepname+'0'];
            const creep1 = Game.creeps[creepname+'1']
            const dyingTick = 100;
            var needToSpawn_name = null;
            if(!creep0 && !creep1){
                needToSpawn_name = creepname+'0'
            }
            if(creep0){
                N_harvTransfer.run(creep0,resource.id,resource.room,Game.getObjectById(resource.link))
                if(!creep1 && creep0.ticksToLive <= dyingTick)needToSpawn_name = creepname+'1'
            }
            if(creep1){
                N_harvTransfer.run(creep1,resource.id,resource.room,Game.getObjectById(resource.link))
                if(!creep0 && creep1.ticksToLive <= dyingTick)needToSpawn_name = creepname+'0'
            }
            if(Game.time - Memory.badAss[resource.room] < 1500){
                needToSpawn_name = null;
            }
            if(needToSpawn_name){
                var spawn = getAvaliableSpawn(resource.spawnRoom)
                var energyAvi = Game.rooms[resource.spawnRoom].energyCapacityAvailable
                var body
                if(energyAvi >= 2000){
                    body = [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,
                        WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,
                        CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY]
                }else{
                    body = [MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,]
                }
                if(spawn){
                    spawn.spawnCreep(body,needToSpawn_name,{memory:{harvesting:true}})
                }
            }
        }
    }
};