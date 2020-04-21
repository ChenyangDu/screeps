/*
 * @Author: your name
 * @Date: 2020-03-29 00:25:21
 * @LastEditTime: 2020-04-08 14:23:51
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \default\battle.js
 */
const T3 = ['XGHO2','XUH2O','XKHO2','XLHO2','XZH2O','XZHO2']
var terminalCtrl = require('terminalCtrl')

var room,labs;

module.exports = {
    run:function(spawnRoomName,attackFlag){
        if(Game.shard.name == 'shard3'){
            room = Game.rooms[spawnRoomName]
            labs = room.find(FIND_STRUCTURES,{
                filter: { structureType: STRUCTURE_LAB }
            });
            let laber = Game.creeps['laber'+spawnRoomName]
            if(!laber){
                let spawn = getAvaliableSpawn(spawnRoomName)
                if(spawn){
                    spawn.spawnCreep([CARRY,CARRY,MOVE,CARRY,CARRY,MOVE,CARRY,CARRY,MOVE,CARRY,CARRY,MOVE,CARRY,CARRY,MOVE,CARRY,CARRY,MOVE,CARRY,CARRY,MOVE],
                        'laber'+spawnRoomName)
                }
            }else{
                runLaber(laber)
            }
            runTerminal(spawnRoomName)
            
            flagRun(spawnRoomName, attackFlag)
        }
        
    },
    spawn:function(spawnRoomName){

    }
}

function flagRun(spawnRoomName,flag){
    var creeps = [];
    
    for(var i = 0;i < 4;i++){
        var creepName = flag.name + '_刑天_' + i;
        if(!Game.creeps[creepName]){
            const size = 10;
            var body = cal_body({tough:size,heal:3*size,move:size})
            if(i == 0){
                if(flag.name == 'ATTACK' ||flag.name == 'ATTACK2')
                    body = cal_body({tough:size,attack:3*size,move:size})
                else{
                    body = cal_body({tough:size,attack:3*size,move:size})
                }
            }
            let spawn = getAvaliableSpawn(spawnRoomName)
            //console.log(spawn)
            if(spawn /*&& Game.time % 1500 >= 1100 && Game.time % 1500 <= 1200*/){
                //spawn.spawnCreep(body,creepName)
            }
            return;
        }else{
            creeps.push(Game.creeps[creepName])
        }
    }
    if(flag.name != 'ATTACK'){
        var all_renewed = true;
        for(var creep of creeps){
            if(creep.ticksToLive < 1450 && creep.memory.renewed != true){
                var spawn = getAvaliableSpawn(creep.room.name)
                if(spawn){
                    if(creep.pos.isNearTo(spawn)){
                        spawn.renewCreep(creep)
                    }else{
                        creep.moveTo(spawn);
                    }
                }

                all_renewed = false;
            }
            if(creep.ticksToLive >= 1450){
                creep.memory.renewed = true
            }
        }
        if(!all_renewed)return;
        //console.log('all renewed')

        var all_boosted = true;
        
        let lab_usd = [0,0,0,0,0,0];
        
        for(var creep of creeps){
            for(var i = 0;i<6;i++){
                let lab = labs[i];
                //creep.memory['boosted'+i] = false;
                if(creep.memory['boosted'+i] != true){
                    
                    if(creep.pos.isNearTo(lab)){
                        if(lab_usd[i] == 0){
                            lab.boostCreep(creep)
                            creep.memory['boosted'+i] = true;
                            lab_usd[i] = 1;
                        }
                    }else{
                        creep.moveTo(lab,{range:1})
                    }
                    all_boosted = false;
                }
            }
        }

        if(!all_boosted)return;
    }


    
    

    //一会写
    const head = creeps[0];

    if(head.pos.isNearTo(flag)){
        var attackTargets = flag.pos.lookFor(LOOK_STRUCTURES);
            attackTargets.forEach(attackTarget => {
                head.dismantle(attackTarget)
                head.attack(attackTarget)
            });
    }
    let enermy = head.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
    if(enermy && head.pos.isNearTo(enermy)){
        head.attack(enermy)
    }
    for(var i = 1;i<creeps.length;i++){
        var creep = creeps[i];
        if(creep.hits < creep.hitsMax){
            creep.heal(creep)
            continue;
        }
        let targets = creep.pos.findClosestByRange(FIND_MY_CREEPS,{filter:(c)=>(c.hits < c.hitsMax) })
        let target = null;
        if(targets && creep.pos.inRangeTo(targets,3)){
            target = targets;
        }
        if(!target){
            if(creep.pos.inRangeTo(head,3)){
                target = head;
            }
        }
        heal(creep,target)
    }

    let all_cool = true;
    for(var creep of creeps){
        if(creep.fatigue != 0)all_cool = false;
    }
    if(!all_cool)return ;
    //console.log('cool',all_cool)


    let path;
    console.log(flag.name,'mid',head.memory.mid)
    if(0&&head.memory.mid!=true){
        path = head.pos.findPathTo(Game.flags.MID,{ignoreCreeps:true});
        if(head.pos.isEqualTo(Game.flags.MID)){
            head.memory.mid = true
        }
    }else{
        if(0&&head.memory.mid2 != true){
            path = head.pos.findPathTo(Game.flags.MID2,{ignoreCreeps:true});
            if(head.pos.isEqualTo(Game.flags.MID2)){
                head.memory.mid2 = true
            }
        }else{
            path = head.pos.findPathTo(flag,{ignoreCreeps:true});
        }
    }

    var all_near = true;
    for(var i = 1;i<creeps.length;i++){
        var creep = creeps[i];
        if(creep.room.name == head.room.name){
            let close = 1;
            if(!creep.room.controller  ||creep.room.controller.owner != 'ChenyangDu' 
            || creep.room.controller.owner != 'Invader'){
                close = 1;
            }
            if(!creep.pos.inRangeTo(head.pos,close)){
                all_near = false;
            }
        }
    }
    console.log('near',all_near)
    for(var i = 1;i<creeps.length;i++){
        var creep = creeps[i];
        if(!all_near && creep.pos.isNearTo(head)){
            continue;
        }
        if(creep.pos.isNearTo(head)){
            if(path.length)
            creep.move(path[0].direction)
        }else
        creep.moveTo(head,{ignoreCreeps:false})
    }
    console.log(path.length)
    if(all_near || creep.room.name == spawnRoomName){
        if(path.length)
        head.move(path[0].direction);
    }
    
}

