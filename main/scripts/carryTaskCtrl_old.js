let spawnCtrl = require("spawnCtrl")

let Export = {
    run(){
        // 确保regist完成后
        this.afterRegist();
        for(let room of Game.myrooms){
            let work = room.memory.carryWork;
            
            // 生成新的任务
            spawnTask(work,room)
            // 让每个creep工作
            for(let creepName in work.creeps){
                let item = work.creeps[creepName]
                this.runCreep(item,work)
            }

            // 生新的creep
            spawnCreep(work,room)

            // 移除
            _.remove(work.lists,(task)=>task.cmds == 0)
        }
    },
    runCreep(item,work){
        let creep = Game.creeps[item.creepName];
        
        let taskName = item.taskName;
        if(taskName){
            // 有任务就做任务
            let task = this.getTaskByName(work,taskName);
            let resourceType = task.resourceType;
            let cmds = task.cmds;
            if(!cmds.length){
                // 任务完成，应当删除任务
                return;
            }
            let cmd = cmds[0]
            let target = Game.getObjectById(cmd.targetID)
            let amount = cmd.amount;
            console.log("cmd.amount",cmd.amount)
            if(creep.pos.isNearTo(target)){
                if(cmd.type == "withdraw"){
                    console.log("creep store ",amount,
                        creep.store.getFreeCapacity(resourceType),
                        _.min([amount,creep.store.getFreeCapacity(resourceType)]))
                    amount = _.min([amount,creep.store.getFreeCapacity(resourceType)])
                    console.log("amount",amount,creep.withdraw(target,resourceType,amount))
                }else{
                    let callback = creep.transfer(target,resourceType)
                }
                cmds.splice(0,1);
                if(cmds.length == 0){
                    
                }else{
                    // 移动到下一个点
                }
            }else{
                creep.moveTo(target);
            }
        }else{
            // 没有任务就领取
            let task = this.getFreeTask(work);
            if(task){
                item.taskName = task.name;
            }
        }
    },

    getTaskByName(work,taskName){
        let tasks = _.filter(work.lists,(x)=>x.name == taskName);
        if(tasks.length)return tasks[0];
        return null;
    },

    // 获取没人领取的任务
    getFreeTask(work){
        for(let task of work.lists){
            if(_.filter(work.creeps,(item)=>(item.taskName == task.name)).length == 0){
                return task;
            }
        }
        return null;
    },

    // 获取房间的task
    getWork(room){
        init(room)
        return room.memory.carryWork;
    },
    
    //最朴素的添加任务
    addTask(room,withdrawTarget,transferTarget,resourceType,name,amount=null){
        if(amount == null)
            amount = withdrawTarget.store.getUsedCapacity(resourceType)
        if(amount == 0){
            console.log("error amount 0 ",name)
            return;
        }
        let work = this.getWork(room);
        // 重名
        if(_.filter(work.lists,(x)=>x.name == name).length){
            return;
        }
        work.lists.push({
            name,
            resourceType,
            cmds :[
                {
                    type:"withdraw",
                    targetID:withdrawTarget.id,
                    amount
                },{
                    type:"transfer",
                    targetID:transferTarget.id,
                    amount
                }
            ]
        })
    },

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
        let work = this.getWork(creep.room);
        let creeps = work.creeps;
        // 如果不存在就新建
        if(!creeps[creep.name]){
            creeps[creep.name] = {}
        }
        let item = creeps[creep.name]
        item.creepName = creep.name
        item.registed = true;
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
    // todo 这咋办
    console.log("找不到接锅的",room)
    return null;
}

function spawnTaskLink(room){
    let centerLink = room.centerLink()
    if(centerLink.store.getUsedCapacity(RESOURCE_ENERGY) > 0){
        let target = findTransferTarget(room,RESOURCE_ENERGY)
        if(target){
            Export.addTask(room,centerLink,target,RESOURCE_ENERGY,"link");
        }
    }
}

function spawnTaskContainer(room){
    let containers = room.find(FIND_STRUCTURES,{filter:(o)=>{
        if(o.structureType != STRUCTURE_CONTAINER)return false;
        return o.pos.lookFor(LOOK_FLAGS).length !=0
    }})
    for(let container of containers){
        if(container.store.getUsedCapacity(RESOURCE_ENERGY) >= 1600){
            let target = findTransferTarget(room,RESOURCE_ENERGY)
            if(target)
                Export.addTask(room,container,target,RESOURCE_ENERGY,
                    "container_"+container.id.slice(-4))
        }
    }
}

function spawnTask(work,room){
    spawnTaskLink(room);
    spawnTaskContainer(room);

}

function spawnCreep(work,room){
    if(needToSpawn(work)){
        let body = spawnCtrl.getbody([],[CARRY,CARRY,MOVE],room.energyCapacityAvailable)
        spawnCtrl.addSpawnList(room.name,body,'carryer'+Game.time%1000,
        {memory:{role:"carryer"}});
    }
}

function needToSpawn(work){
    if(spawnCtrl.getList(room,(o)=>(o.name.indexOf("carryer")!=-1)).length){
        return;
    }
    // 获取总容量
    let totalCapacity = 0;
    
    _.forEach(work.creeps,name=>{
        let creep = Game.creeps[name];
        if(creep)
            totalCapacity += creep.store.getCapacity()
    })
    return totalCapacity <= 2000

}

function init(room){
    if(!room.memory.carryWork)room.memory.carryWork = {}
    let work = room.memory.carryWork;
    if(!work.creeps)work.creeps = {}
    if(!work.lists)work.lists = []
}

module.exports = Export;