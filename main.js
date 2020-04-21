var linkCtrl = require('linkCtrl')
var towerF = require('tower');
var creepsManager = require('creeps.manager');
var SourceKeeperCtrl = require('SourceKeeperCtrl')
var smallRoomCtrl = require('smallRoomCtrl')
var outMiner = require('outMiner')
var outDefend = require('outDefend')
var factory = require('factory')
var terminalCtrl = require('terminalCtrl')
var fight = require('fight')
var labCtrl = require('labCtrl')
var powerCtrl = require('powerCtrl')
var deposit = require('deposit')
var PC1 = require('PC1')
var market = require('market')
var observe = require('observe')
var cover = require('cover')
var colombu = require('colombu')
var autoOutMiner = require('autoOutMiner')
var defend = require('defend')
var autoConSite = require('autoConSite')
var towerEstimate = require('towerEstimate')
var task = require('task')
var power = require('power')
var battle = require('battle')
var overShard = require('overShard')
 
require('prototype.Creep.move')
require('prototype.Room')

Object.defineProperty(global, '有啥', { get: sell })
Object.defineProperty(global, '缺啥', { get: lack })
Object.defineProperty(global, '干啥', { get: report })
Object.defineProperty(global, '挖啥', { get: report_deposit })
Object.defineProperty(global, '枪支弹药', { get: report_T3 })
require('prototype.Whitelist')

//Object.defineProperty(global, '命令名', { get: () => { console.log('执行命令') } })

const myrooms = _.filter(Game.rooms, (x) => x.controller && x.controller.my)
    

module.exports.loop = function () {
    require('prototype.Creep.move').moveCache.clear()
    
    Game.a = amountOf
    Game.cp = componentOf

    linkCtrl.run()
    towerF.run();
    creepsManager.run();
    SourceKeeperCtrl.run();

    myrooms.forEach(room => {
        smallRoomCtrl.run(room.name)
        room = Game.rooms[room.name]
        let powerSpawn = room.powerSpawn();
        if(room.storage && room.storage.store.energy > 100000 && powerSpawn && 
            powerSpawn.store.energy >=50 && powerSpawn.store.power){
            room.powerSpawn().processPower()
        }
    });
    autoOutMiner.run();
    if(Game.time % 200 < 60){
        observe.run();
    }
    
    deposit.ctrl();
    power.run();
    task.run();
    if(Game.time % 10 == 0)terminalCtrl.run();

    if(Game.shard.name == 'shard3'){
        
        if(Game.time % 10 <= 0){
                //towerEstimate.run('W9S11','W11S22')
                Game.market.deal('5e995a7d8d97a579c3d9df3f',5000,'W38N24')
        }
    
        
        let tower = Game.getObjectById('5e88a62be49207e6aa87c4bc')
        if(tower){
            let fang = tower.room.find(FIND_CREEPS,{
                filter:(o)=>(o.owner.username == 'fangxm' && o.hits < o.hitsMax)
            })
            if(fang.length){
                tower.heal(fang[0])
            }
            //console.log(tower.heal(Game.getObjectById('5e88981d444aab6ef6c52e8c')))
        }
        let c = Game.creeps.SUP_W9S11;
        if(c){
            let spawn = c.room.terminal
            let creep = Game.getObjectById('5e88aa22a29647173611b9ea')
            if(creep ){
                c.memory.role = null;
                if(c.store.energy){
                    c.moveTo(creep,{range:1})
                    c.transfer(creep,'energy')
                }else{
                    c.moveTo(spawn,{range:1})
                    c.withdraw(spawn,'energy')
                }
            }else{
                c.memory.role = 'Nharvester'
            }
        }
        
        if(Game.time % 10 == 0){
            market.run();
        } 
        defend.run();
        
        
        //outDefend.run();
        
        //
        //factory.run();
        
        if(Game.cpu.bucket >= 7100){
            powerCtrl.run('W38N26')
            powerCtrl.run('W38N24')
            powerCtrl.run('W43N27')
            powerCtrl.run('W47N21')
            
        }
        
        PC1.run();
        
        labCtrl.run('W38N26','GH2O',36000)
        
    }
    if(Game.shard.name == 'shard2'){
        autoConSite.run('E41N42')
        autoConSite.run('E41N35')
        autoConSite.run('E39N51')
        if(Game.time % 5 <= 2){
            //console.log('esti')
            //towerEstimate.run('E41N42','E41N42')
        }
        //console.log(Game.spawns.Spawn1.spawnCreep([MOVE],'TT'))
        //Game.creeps.TT.moveTo(new RoomPosition(25,25,'E40N40'))
        Game.getObjectById('5e67fda64ea07c97978e4edb').observeRoom('E40N40')
    }
    autoConSite.test();
    if(Game.time % 10 == 0)market.energyBuy();
    
    Memory.cpu = Memory.cpu * 2047/2048 + Game.cpu.getUsed()/2048;
    if(Game.time%53==0){
        console.log(Memory.cpu)
    }

    let creep = Game.creeps.CLAIM;
    if(creep){
        let flag = Game.flags.CLAIM;
        if(creep.pos.isNearTo(flag)){
            creep.claimController(creep.room.controller)
            creep.signController(creep.room.controller,'星星之火，可以燎原。犯我中华，虽远必诛。')
        }else{
            creep.moveTo(flag,{range:1})
        }
        
    }
    battle.run('W38N24',Game.flags.ATTACK)
    battle.run('W38N24',Game.flags.ATTACK2)
    /*
    Game.spawns.Spawn1.spawnCreep([CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,
        CARRY,CARRY,CARRY,CARRY,CARRY,
    WORK,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE],'TT')*/
    creep = Game.creeps.TT;
    if(creep){//Game.creeps.TT.moveTo(new RoomPosition(25,25,'W50N20'))
        if(creep.store.energy){
            if(Game.shard.name == 'shard3' && creep.pos.roomName == 'W9S11'){
                if(creep.pos.isNearTo(creep.room.controller)){
                    creep.upgradeController(creep.room.controller)
                }else{
                    creep.moveTo(creep.room.controller,{range:1})
                }
            }else{
                let path = [ 
                    { shard: 'shard3', roomName: 'W40N20', x: 27, y: 19 },
                { shard: 'shard2', roomName: 'W40N20', x: 34, y: 43 },
                { shard: 'shard1', roomName: 'W40N20', x: 31, y: 10 },
                { shard: 'shard0', roomName: 'W80N20', x: 31, y: 10 },
                { shard: 'shard1', roomName: 'W40N10', x: 44, y: 16 },
                { shard: 'shard0', roomName: 'W70N19', x: 35, y: 2 },
                { shard: 'shard0', roomName: 'W61N20', x: 48, y: 34 },
                { shard: 'shard0', roomName: 'W60S10', x: 43, y: 26 },
                { shard: 'shard1', roomName: 'W30S10', x: 43, y: 22 },
                { shard: 'shard0', roomName: 'W60S19', x: 40, y: 48 },
                { shard: 'shard0', roomName: 'W20S20', x: 35, y: 40 },
                { shard: 'shard1', roomName: 'W10S10', x: 22, y: 18 },
                { shard: 'shard2', roomName: 'W10S10', x: 25, y: 32 } ,
                { shard: 'shard3', roomName: 'W9S11', x: 14, y: 19 }
            ]
                creep.moveTo(overShard.run(creep,path),{visualizePathStyle:{color:0xffffff}})
                console.log(creep.pos,overShard.run(creep,path) )
            }
        }else{
            creep.moveTo(creep.room.storage)
            creep.withdraw(creep.room.storage,'energy')
        }
    }
    

    if(Memory.grafana)
    Memory.grafana.credits = Game.market.credits;
    
}



