let spawnCtrl = require("spawnCtrl")

let Export = {
    run(){
        // 确保regist完成后
        this.afterRegist();
        for(let room of Game.myrooms){
            let work = room.memory.carryWork;
            
            // try{
                spawnTask(room)
            // }catch(err){
            //     console.log(err)
            // }
            // 生成新的任务
            // 让每个creep工作
            for(let creepName in work.creeps){
                let item = work.creeps[creepName]
                this.runCreep(item,work)
            }
            // 生新的creep
            spawnCreep(work,room)

            // 移除
            _.remove(work.lists,(task)=>{
                if(task.amount <= 0){
                    work.avgWait = work.avgWait*9/10 + (Game.time - task.beginTick)/10
                    console.log('end ',task.name, Game.time - task.beginTick)
                    return true;
                }
            })
        }
    },
    runCreep(item,work){
        let creep = Game.creeps[item.creepName];
        let taskName = item.taskName;
        if(taskName){
            let task = this.getTaskByName(work,taskName)
            
            if(!task){
                item.taskName = null;
                console.log(work,taskName)
                creep.say("error")
                return;
            }
            // 有任务就做任务
            let fun = null;
            if(taskName == "link"){
                fun = creepLink;
            }else if(taskName.indexOf("container") == 0){
                fun = creepTontainer;
            }else if(taskName == "extension"){
                fun = creepExt;
            }else if(taskName == "tStorage"){
                fun = creepTStorage;
            }else if(taskName == "tower"){
                fun = creepTower;
            }else if(taskName == "drop_resource"){
                fun = creepDrop;
            }else if(taskName == "tomb"){
                fun = creepTomb;
            }
            if(fun(creep,task) == true){
                task.amount -= creep.store.getCapacity();
                if(task.amount <= 0){
                    item.taskName = null;
                }
            }
        }else{
            // 没有任务就领取
            let task = this.getFreeTask(work);
            if(task){
                item.taskName = task.name;
            }else{
                creep.say("bor")
                if(_.sum(creep.store) > 0 && creep.room.storage){
                    let storage = creep.room.storage;
                    if(creep.pos.isNearTo(storage)){
                        for(let type in creep.store){
                            creep.transfer(storage,type)
                            break;
                        }
                    }else{
                        creep.moveTo(storage,{range:1})
                    }
                }
            }
        }
    },

    getTaskByName(work,taskName){
        let tasks = _.filter(work.lists,(x)=>x.name == taskName);
        if(tasks.length)return tasks[0];
        return null;
    },

    // 获取没完成的任务
    getFreeTask(work){
        
        for(let task of work.lists){
            // 任务需要的amount总数减去当前在做这个任务的creep总数
            let amount = task.amount;
            _.forEach(work.creeps,(item)=>{
                if(item.taskName == task.name){
                    let creep = Game.creeps[item.creepName];
                    amount -= creep.store.getCapacity()
                }
            })
            if(amount > 0)return task;
        }
        return null;
    },

    // 获取房间的task
    getWork(room){
        init(room)
        return room.memory.carryWork;
    },
    
    //最朴素的添加任务
    addTask(room,task){
        let work = this.getWork(room);
        // 重名
        if(_.filter(work.lists,(x)=>x.name == task.name).length){
            return;
        }
        task.beginTick = Game.time;
        work.lists.push(task);
    },

    deleteTask(room,task){
        let work = this.getWork(room);
        _.remove(work.lists,(x)=>{
            if(x.name == task.name){
                work.avgWait = work.avgWait*9/10 + (Game.time - task.beginTick)/10
                console.log('end ',task.name, Game.time - task.beginTick)
                return true;
            }
        })
    },

    updateTask(room,task){
        let work = this.getWork(room);
        let oldtask = _.find(work.lists,(x)=>x.name == task.name)
        if(oldtask){
            for(let key in task){
                oldtask[key] = task[key]
            }
        }
    },

    //#region regist
    // 注册初始化
    registClear(){
        // 将所有creep的registed设置为false
        for(let room of Game.myrooms){
            let creeps = this.getWork(room).creeps
            for(let creepName in creeps){
                creeps[creepName].registed = false;
            }
        }
    },
    // 知道房间内有几个creep,每个creep每tick都要注册
    regist(creep){
        if(creep.spawning)return;
        let work = this.getWork(creep.room);
        let creeps = work.creeps;
        // 如果不存在就新建
        if(!creeps[creep.name]){
            creeps[creep.name] = {}
        }
        let item = creeps[creep.name]
        item.registed = true;
        if(!item.creepName)
            item.creepName = creep.name
    },
    //注册完成后清理不存在的creep
    afterRegist(){
        for(let room of Game.myrooms){
            let work = room.memory.carryWork
            let creeps = this.getWork(room).creeps
            for(let creepName in creeps){
                if(!creeps[creepName].registed){
                    
                    delete Memory.rooms[room.name].carryWork.creeps[creepName]
                }
            }
        }
    }
    //#endregion
}

