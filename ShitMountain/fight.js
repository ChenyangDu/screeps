module.exports = {
    run:function(){
        var flag = Game.flags['ATTACK'];
        if(!flag)flag = Game.flags['ATTACK2']
        var attacker = Game.creeps['ATTACKER'];
        var healer = Game.creeps['HEALER'];
        
        
        if(!flag)return;
        if(!healer){
            var spawn = getAvaliableSpawn('W38N26')
            if(spawn){/*
                spawn.spawnCreep([TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,
                    MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,
                    MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,
                    HEAL,HEAL,HEAL,HEAL,HEAL,WORK,WORK,WORK,WORK,WORK,
                    CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,WORK,WORK,WORK,
                    MOVE,MOVE,MOVE,MOVE,MOVE],'HEALER',{memory:{boosted:false}})*/
                
                spawn.spawnCreep([TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,
                    MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,
                    MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,
                    HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,
                    HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,
                    MOVE,MOVE,MOVE,MOVE,MOVE],'HEALER',{memory:{boosted:false}})
            }
            return;
        }
        if(!attacker){
            var spawn = getAvaliableSpawn('W38N26')
            if(spawn){/*
                spawn.spawnCreep([TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,
                    MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,
                    MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,
                    WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,
                    CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,
                    MOVE,MOVE,MOVE,MOVE,MOVE],'ATTACKER',{memory:{boosted:false}})*/
                
                spawn.spawnCreep([TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,
                    MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,
                    MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,
                    WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,
                    WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,
                    MOVE,MOVE,MOVE,MOVE,MOVE],'ATTACKER',{memory:{boosted:false}})
            }
            return;
        }
        //boost
        
        //if(!boostPart(healer) || !boostPart(attacker))return
        
    //healer.moveTo(flag)
        if(healer){
            healer.say('大西南！')
            if(attacker)healer.moveTo(attacker,{ignoreCreeps:false});
            if(isboard(healer.pos) && healer.pos.isNearTo(attacker.pos)){
                //healer.moveTo(moveTo(25,25),{ignoreCreeps:false})
            }
            var healTarget = healer;
            if(attacker && healer.hits > attacker.hits
                && healer.pos.isNearTo(attacker.pos)){
                healTarget = attacker;
            }

            healer.heal(healTarget)
        }
        
        if(attacker){
            attacker.say('开发！')
            //attacker.say('Come On!',true)
            //Game.getObjectById('5d5777da8309b77a1053c4be').attack(Game.creeps['ATTACKER'])
            if(attacker.pos.isNearTo(healer) || isboard(attacker.pos) ){
                attacker.moveTo(flag,{ignoreCreeps:false,visualizePathStyle: {stroke: '#ffffff'}})
            }
            
            if(attacker.room.name == flag.pos.roomName){
                var attackTargets = flag.pos.lookFor(LOOK_STRUCTURES);
                //console.log(attackTargets.length)
                attackTargets.forEach(attackTarget => {
                    attacker.dismantle(attackTarget)
                    attacker.attack(attackTarget)
                    attacker.claimController(Game.getObjectById('5bbcac2a9099fc012e63510b'))
                });
            }
        }
        
    }
};

function boostPart(creep){

    var boostPos = Game.flags['BOOST_POS']
    if(creep.memory.boosted == false){
        creep.moveTo(boostPos)
        if(creep.pos.isEqualTo(boostPos)){
            
            const labsId = [/*'5d9ec4ad2ce8350001e18113',*/'5d9f6468424dd500018ac956','5d9f75fadd0e5b000186c1fc']
            var labs = []
            labsId.forEach(labId => {
                labs.push(Game.getObjectById(labId))
            });

            labs.forEach(lab => {
                lab.boostCreep(creep)
            });
            creep.memory.boosted = true;
        }
        return false
    }
    return true;
}

function isboard(pos){
    return (pos.x == 0 || pos.y == 0 || pos.x == 49 || pos.y == 49)
}
function getAvaliableSpawn(roomName){
    for (var spawnname in Game.spawns){
        var spawn = Game.spawns[spawnname]
        if(spawn.room.name == roomName && spawn.spawning == null){
            return spawn
        }
    }
    return null;
}
/*
Game.market.deal('5dd5ab88fc9068fc39c3f5e6',3000,'W39N26')
    Game.spawns['W38N24_1'].spawnCreep([CARRY,CARRY,MOVE,CARRY,CARRY,MOVE,CARRY,CARRY,MOVE,CARRY,CARRY,MOVE,CARRY,CARRY,MOVE,
    CARRY,CARRY,MOVE,CARRY,CARRY,MOVE,CARRY,CARRY,MOVE,CARRY,CARRY,MOVE,CARRY,CARRY,MOVE,
CARRY,CARRY,MOVE,CARRY,CARRY,MOVE,CARRY,CARRY,MOVE,CARRY,CARRY,MOVE,CARRY,CARRY,MOVE,],'TMP')
    Game.spawns['Spawn3'].spawnCreep([CARRY,CARRY,MOVE,CARRY,CARRY,MOVE,
        CARRY,CARRY,MOVE,CARRY,CARRY,MOVE,CARRY,CARRY,MOVE,],'TMP')
    Game.spawns['Spawn1'].spawnCreep([TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,
        MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,
        MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,
        HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,
        HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,
        MOVE,MOVE,MOVE,MOVE,MOVE],'HEALER')
    Game.spawns['Spawn3'].spawnCreep([TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,
        MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,
        MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,
        WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,
        WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,
        MOVE,MOVE,MOVE,MOVE,MOVE],'ATTACKER')
    Game.spawns['W38N24_3'].spawnCreep([
        CARRY,MOVE,WORK,CARRY,MOVE,WORK,CARRY,MOVE,WORK,
        CARRY,MOVE,WORK,CARRY,MOVE,WORK,CARRY,MOVE,WORK,
        CARRY,MOVE,WORK,CARRY,MOVE,WORK,CARRY,MOVE,WORK,
        CARRY,MOVE,WORK,CARRY,MOVE,WORK,CARRY,MOVE,WORK,
        CARRY,MOVE,WORK,CARRY,MOVE,WORK,CARRY,MOVE,WORK,
    ],'BUILD')
    Game.spawns['W38N24_2'].spawnCreep([
CLAIM,MOVE,CLAIM,MOVE,CLAIM,MOVE,CLAIM,MOVE,CLAIM,MOVE,
CLAIM,MOVE,CLAIM,MOVE,CLAIM,MOVE,CLAIM,MOVE,CLAIM,MOVE,
CLAIM,MOVE,CLAIM,MOVE,CLAIM,MOVE,CLAIM,MOVE,CLAIM,MOVE,],'CLAIM2')
    */