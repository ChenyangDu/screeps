let SourceKeeperCtrl = require('SourceKeeperCtrl')
let baseCreep = require("baseCreep")
let autoConSite = require("autoConSite")
let autoOutMiner = require("autoOutMiner")
let spawnCtrl = require("spawnCtrl")
let tower = require("tower")
let carryCtrl = require("carryCtrl")
let carryEnergy = require("carryEnergy")
let carryTerminal = require("carryTerminal")
let eye = require("eye")
var labCtrl = require('labCtrl')
let miner = require('miner')
let newRoom = require('newRoom')
let shardmove = require('shardmove')
let shardMemory = require("shardMemory")
let terminalCtrl = require("./terminalCtrl")
let autoPlan = require('./建筑规划')
let safemode = require('./safemode')
let defend = require('./defend')

require('prototype.Creep.move')
require('prototype.Room')
require('./prototype.Whitelist')

// module.exports.loop=require("调用栈分析器").warpLoop(main); 
module.exports.loop=main; 
function main() {
    
    Game.myrooms = _.filter(Game.rooms, (x) => x.controller && x.controller.my
    && x.controller.level > 0);
    if(Game.myrooms.length)
        Game.username = Game.myrooms[0].controller.owner.username
    
    // 对穿
    require('prototype.Creep.move').moveCache.clear()

    // 矿机第一
    SourceKeeperCtrl.run();

    //初始化
    eye.init();
    baseCreep.init();
    labCtrl.init()
    carryCtrl.init(); // 搬运任务要在这之后
    if(Game.shard.name != 'LAPTOP-46VTIAM7'){
        shardMemory.init();
    }

    // 生产并运行harvetser builder upgrader
    baseCreep.run();

    defend.run()

    // 外矿
    autoOutMiner.run();

    // 自动建造
    autoConSite.run();

    // 生产间谍
    eye.spawnSpy();

    spawnCtrl.spawn(); //生产

    tower.run() // tower

    miner.run() // miner
    
    carryEnergy.run()
    tmp();
    newRoom.run();
    labCtrl.reaction()
    labCtrl.end() // 所有boost操作要在这之前

    carryTerminal.run() // 处理terminal

    carryCtrl.end(); // 搬运任务要在这之前

    terminalCtrl.run();

    if(Game.shard.name != 'LAPTOP-46VTIAM7'){
        shardmove.run();
        shardMemory.end();
    }

    autoConSite.test();
    safemode.run();
    // 清理内存
    clear();
    if(Game.cpu.bucket == 10000 && Game.shard.name != 'LAPTOP-46VTIAM7'){
        Game.cpu.generatePixel();
    }
    let center = Game.flags.center;
    if(center){
        let roomName = center.pos.roomName
        
        if(Game.rooms[roomName]){
            let room = Game.rooms[roomName]
            let controller = room.controller
            let miner = room.find(FIND_MINERALS)
            let sources = room.find(FIND_SOURCES)
            let points = [controller.pos,miner[0].pos,sources[0].pos]
            if(sources.length>1)points.push(sources[1].pos)
            autoPlan.run(center.pos,points)
        }else{
            let pa = Game.flags.pa;
            let pb = Game.flags.pb;
            let pc = Game.flags.pc;
            let pm = Game.flags.pm;
            if(center) {
                let points = []
                if(pc)points.push(pc.pos)
                if(pm)points.push(pm.pos)
                if(pa)points.push(pa.pos)
                if(pb)points.push(pb.pos)
                let t = Game.cpu.getUsed()
                autoPlan.run(center.pos,points)
                console.log(Game.cpu.getUsed() - t)
            }
        }
    }
    if(Game.shard.name == 'LAPTOP-46VTIAM7'){
        let center = Game.flags.center;
        if(center){
            // let roomName = center.pos.roomName
            // let ob = Game.getObjectById('67639afd3dae49d')
            // ob.observeRoom(roomName)
            // if(Game.rooms[roomName]){
            //     let room = Game.rooms[roomName]
            //     let controller = room.controller
            //     let miner = room.find(FIND_MINERALS)
            //     let sources = room.find(FIND_SOURCES)
            //     let points = [controller.pos,miner[0].pos,sources[0].pos]
            //     if(sources.length>1)points.push(sources[1].pos)
            //     require('./建筑规划').run(center.pos,points)
            // }

            // let center = Game.flags.center; // 房间中心的位置
            // let pa = Game.flags.pa;
            // let pb = Game.flags.pb;
            // let pc = Game.flags.pc;
            // let pm = Game.flags.pm;
            // if(center) {
            //     let points = [pc.pos,pm.pos,pa.pos]
            //     if(pb)points.push(pb.pos)
            //     let t = Game.cpu.getUsed()
            //     require('./建筑规划').run(center.pos,points)
            //     console.log(Game.cpu.getUsed() - t)
            // }
        }
    }
    // if(typeof(InterShardMemory) !== 'undefined')
    //     shardMemory.clear()
    Memory.cpu = Memory.cpu * 2047/2048 + Game.cpu.getUsed()/2048;
}

