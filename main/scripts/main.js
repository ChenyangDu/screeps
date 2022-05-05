let SourceKeeperCtrl = require('SourceKeeperCtrl')
let baseCreep = require("baseCreep")
let autoConSite = require("autoConSite")
let autoOutMiner = require("autoOutMiner")
let spawnCtrl = require("spawnCtrl")
let tower = require("tower")
let carryCtrl = require("carryCtrl")
let carryEnergy = require("carryEnergy")
let eye = require("eye")
var labCtrl = require('labCtrl')
let miner = require('miner')
let newRoom = require('newRoom')

require('prototype.Creep.move')
require('prototype.Room')

module.exports.loop = function () {
    
    Game.myrooms = _.filter(Game.rooms, (x) => x.controller && x.controller.my
    && x.controller.level > 0);
    // 对穿
    require('prototype.Creep.move').moveCache.clear()

    // 矿机第一
    SourceKeeperCtrl.run();

    //初始化
    eye.init();
    baseCreep.init();
    labCtrl.init()
    carryCtrl.init();


    // 生产并运行harvetser builder upgrader
    baseCreep.run();

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

    // labCtrl.boost(Game.rooms['W8N3'],{'KH':2},Game.creeps["carryer_test"])
    // labCtrl.boost(Game.rooms['W8N3'],{'ZH':8,'ZO':2},null)

    newRoom.run();
    labCtrl.reaction()
    labCtrl.end() // 所有boost操作要在这之前

    carryCtrl.end();

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