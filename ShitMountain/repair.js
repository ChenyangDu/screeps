function Wall(creep,x=-1,y=-1,X=50,Y=50)
{
    let ret=0//用来return
    if(!creep.memory.atkd_wall){
        //小于8m才修被打的墙
        if(!Memory.cache)Memory.cache = {}
        if(!Memory.cache.rooms)Memory.cache.rooms = {};
        if(!Memory.cache.rooms[creep.room.name])Memory.cache.rooms[creep.room.name] = {};
        if(Memory.cache.rooms[creep.room.name].atkd_wall&&Game.getObjectById(Memory.cache.rooms[creep.room.name].atkd_wall).hits<8000000){//被打德华，集中维修
            creep.memory.atkd_wall=Memory.cache.rooms[creep.room.name].atkd_wall
        }
    }else if(Game.getObjectById(creep.memory.atkd_wall)){
        //修道9m
        tar =Game.getObjectById(creep.memory.atkd_wall)
        let rep_rg=creep.pos.getRangeTo(tar);
        if(Game.time%17<3){//靠近，方便大量维修工参与维修
            creep.moveTo(tar,{range:1,ignoreCreeps:0})
        }
        if(rep_rg>3) {
            if(creep.room.storage){
                let sto_rg=creep.pos.getRangeTo(creep.room.storage);
                //if(sto_rg>7){
                    creep.moveTo(tar,{range:3 ,maxRooms:1,ignoreCreeps:0});
                //}else{
                //    creep.moveTo(tar,{range:3 ,maxRooms:1});
                //}
            }else{
                if(rep_rg>5){
                    creep.moveTo(tar,{range:3 ,maxRooms:1});
                }else{
                    creep.moveTo(tar,{range:3 ,maxRooms:1,ignoreCreeps:0});
                }
            }
        }else {
            creep.repair(tar)
        }
        return 1;
    }else{
        let atkd_wall = Game.getObjectById(creep.memory.atkd_wall)
        if(atkd_wall&&atkd_wall.hits>9000000){
            creep.memory.atkd_wall=0
            Memory.cache.rooms[creep.room.name].atkd_wall=0
        }
    }
    {
        if(!creep.memory.repa){
            if(creep.ticksToLive%10==0||creep.memory.working==1)
            {
                //console.log(creep.name+'  find')
                creep.memory.working=0;
                let _repa = creep.room.find(FIND_STRUCTURES, {filter: (structure) => 
                    {return structure.hits < structure.hitsMax
                    &&(structure.hits < 500000 && (structure.structureType==STRUCTURE_RAMPART||structure.structureType==STRUCTURE_WALL));}});
                if(_repa.length){creep.memory.path=2;}
                else{creep.memory.path=0;}

                if(creep.memory.path){
                    creep.memory.repa=_repa.length;
                    if(!creep.memory._repa){
                        creep.memory._repa={};
                    }else{
                        creep.say(creep.memory.repa+ ' tags');
                        i=0;
                        for(; i<creep.memory.repa ;i++){   
                            creep.memory._repa[i]=0;
                            {creep.memory._repa[i]=_repa[i].id;}
                        }
                        creep.memory.repd=parseInt(Math.random() * creep.memory.repa);
                    }
                }else{
                    let targetrr = creep.room.find(FIND_STRUCTURES, {
                            filter: (structure) => {
                                return structure.hits < structure.hitsMax && ( structure.pos.x > x && structure.pos.x < X && structure.pos.y > y && structure.pos.y < Y )
                                &&(structure.structureType==STRUCTURE_RAMPART||structure.structureType==STRUCTURE_WALL);
                            }
                        }).sort(function(a,b){return a.hits-b.hits})[0];
                    if(targetrr){
                        creep.say('WALL');
                        creep.memory._repa={};
                        creep.memory._repa[0]=targetrr.id;
                        creep.memory.repa=1;
                    }
                }
                ret = -1;
            }
        }else{
            let tar =Game.getObjectById(creep.memory._repa[creep.memory.repd])
            if(tar){
                //路过controller % 一下
                //if(creep.repair(tar)==ERR_NOT_IN_RANGE){  creep.upgradeController(creep.room.controller);}
                while(creep.memory.repd<=creep.memory.repa){
                    tar =Game.getObjectById(creep.memory._repa[creep.memory.repd])
                    if(tar){
                        if(creep.memory.path==2){
                            //矮墙先修道1m
                            if(tar.hits > 1000000 || tar.hits >= tar.hitsMax){
                                creep.memory.repd=creep.memory.repd+1;
                            }else{
                                creep.say(Math.trunc(tar.hits/1000)+'K');
                                break
                            }
                        }else{
                            if(creep.ticksToLive%537==4||tar.hits >= tar.hitsMax){
                                creep.memory.repa=0;
                                creep.memory._repa={};
                                creep.memory.repd=0;
                                creep.memory.working=1;
                                return ret;
                            }
                            break
                        }
                    }else{
                        creep.memory.repd=creep.memory.repd+1;
                    }
                }
            }else{
                creep.memory.repd=creep.memory.repd+1;
            }
            if(creep.memory.repd>=creep.memory.repa){
                creep.memory.repa=0;
                creep.memory._repa={};
                creep.memory.repd=0;
                creep.memory.working=1;
                return ret;
            }
            tar =Game.getObjectById(creep.memory._repa[creep.memory.repd])
            let rep_rg=creep.pos.getRangeTo(tar);
            if(rep_rg>3) {
                if(creep.room.storage){
                    let sto_rg=creep.pos.getRangeTo(creep.room.storage);
                    //if(sto_rg>7){
                        creep.moveTo(tar,{range:3 ,maxRooms:1,ignoreCreeps:0});
                    //}else{
                    //    creep.moveTo(tar,{range:3 ,maxRooms:1});
                    //}
                }else{
                    if(rep_rg>5){
                        creep.moveTo(tar,{range:3 ,maxRooms:1});
                    }else{
                        creep.moveTo(tar,{range:3 ,maxRooms:1,ignoreCreeps:0});
                    }
                }
            }else {
                creep.repair(tar)/*
                if((creep.ticksToLive+rep_rg)%7==2){
                    if(!creep.pos.isEqualTo(tar)){
                        creep.say('close')
                        creep.memory._move.path=creep.pos.getDirectionTo(tar)
                        creep.moveTo(tar,{reusePath:0})
                    }
                }*/
            }
            return 1;
        }
    }
    return ret;
}




module.exports = {
    run:function(creep){
        if(creep.store.energy == 0 && creep.room.storage.store.energy){
            const storage = creep.room.storage;
            if(creep.pos.isNearTo(storage)){
                creep.withdraw(storage,RESOURCE_ENERGY)
            }else{
                creep.moveTo(storage,{range:1})
            }
        }else{
            Wall(creep)
        }
    }
}