function terminalLimit(resourceType){
    if(resourceType == RESOURCE_ENERGY){
        return 20*1000;
    }
}

function findTransferTarget(room,resType){
    if(room.terminal && 
        room.terminal.store.getUsedCapacity(resType) < terminalLimit(resType)){
            return room.terminal
        }
    if(room.storage){
        return room.storage;
    }
    if(resType == RESOURCE_ENERGY){
        let targets = room.find(FIND_MY_STRUCTURES, {
            filter: (o)=>{
                return ( o.structureType == STRUCTURE_EXTENSION 
                    || o.structureType == STRUCTURE_SPAWN) &&
                    o.store.getFreeCapacity(resType) > 0
            }
        });
        if (targets.length)return targets[0];
    }
    // todo 这咋办
    console.log("找不到接锅的",room)
    return null;
}

function findWithdrawTarget(room,resType){
    if(room.storage && room.storage.store.getUsedCapacity(resType) > 0)return room.storage;
    if(room.terminal && room.terminal.store.getUsedCapacity(resType) > 0)return room.terminal;
    return null;
}

//#region link

function spawnTaskLink(room){
    let centerLink = room.centerLink()
    if(!centerLink)return 
    let amount = centerLink.store.getUsedCapacity(RESOURCE_ENERGY)
    if(amount > 0){
        Export.addTask(room,{
            name:"link",
            amount
        });
    }
}

function creepLink(creep,task){
    let centerLink = creep.room.centerLink()
    let transferTarget = findTransferTarget(creep.room,RESOURCE_ENERGY)
    return WAT(creep,centerLink,transferTarget,RESOURCE_ENERGY)
}

//#endregion

//#region container
function spawnTaskContainer(room){
    let containers = room.find(FIND_STRUCTURES,{filter:(o)=>{
        if(o.structureType != STRUCTURE_CONTAINER)return false;
        return o.pos.lookFor(LOOK_FLAGS).length !=0
    }})
    for(let container of containers){
        let amount = container.store.getUsedCapacity(RESOURCE_ENERGY)
        let limit = Export.getWork(room).creepCapacity;
        if(amount >= limit){
            Export.addTask(room,{
                name :"container_"+container.id.slice(-4),
                amount:amount - amount%limit,
                targetID:container.id
            })
        }
    }
}

function creepTontainer(creep,task){
    let target = Game.getObjectById(task.targetID);
    let transferTarget = findTransferTarget(creep.room,RESOURCE_ENERGY)
    let callback = WAT(creep,target,transferTarget,RESOURCE_ENERGY)
    if(callback == true && task.amount <= 1000){
        Export.deleteTask(creep.room,task)
    }
    return callback;
}

//#endregion

//#region extension
function spawnTaskExt(room){
    let amount = room.energyCapacityAvailable - room.energyAvailable
    if(amount > 0){
        Export.addTask(room,{
            name:"extension",
            amount
        })
    }
}

function findExt(creep,expid = null){
    let target = creep.pos.findClosestByPath(FIND_STRUCTURES,{filter:(o)=>{
        if(o.structureType != STRUCTURE_EXTENSION &&
            o.structureType != STRUCTURE_SPAWN)
            return false;
        if(o.store && o.store.getFreeCapacity(RESOURCE_ENERGY) == 0)return false;
        if(o.id == expid)return false;
        return true;
    }})
    return target;
}

