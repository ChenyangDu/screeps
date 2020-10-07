const observeRooms_shard3 = [
    {
        mainRoom:'W39N26',
        watchRooms:['W40N24','W40N25','W40N26','W40N27','W40N28','W40N29','W40N30','W40N31',],//8
        powerWatchRooms:[],
        midRoom:'W39N26'
    },{
        mainRoom:'W43N27',
        watchRooms:['W41N30','W42N30','W43N30','W44N30','W45N30','W46N30',
        'W47N30','W48N30','W49N30','W50N30',],//10
        powerWatchRooms:[],
        midRoom:'W41N29'
    },{
        mainRoom:'W47N21',
        watchRooms:['W41N20','W42N20','W43N20','W44N20','W45N20','W46N20','W47N20','W48N20','W49N20','W50N20',],//10
        powerWatchRooms:[],
        midRoom:'W47N20'
    },{
        mainRoom:'W38N24',
        watchRooms:['W40N23','W40N22','W40N21','W40N20','W39N20','W38N20','W37N20','W36N20',],//8
        powerWatchRooms:[],
        midRoom:'W40N20'
    },{
        mainRoom:'W38N26',
        watchRooms:['W39N30','W38N30','W37N30','W36N30','W35N30','W34N30','W33N30',],//7
        powerWatchRooms:[],
        midRoom:'W38N30'
    },/*{
        mainRoom:'W9S11',
        watchRooms:['W19S10','W18S10','W17S10','W16S10','W15S10','W14S10','W13S10','W12S10','W11S10','W10S10',//10
        'W9S10','W8S10','W7S10','W6S10','W5S10',//5
        'W10S15','W10S14','W10S13','W10S12','W10S11',//5
        'W10S9','W10S8','W10S7','W10S6','W10S5','W10S4'],//9
        powerWatchRooms:[],
        midRoom:'W10S10'
    }*/
]

const observeRooms_shard2 = [
    {
        mainRoom:'E41N42',
        watchRooms:['E40N45','E40N44','E40N43','E40N42','E40N41','E40N40',],//8
        powerWatchRooms:['E40N45','E40N44','E40N43','E40N42','E40N41','E40N40',],
        midRoom:'E40N43'
    },{
        mainRoom:'E39N51',
        watchRooms:['E40N52','E40N51','E40N50','E39N50','E38N50',],//8
        powerWatchRooms:['E40N52','E40N51','E39N50','E38N50',],
        midRoom:'E39N51'
    },
]

var observeRooms = []
module.exports = {
    run:function(){
        if(Game.shard.name == 'shard3')observeRooms = observeRooms_shard3;
        if(Game.shard.name == 'shard2')observeRooms = observeRooms_shard2;
        
        for(var observeRoom of observeRooms){
            const mainRoom = observeRoom.mainRoom;
            const watchRooms = observeRoom.watchRooms;
            const powerWatchRooms = observeRoom.powerWatchRooms;
            const midRoom = observeRoom.midRoom;
            if(!Memory.observe)Memory.observe = {};
            if(Memory.observe[mainRoom] == undefined){
                Memory.observe[mainRoom] = {}
            }
            var observerId = Memory.observe[mainRoom].id;
            if(!observerId || !Game.getObjectById(observerId)){
                observerId = Game.rooms[mainRoom].find(FIND_STRUCTURES,{
                    filter: { structureType: STRUCTURE_OBSERVER }
                })[0].id;
                Memory.observe[mainRoom].id = observerId;
            }
            var observer = Game.getObjectById(observerId)
            if(!observer)return;
            const n = watchRooms.length;
            const k = Game.time % n;
            observer.observeRoom(watchRooms[k])
            let watchedRoom = Game.rooms[watchRooms[(k+n-1)%n]]
            if(!watchedRoom)return
            if(powerWatchRooms.indexOf(watchedRoom.name) != -1){
                power(observeRoom,watchedRoom)
            }
            var deposits = watchedRoom.find(FIND_DEPOSITS)
            if(deposits.length){
                deposits.sort((a,b)=>(a.lastCooldown - b.lastCooldown))
                const deposit = deposits[0];
                const flagName = 'deposit_'+watchRooms[(k+n-1)%n]
                if(deposit.lastCooldown <= 80){
                    if(deposit.ticksToDecay <= 40000){
                        if(Game.flags[flagName] == undefined){
                            deposit.pos.createFlag(flagName,COLOR_YELLOW,COLOR_BLUE)
                            Game.flags[flagName].memory.midRoom = midRoom
                            Game.flags[flagName].memory.mainRoom = mainRoom
                        }else{
                            if(!Game.flags[flagName].pos.isEqualTo(deposit)){
                                Game.flags[flagName].setPosition(deposit.pos)
                            }
                            if(!Game.flags[flagName].memory.mainRoom){
                                Game.flags[flagName].memory.midRoom = midRoom
                                Game.flags[flagName].memory.mainRoom = mainRoom
                            }
                        }
                    }
                }else if(Game.flags[flagName]){
                    Game.flags[flagName].memory.shouldRemoved = true;
                }
                //console.log(deposit.pos)
            }
        }
    }
}

function power(observeRoom,room){
    const mainRoom = observeRoom.mainRoom;
    const midRoom = observeRoom.midRoom;
    
    var power = room.find(FIND_STRUCTURES,{
        filter:(o)=>(o.structureType == STRUCTURE_POWER_BANK && o.power >= 2000)
    })
    
    if(power.length){
        power = power[0]
    }else{
        return;
    }
    
    const flagName = 'pb_'+room.name;
    var flag = Game.flags[flagName]
    if(!flag){//console.log(flagName)
        power.pos.createFlag(flagName,COLOR_YELLOW,COLOR_RED)
        flag = Game.flags[flagName]
        if(!flag)return;
        flag.memory.mainRoom = mainRoom;
        flag.memory.midRoom = midRoom;
        flag.memory.needToPickUp = false;
        flag.memory.needCarryer = false;
    }else{
        if(!flag.pos.isEqualTo(power)){
            flag.setPosition(power.pos.x,power.pos.y)
            flag.memory.needToPickUp = false;
            flag.memory.needCarryer = false;
        }
        flag.memory.mainRoom = mainRoom;
        flag.memory.midRoom = midRoom;
    }
}