function amountOf(type,showDetail){
    if(showDetail === undefined || showDetail){
        showDetail = true;
    }else{
        showDetail = false;
    }
    const rooms = _.filter(Game.rooms, (x) => x.controller && x.controller.my && x.terminal)
    var amount = 0;
    rooms.forEach(room => {
        var roomAmount = 0
        roomAmount += room.terminal.store[type]
        if(room.storage){
            roomAmount += room.storage.store[type]
        }
        if(Memory.factory[room.name] && Memory.factory[room.name].factoryId){
            roomAmount += Game.getObjectById(Memory.factory[room.name].factoryId).store[type]
        }
        amount += roomAmount;
        if(showDetail)
            console.log(room.name ,'has',roomAmount)
    });
    console.log(type,amount)
    return amount
}

function getPrice(type){
    //return 0;
    return market.getPrice(type)
}

const baseType = ['H','O','K','U','L','Z','X','G','silicon','mist','biomass','metal','energy']
function componentOf(askType,show){
    if(show === undefined)show = true;
    if(baseType.indexOf(askType) != -1){
        var tmp = {};
        tmp[askType] = 1;
        return tmp;
    }
    var cost = 0;
    var result = {};
    var amount = COMMODITIES[askType].amount
    for(var type in COMMODITIES[askType].components){
        var res = componentOf(type,false)
        for(var re in res){
            if(!result[re])result[re] = 0;
            result[re] += res[re] * COMMODITIES[askType].components[type]
        }
    }
    for(var type in result){
        result[type] /= amount;
    }
    if(show){
        console.log(askType,'component:')
        for(var type in result){
            cost += getPrice(type)*result[type]
            console.log(type.padStart(10,' '),result[type],getPrice(type),getPrice(type)*result[type])
        }
        console.log('cost:',cost)
        console.log('output:',Math.ceil(1000/COMMODITIES[askType].cooldown)*COMMODITIES[askType].amount,'every 1000 ticks')
        console.log('level: ',COMMODITIES[askType].level)
    }
    return result;
}

function lack(){
    for(var type of baseType){
        amountOf(type,false)
    }
}
function sell(){
    for(var type in COMMODITIES){
        if(type.length > 1)
        amountOf(type,false)
    }
}
function report(){
    PC1.report();
}
function report_deposit(){
    for(var flagName in Game.flags){
        const flag = Game.flags[flagName]
        if(flag.color == COLOR_YELLOW && flag.secondaryColor == COLOR_BLUE){
            console.log(flag.pos.roomName)
        }
    }
}
function report_T3(){
    for(var type in REACTIONS.X){
        if(type.length==4){
            amountOf(REACTIONS.X[type],false)
        }
    }
}