function creepExt(creep,task){
    if(creep.store.getUsedCapacity(RESOURCE_ENERGY) == 0){
        let withdrawTarget = findWithdrawTarget(creep.room,RESOURCE_ENERGY)
        if(withdrawTarget){
            if(creep.pos.isNearTo(withdrawTarget)){
                creep.withdraw(withdrawTarget,RESOURCE_ENERGY)

                let ext = findExt(creep)
                if(ext){
                    if(!creep.pos.isNearTo(ext))
                        creep.moveTo(ext,{range:1})
                }else{
                    return true;
                }
            }else{
                creep.moveTo(withdrawTarget,{range:1})
            }
        }
    }else{
        let ext = findExt(creep)
        if(ext){
            if(creep.pos.isNearTo(ext)){
                creep.transfer(ext,RESOURCE_ENERGY)
                let nextExt = findExt(creep,ext.id)
                if(nextExt && !creep.pos.isNearTo(nextExt)){
                    creep.moveTo(nextExt,{range:1})
                }
            }else{
                creep.moveTo(ext,{range:1})
            }
        }else{
            return true;
        }
    }
    return false;
}

//#endregion

//#region tstorage
function spawnTaskTStorage(room){
    let tStorage = room.tStorage()
    if(!tStorage)return;
    let amount = tStorage.store.getFreeCapacity(RESOURCE_ENERGY)
    if(amount > room.memory.carryWork.creepCapacity*0.9){
        Export.addTask(room,{
            name:"tStorage",
            amount
        });
    }
}

function creepTStorage(creep,task){
    let tStorage = room.tStorage()
    if(!tStorage){
        return true;
    }
    if(creep.store.getFreeCapacity(RESOURCE_ENERGY) != 0){
        let withdrawTarget = findWithdrawTarget(creep.room,RESOURCE_ENERGY)
        if(withdrawTarget){
            if(creep.pos.isNearTo(withdrawTarget)){
                creep.withdraw(withdrawTarget,RESOURCE_ENERGY)
                creep.moveTo(tStorage,{range:1})
            }else{
                creep.moveTo(withdrawTarget,{range:1})
            }
        }
    }else{
        if(creep.pos.isNearTo(tStorage)){
            creep.transfer(tStorage,RESOURCE_ENERGY)
            return true;
        }else{
            creep.moveTo(tStorage,{range:1})
        }
    }
    return false
}

//#endregion

//#region tower

function spawnTaskTower(room){
    let amount = 0;
    let cnt = 0;
    
    Memory.towers[room.name].towerIds.forEach(towerId => {
        let tower = Game.getObjectById(towerId)
        if(tower){
            let free = tower.store.getFreeCapacity(RESOURCE_ENERGY)
            amount += free
            cnt ++;
        }
        
    });
    if(amount / cnt >= 250)
        Export.addTask(room,{
            name:"tower",
            amount
        })
}

function findTower(creep){
    let target = creep.pos.findClosestByPath(FIND_STRUCTURES,{filter:(o)=>{
        if(o.structureType != STRUCTURE_TOWER)return false;
        if(o.store && o.store.getFreeCapacity(RESOURCE_ENERGY) == 0)return false;
        return true;
    }})
    return target;
}

function creepTower(creep,task){
    if(creep.store.getUsedCapacity(RESOURCE_ENERGY) == 0){
        let withdrawTarget = findWithdrawTarget(creep.room,RESOURCE_ENERGY)
        if(withdrawTarget){
            if(creep.pos.isNearTo(withdrawTarget)){
                creep.withdraw(withdrawTarget,RESOURCE_ENERGY)

                let tower = findTower(creep)
                if(tower){
                    if(!creep.pos.isNearTo(tower))
                        creep.moveTo(tower,{range:1})
                }else{
                    return true;
                }
            }else{
                creep.moveTo(withdrawTarget,{range:1})
            }
        }
    }else{
        let tower = findTower(creep)
        if(tower){
            if(creep.pos.isNearTo(tower)){
                creep.transfer(tower,RESOURCE_ENERGY)
                let nextTower = findTower(creep,tower.id)
                if(nextTower && !creep.pos.isNearTo(nextTower)){
                    creep.moveTo(nextTower,{range:1})
                }
            }else{
                creep.moveTo(tower,{range:1})
            }
        }else{
            return true;
        }
    }
    return false;
}

//#endregion

//#region dropped resources

function spawnTaskDrop(room){
    let resources = room.find(FIND_DROPPED_RESOURCES)
    let amount = _.sum(resources,(r)=>(r.amount))
    if(amount > 0){
        Export.addTask(room,{
            name:"drop_resource",
            targetID:resources[0].id,
            amount
        })
    }
}

