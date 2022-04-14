let SourceKeeperCtrl = require('SourceKeeperCtrl')
let baseCreep = require("baseCreep")
let autoConSite = require("autoConSite")
let autoOutMiner = require("autoOutMiner")
let spawnCtrl = require("spawnCtrl")
let tower = require("tower")
let carryTaskCtrl = require("carryTaskCtrl")
let carryCtrl = require("carryCtrl")
let carryEnergy = require("carryEnergy")

require('prototype.Creep.move')
require('prototype.Room')

module.exports.loop = function () {
    Game.myrooms = _.filter(Game.rooms, (x) => x.controller && x.controller.my);
    // 对穿
    require('prototype.Creep.move').moveCache.clear()

    // 矿机第一
    SourceKeeperCtrl.run();

    //初始化
    baseCreep.init();
    carryCtrl.init();

    // 生产并运行harvetser builder upgrader
    baseCreep.run();

    // 外矿
    autoOutMiner.run();

    // 自动建造
    autoConSite.run();


    //生产
    spawnCtrl.spawn();

    //tower
    tower.run()

    try{
        carryEnergy.run()
    }catch(err){console.log(err.stack)}

    //carryTask
    // try{
        carryTaskCtrl.run();
    // }catch(err){}
    // carryTaskCtrl.addTask(
    //     Game.rooms['W3N8'],
    //     Game.getObjectById("3dde603ca959353"),
    //     Game.rooms['W3N8'].storage,"energy","link");


    let creep = Game.creeps["harvester225"]
    if(creep){
        // creep.moveTo(28,14)
        // creep.transfer(creep.room.storage,"energy")
    }

    autoConSite.test();

    // 清理内存
    clear();
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
}
/**
 * 第一次运行时需要在控制台运行的代码
 * Memory.towers = {}
 */