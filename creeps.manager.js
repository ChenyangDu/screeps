/*
 * @Author: your name
 * @Date: 2020-02-01 00:50:04
 * @LastEditTime: 2020-04-09 18:04:15
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \default\creeps.manager.js
 */
var roleHarvester = require('role.harvester');
var roleUpgrader = require('role.upgrader');
var roleBuilder = require('role.builder');
var roleAttacker = require('role.attacker');
var roleAttacker2 = require('role.attacker2');
var reserve = require('role.reserve');
//var miner = require('miner')
var roleHealer = require('role.healer')
var roleSupCarryer = require('role.supCarryer')
var repair = require('repair')

var creepsManager = {
    run:function(){
        
        reserve.run();
        
        for(var name in Game.creeps) {
            var creep = Game.creeps[name];
            if(Game.shard.name != 'shard2'){
                if(creep.name.split('_')[0] == 'tmpBuilder' && !creep.memory.role){
                    creep.memory.role = 'tmpbuilder'
                }
            }
            if(name.indexOf('_刑天_') != -1){
                console.log(creep.pos)
                if(Game.shard.name != 'shard3'){
                    creep.moveTo(overShard(creep,paths),{visualizePathStyle:{color:0xffffff}})
                }
                
            }
            try{
            switch(creep.memory.role){
                case 'harvester':
                    roleHarvester.run(creep);break;
                case 'Nharvester':
                    roleHarvester.run(creep);break;
                case 'upgrader':
                    roleUpgrader.run(creep);break;
                case 'Nupgrader':
                    if(Game.cpu.bucket >= 7000)
                        roleUpgrader.run(creep);
                    break;
                case 'builder':
                    roleBuilder.run(creep);break;
                case 'tmpbuilder':
                    tmpBuilder(creep);break;
                case 'Nbuilder':
                    roleBuilder.run(creep);break;
                case 'attacker':
                    roleAttacker.run(creep);break;
                case 'attacker2':
                    roleAttacker2.run(creep);break;
                case 'miner':
                    //miner.run(creep);
                    break;
                case 'healer':
                    roleHealer.run(creep,new RoomPosition(34,11,'W39N27'));break;
                case 'supCarryer':
                    if(Game.shard.name == 'shard3' && creep.room.name != 'W43N27'&& creep.room.name != 'W47N21')
                        roleSupCarryer.run(creep);
                    break;
                case 'repairer':
                    repair.run(creep);
                    break;
            }
            }catch(err){console.log(creep,err)}
            
        }
        
        for(var name in Memory.creeps){
            if(!Game.creeps[name])
                delete Memory.creeps[name];
        }
        for(var name in Memory.flags){
            if(!Game.flags[name])
                delete Memory.flags[name];
        }
    }
}

let paths = [ 
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

function overShard(creep,paths){
    paths = _.filter(paths,(o)=>(o.shard == Game.shard.name))
    let ret = _.min(paths,(o)=>(Game.map.getRoomLinearDistance(creep.pos.roomName,o.roomName)))
    if(ret)return new RoomPosition(ret.x,ret.y,ret.roomName)
    else return null;
}

function tmpBuilder(creep){
    if(creep){
        if(creep.memory.role  == 'tmpbuilder'){
            /*
            if(creep.pos.roomName == 'W9S11' && Game.shard.name == 'shard3'){
                if(creep.pos.isNearTo(creep.room.controller)){
                    creep.memory.role = 'Nbuilder'
                }
                return;
            }
            else{
                creep.moveTo(overShard(creep,path))
                return;
            }*/
            //creep.say('shard2!')
            //console.log(creep.pos)
            if(Game.flags.MID && creep.memory.mid != true){
                creep.moveTo(Game.flags.MID,{visualizePathStyle: {stroke: '#ffffff'}})
                if(creep.pos.isNearTo(Game.flags.MID)){
                    creep.memory.mid = true;
                }
            }else{
                if(creep.pos.roomName == Game.flags.CLAIM.pos.roomName){
                    creep.moveTo(Game.flags.CLAIM,{visualizePathStyle: {stroke: '#ffffff'},maxRooms:1})
                }else
                creep.moveTo(Game.flags.CLAIM,{visualizePathStyle: {stroke: '#ffffff'}})
                    
                if(Game.shard.name != 'shard2' && creep.pos.inRangeTo(Game.flags['CLAIM'],50)){
                    creep.memory.role = 'Nbuilder'
                }
            }
        }
    }
}
module.exports = creepsManager;