function tmp(){
    if(Game.shard.name == 'shard2'){
        let ob = Game.getObjectById("5e9ae4972cf61655289494f1")
        ob.observeRoom('E35N39')
    }
    // let creep = Game.creeps.claim;
    // if(creep){
    //     if(creep.ticksToLive >= 590)
    //         shardmove.start(creep.name,'shard1','E36N41')
        
    //     if(Game.shard.name == 'shard1' && creep.room.name == 'E36N41'){
    //         if(!creep.memory.overshard){
    //             creep.memory.overshard = true;
    //             shardmove.stop(creep.name)
    //         }
    //         if(creep.pos.isNearTo(creep.room.controller)){
    //             creep.claimController(creep.room.controller)
    //         }else{
    //             creep.moveTo(creep.room.controller,{
    //                 plainCost:1,
    //                 swampCost:1,
    //                 visualizePathStyle:{
    //                     fill: 'transparent',
    //                     stroke: '#fff',
    //                     lineStyle: 'dashed',
    //                     strokeWidth: .15,
    //                     opacity: .1
    //                 }})
    //         }
            
    //     }
    // }
    let highRoomName = 'E39N49'
    if(Game.shard.name == 'shard3'){
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
            
        //    spawnCtrl.addSpawnList(
            //    highRoomName,
          //      body,
             //   'help_'+highRoomName+(Game.time%3000)/750,
             //   {memory}
           // )
        }
    }
    for(let i = 0;i<6;i++){
        let creepName = 'help_'+highRoomName+i;
        let creep = Game.creeps[creepName]
        if(creep){
            if(Game.shard.name == 'shard3' && creep.room.name == highRoomName){
                if(creep.memory.boosted === false){
                    // console.log("want to boost")
                    labCtrl.boost(null,null,creep)
                }
                if(creep.memory.boosted){
                    shardmove.start(creep.name,'shard1','E36N41')
                }
            }
            if(Game.shard.name == 'shard1' && creep.room.name == 'E36N41'){
                // shardmove.stop(creep.name)
                if(!creep.memory.overshard){
                    creep.memory.overshard = true;
                    shardmove.stop(creep.name)
                }
                if(!creep.memory.role){
                    creep.moveTo(new RoomPosition(25,25,'E36N41'))
                    if(creep.pos.roomName == 'E36N41'){
                        creep.memory.role = "builder"
                    }
                }
            }
        }
    }

}


function clear(){
    for(var name in Memory.creeps){
        if(!Game.creeps[name])
            delete Memory.creeps[name];
    }
    for(var name in Memory.flags){
        if(!Game.flags[name])
            delete Memory.flags[name];
    }
    for(let name in Memory.rooms){
        if(Object.keys(Memory.rooms[name]).length == 0){
            delete Memory.rooms[name]
        }
        if(Game.time % 100 == 0 && Memory.rooms[name].structMap && !Game.rooms[name]){
            delete Memory.rooms[name].structMap
        }
    }
}