function creepDrop(creep,task){
    let resource = Game.getObjectById(task.targetID)
    if(!resource){
        resource = _.head(creep.room.find(FIND_DROPPED_RESOURCES))
        if(resource){
            task.targetID = resource
        }
    }
    if(!resource){
        return true;
    }
    if(creep.pos.isNearTo(resource)){
        // if(creep.pickup(resource) == OK){
            task.amount -= resource.amount
        // }
        
    }else{
        creep.moveTo(resource,{range:1})
    }
    return false;
}

//#endregion

//#region tomb

function spawnTaskTomb(room){
    let tombs = room.find(FIND_TOMBSTONES)
    let amount = 0;
    for(let t of tombs){
        amount += _.sum(t.store)
    }
    if(amount > 0){
        Export.addTask(room,{
            name:"tomb",
            amount,
            targetID:tombs[0].id
        })
    }
}

function creepTomb(creep,task){
    let tomb = Game.getObjectById(task.targetID)
    if(tomb && (_.sum(tomb.store) == 0))tomb = null;
    if(!tomb){
        tomb = _.head(creep.room.find(FIND_TOMBSTONES,{filter:(o)=>{_.sum(o.store)}}))
        if(tomb){
            console.log(tomb)
            task.targetID = tomb
        }
    }
    if(!tomb){
        return true;
    }
    if(creep.pos.isNearTo(tomb)){
        for(let type in tomb.store){
            creep.withdraw(tomb,type)
            break;
        }
        task.amount -= tomb.amount
    }else{
        creep.moveTo(tomb,{range:1})
    }
    return false;
}

//#endregion

function WAT(creep,withdrawTarget,transferTarget,resourceType,amount){
    if(creep.store.getUsedCapacity(resourceType)==0){
        if(creep.pos.isNearTo(withdrawTarget)){

            if(amount)
                creep.withdraw(withdrawTarget,resourceType,amount)
            else
                creep.withdraw(withdrawTarget,resourceType)

            if(!creep.pos.isNearTo(transferTarget)){
                creep.moveTo(transferTarget,{range:1});
            }
        }else{
            creep.moveTo(withdrawTarget,{range:1});
        }
    }else{
        if(creep.pos.isNearTo(transferTarget)){

            if(amount)
                creep.transfer(transferTarget,resourceType,amount)
            else
                creep.transfer(transferTarget,resourceType)
            
            return true;
        }else{
            creep.moveTo(transferTarget,{range:1})
        }
    }
    return false;
}

function spawnTask(room){
    spawnTaskLink(room);
    spawnTaskContainer(room);
    spawnTaskExt(room);
    spawnTaskTStorage(room);
    spawnTaskTower(room);
    if(Game.time % 3 ==0){
        spawnTaskDrop(room);
        spawnTaskTomb(room);
    }
}

function spawnCreep(work,room){
    if(needToSpawn(work,room)){
        let body = spawnCtrl.getbody([],[CARRY,CARRY,MOVE],room.energyCapacityAvailable)
        work.creepCapacity = body.length/3*100;
        // spawnCtrl.addSpawnList(room.name,body,'carryer'+Game.time%1000,
        // {memory:{role:"carryer"}},3);
    }
}

function needToSpawn(work,room){
    if(spawnCtrl.getList(room,(o)=>(o.name.indexOf("carryer")!=-1)).length){
        return;
    }
    // 没有storage不用造carryer
    if(!room.storage)return false;
    // 最年轻creep寿命不足150时，亟需生产新的


    // 平均等待时间超过50增加容量上限

    // 获取总容量
    let totalCapacity = 0;
    
    _.forEach(work.creeps,item=>{
        let creep = Game.creeps[item.creepName];
        if(creep)
            totalCapacity += creep.store.getCapacity()
    })
    
    return totalCapacity <= _.min([2000,room.energyCapacityAvailable/2])

}

function init(room){
    if(!room.memory.carryWork)room.memory.carryWork = {}
    let work = room.memory.carryWork;
    if(!work.creeps)work.creeps = {}
    if(!work.lists)work.lists = []
    if(!work.creepCapacity)work.creepCapacity = 150;
    if(!work.avgWait)work.avgWait = 0;
}

module.exports = Export;