function runTerminal(spawnRoomName){
    let terminal = room.terminal;
    if(Game.time % 10 == 0){
        T3.forEach(type => {
            if(terminal.store[type] < 9000){
                terminalCtrl.need(spawnRoomName,type,1000)
            }
        });
    }
}

function runLaber(creep){
    if(creep.store.getUsedCapacity()){
        runLaber_full(creep)
    }else{
        runLaber_empty(creep)
    }
}
function runLaber_full(creep){
    let type;
    let target = null;
    for(type in creep.store);
    let index = T3.indexOf(type);
    if(index != -1){
        let lab = labs[index];
        if(lab.mineralType == undefined || (lab.mineralType == type && lab.store[type] < 3000)){
            target = lab;
        }
    }
    if(target == null){
        if(room.terminal.store.getFreeCapacity(type)){
            target = room.terminal;
        }else{
            target = room.storage;
        }
    }

    if(creep.pos.isNearTo(target)){
        creep.transfer(target,type)
    }else{
        creep.moveTo(target,{range:1});
    }
}
function runLaber_empty(creep){
    let target = null,type = null;
    for(let i=0;i<6;i++){
        let lab = labs[i]
        if(lab.store[T3[i]] == 3000)continue;//如果满了，并且符合要求
        if(lab.mineralType == undefined || lab.mineralType == T3[i]){//符合要求，但是还没满或者空的
            if(room.terminal.store[T3[i]]){
                target = room.terminal;//从terminal里面取
                type = T3[i];
            }else{
                continue;//terminal没有就算了
            }
        }
        if(lab.mineralType && lab.mineralType != T3[i]){//放错了
            target = lab;
            type = lab.mineralType;
        }
    }
    if(target == null)return;
    if(creep.pos.isNearTo(target)){
        creep.withdraw(target,type)
    }else{
        creep.moveTo(target,{range:1});
    }
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

function cal_body(opt){
    var ans = [];
    for(var type in opt){
        for(var i=0;i<opt[type];i++){
            ans.push(type)
        }
    }
    return ans;
}

function heal(creep,target){
    
    if(!target){creep.heal(creep)
            return;
    }
    if(creep.room.name == target.room.name){
        if(creep.pos.isNearTo(target)){
            creep.heal(target)
        }else if(creep.pos.inRangeTo(target,3)){
            creep.rangedHeal(target)
        }else {
            creep.heal(creep)
        }
    }else{
        creep.heal(creep)
    }
}

function ra(creep,pos,distance){
    creep.heal(creep)
    creep.rangedMassAttack();
    if(creep.pos.isNearTo(pos)){
        let target = pos.lookFor(LOOK_STRUCTURES)
        if(target.length){
            creep.rangedAttack(target[0])
        }
    }else{
        creep.moveTo(pos,{range:distance})
    }
}