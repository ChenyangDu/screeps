/**
【功能】合成、boost
【结构】占用room.memory.lab，和creep.memory.boost

【思路】
记录所有的lab.id，取出核心的两个lab

合成：
调用方法reaction(room)
合成所有化合物，只要原料充足就合成产物，产物设置上限，原料取用设置下限
原料炉有料，且能合成就合成，不能就重新选产物
产物筛选为没有到达上限，且原料大于下限的所有化合物中，数量最少的


boost:
调用方法
if(boost(creep,{'KH':8,'ZO':2})){ // 800容量的creep搬运工
    // other code
}
每tick只能boost一只creep
初始化creep.memory.boost.done = false
creep.memory.boost.materials = [
    {
        type:'KH',amount:8,done:false
    },
    {
        type:'ZO',amount:2,
    }
]



creep需要完成的动作有
合成：
    装填原料炉
    回收产物炉
boost:
    按量装填
三者可以并行，最多可以向运维借三只creep
 */


//如果你的房间物流能够保证提供这些基础矿物，那么程序会默认这些矿物数量为无穷大
const UNLIMITED_RESOURCES = ['Z','K','U','L','H','O','X'];

let baseCreep = require("baseCreep")
let carryCtrl = require("carryCtrl")

var runCreep = {
    init(room){
        if(!room.memory.lab){
            room.memory.lab = {}
        }
        if(!room.memory.lab.creeps){
            room.memory.lab.creeps = {}
        }
        let creeps = room.memory.lab.creeps
        for(let role in creeps){
            creeps[role].usd = false
        }
    },
    getCreep(room,role){
        let creeps = room.memory.lab.creeps
        if(!creeps[role]){
            creeps[role] = {}
        }
        if(!creeps[role].name){
            let creepName = carryCtrl.borrowCreep(room,100)
            // console.log("borrow",creepName);
            creeps[role].name = creepName
        }
        
        if(creeps[role].name){
            if(creeps[role].usd)return null;// 在忙

            creeps[role].usd = true;
            return Game.creeps[creeps[role].name]
        }
        return null;
    },
    end(room){
        let creeps = room.memory.lab.creeps
        for(let role in creeps){
            if(creeps[role].usd == false){
                if(creeps[role].name){
                    let creep = Game.creeps[creeps[role].name]
                    if(!creep)continue;
                    if(creep.store.getUsedCapacity() == 0){
                        carryCtrl.returnCreep(room,creeps[role].name)
                        // console.log("return",creeps[role].name);
                        creeps[role].name = null;
                    }else{
                        let terminal = room.terminal
                        if(creep.pos.isNearTo(terminal)){
                            creep.transfer(terminal,Object.keys(creep.store)[0])
                        }else{
                            creep.moveTo(terminal)
                        }
                    }
                }
            }
        }
    }
}


module.exports={
    init(){
        Game.myrooms.forEach(room=>{
            if(room.controller.level >= 6){
                runCreep.init(room)
                boost_init(room)
            }
        })
    },
    end(){
        Game.myrooms.forEach(room=>{
            if(room.controller.level >= 6){
                boost_fill(room)
                runCreep.end(room)
            }
        })
    },
    reaction,
    boost,
    boost_init_creep_memory,
}

function reaction(){
    Game.myrooms.forEach(room=>{
        if(room.controller.level >= 6){
            initLab(room); // 初始化
            // solve_product(room) // 计算应该生产哪种化合物
            do_reaction(room)// 进行反应
        }
    })
}

function boost_init(room){
    if(!room.memory.lab){
        room.memory.lab = {}
    }
    room.memory.lab.boost = {}
}

/**
 * memory = labCtrl.boost_init_creep_memory({'LH':body.length/3},memory)
 * @param {*} opt 
 * @param {*} memory 
 * @returns 
 */
function boost_init_creep_memory(opt,memory){
    if(!memory.boost){
        memory.boost = {}
    }
    let b = memory.boost
    if(!b.materials)
        b.materials = {}
    for(let type in opt){
        let amount = opt[type]
        b.materials[type] = {
            amount,done:false
        }
    }
    memory.boosted = false
    memory.boost = b
    return memory
}
/**
 * 三种用法，第一种是提前给creep的memory写好，然后运行(null,null,creep)
 * 第二种是(null,opt,creep)
 * 第三种是(room,opt,null)
 * @param {Room} room 
 * @param {*} opt 
 * @param {Creep} creep 
 */
function boost(room,opt,creep){
    if(creep){
        if(creep.memory.boosted == undefined){
            creep.memory.boosted = false
        }
        let creep_memory = creep.memory.boost
        let room_memory = creep.room.memory.lab
        
        if(!creep.memory.boost){ // 初始化
            creep.memory.boost = {}
            creep_memory = creep.memory.boost
            creep_memory.materials = {}
            for(let type in opt){
                let amount = opt[type]
                creep_memory.materials[type] = {
                    amount,done:false
                }
            }
        }
        creep.memory.boosted = true;
        for(let type in creep_memory.materials){
            let material = creep_memory.materials[type]
            if(!material.done){
                let amount = material.amount*30
                if(!room_memory.boost[type]){
                    room_memory.boost[type] = 0;
                }
                room_memory.boost[type] += amount;
                creep.memory.boosted = false;
            }
        }

        if(!creep.memory.boosted){
            // 找到所有符合条件的lab
            let labs = []
            for(let id in room_memory.boost_labs){
                let _type = room_memory.boost_labs[id].type
                if(creep_memory.materials[ _type ] &&
                    creep_memory.materials[ _type ].done == false){
                        let lab = Game.getObjectById(id)
                        if(lab.mineralType == _type && 
                            lab.store.getUsedCapacity("energy")*3>= lab.store[_type]*2 ){
                            labs.push(lab)
                        }
                    }
            }
            // console.log(labs)
            // 找到最近的
            let target = creep.pos.findClosestByPath(labs,{
                algorithm:'dijkstra'
            })
            if(creep.pos.isNearTo(target)){
                // 找周围一圈lab
                let targets = creep.pos.findInRange(labs,1)
                targets.forEach(lab=>{
                    lab.boostCreep(creep)
                    creep_memory.materials[ room_memory.boost_labs[lab.id].type ].done = true;
                })
            }else{
                // 移动到最近的lab
                creep.moveTo(target)
            }
        }

    }else{
        for(let type in opt){
            let amount = opt[type]*30
            if(!room.memory.lab.boost[type]){
                room.memory.lab.boost[type] = 0;
            }
            room.memory.lab.boost[type] += amount;
        }
    }
}

function boost_fill(room){
    let memory = room.memory.lab;
    let boost = room.memory.lab.boost
    let str = ""+room.name+" "
    for(let type in boost){
        str += type + boost[type]+" "
    }
    // console.log(str);
    if(!memory.boost_labs){
        memory.boost_labs = {}
    }
    // 增
    for(let id of memory.labs){
        if(!memory.boost_labs[id]){
            memory.boost_labs[id] = {}
        }
    }
    // 删
    for(let id in memory.boost_labs){
        if(!Game.getObjectById(id)){
            delete memory.boost_labs[id]
        }
    }

    // 加入新lab
    for(let type in boost){
        let ok = false
        for(let id in memory.boost_labs){
            if(memory.boost_labs[id].type == type){
                ok = true;
                break;
            }
        }
        if(!ok){
            for(let i = memory.labs.length-1;i>=0;i--){
                let id = memory.labs[i];
                if(!memory.boost_labs[id].type){
                    memory.boost_labs[id] = {
                        type:type,
                        amount:Math.min(3000,boost[type])
                    }
                    break;
                }
            }
        }
    }
    
    // 删掉没用的
    for(let id in memory.boost_labs){
        let labtype = memory.boost_labs[id].type
        let ok = false
        for(let type in boost){
            if(type == labtype){
                ok = true;
            }
        }
        if(!ok){
            delete memory.boost_labs[id]
        }
    }
    // 更新数据
    for(let id in memory.boost_labs){
        memory.boost_labs[id].amount = boost[memory.boost_labs[id].type]
    }
    // 不够的找creep来填充
    for(let id in memory.boost_labs){
        let lab = Game.getObjectById(id) // 按之前的代码这里确保能够获取到
        let type = memory.boost_labs[id].type
        
        new RoomVisual(room.name).text(type,lab.pos.x,lab.pos.y,{
            font:0.5,color:'#dc0000'
        })
        if(lab.mineralType && type != lab.mineralType
             && lab.store[lab.mineralType] > 0){ // 有杂质
            let creep = runCreep.getCreep(room,"boost")
            if(creep){
                // creep容量为空或者能一次装下，就去装，否则就先倒掉
                if(creep.store.getUsedCapacity() == 0 ||
                 creep.store.getFreeCapacity(lab.mineralType) >= lab.store[lab.mineralType]){
                    if(creep.pos.isNearTo(lab)){
                        creep.withdraw(lab,lab.mineralType)
                    }else{
                        creep.moveTo(lab)
                    }
                }else{
                    let terminal = room.terminal
                    if(creep.pos.isNearTo(terminal)){
                        creep.transfer(terminal,Object.keys(creep.store)[0])
                    }else{
                        creep.moveTo(terminal)
                    }
                }
            }
        }else{
            // lab为空，或者不够
            if(!lab.mineralType || lab.store[lab.mineralType] < memory.boost_labs[id].amount){
                let creep = runCreep.getCreep(room,"boost")
                if(creep){
                    if(creep.store.getUsedCapacity() != creep.store.getUsedCapacity(type)){
                        // creep装了其他杂质
                        let terminal = room.terminal
                        if(creep.pos.isNearTo(terminal)){
                            creep.transfer(terminal,Object.keys(creep.store)[0])
                        }else{
                            creep.moveTo(terminal)
                        }
                    }else if(creep.store.getUsedCapacity() == 0){
                        let target = null
                        if(room.terminal && room.terminal.store[type] > 0){
                            target = room.terminal
                        }
                        if(!target && room.storage && room.storage.store[type] > 0){
                            target = room.storage;
                        }
                        if(creep.pos.isNearTo(target)){
                            creep.withdraw(target,type,
                                Math.min(creep.store.getCapacity(),target.store.getUsedCapacity(type),
                                memory.boost_labs[id].amount - (lab.store[lab.mineralType]|0) ))
                            creep.moveTo(lab)
                        }else{
                            creep.moveTo(target)
                        }
                    }else{
                        if(creep.pos.isNearTo(lab)){
                            creep.transfer(lab,type)
                        }else{
                            creep.moveTo(lab)
                        }
                    }
                }
            }
        }
    }
    // if(memory.labs.length - memory.reaction_nums > cnt){

    // }
}

/**
 * 
 * @param {Room} room 
 */
function initLab(room){
    if(!room.memory.lab){
        room.memory.lab = {}
    }
    let memory = room.memory.lab;
    if(!memory.labs){
        memory.labs = [];
    }
    let labs = room.find(FIND_STRUCTURES,{
        filter:o=>o.structureType == STRUCTURE_LAB
    })
    if(labs.length != memory.labs.length || Game.time % 113 == 89){
        labs.forEach(lab => {
            lab.value = 0;
            labs.forEach(l => {
                if(lab.pos.inRangeTo(l,2)){
                    lab.value ++;
                }
            });
        });
        labs.sort((a,b)=>{
            if(b.value != a.value)
                return b.value - a.value
            return a.id.localeCompare(b.id)
        });
        for(var i = 0;i<labs.length;i++){
            labs[i] = labs[i].id;
        }
        memory.labs = labs
        memory.reaction_nums = labs.length
    }
    if(!memory.reaction_nums){
        memory.reaction_nums = memory.labs.length
    }
}

function solve_product(room){
    let memory = room.memory.lab;
    if(!memory.product){
        let labs = []
        for(let id of memory.labs){
            let lab = Game.getObjectById(id)
            if(!lab){
                initLab(room)
                return
            }
            labs.push(Game.getObjectById(id))
        }
        let allCreeps = baseCreep.getAllCreeps()
        let carryers = []
        if(allCreeps[room.name] && allCreeps[room.name].carryer){
            carryers = allCreeps[room.name].carryer
        }

        let pre_products = []
        for(let a in REACTIONS){
            for(let b in REACTIONS[a]){
                let p = REACTIONS[a][b]
                let p_amount = getAllType(p,room,labs,carryers)
                if(getAllType(a,room,labs,carryers) > getLimitMin(a) && 
                    getAllType(b,room,labs,carryers) > getLimitMin(b) && 
                    p_amount < getLimitMax(p)){
                        pre_products.push({
                            type:p,
                            amount:p_amount
                        })
                    }
            }
        }
        pre_products.sort((a,b)=>{
            if(a.amount != b.amount)
                return a.amount - b.amount
            return a.type.length < b.type.length
        })
        let str = ""
        for(let o of pre_products){
            str += o.type + o.amount + " "
        }
        // console.log(str)
        if(pre_products.length > 0){
            memory.product = pre_products[0].type
            // console.log(memory.product)
            for(let a in REACTIONS){
                for(let b in REACTIONS[a]){
                    if(REACTIONS[a][b] == memory.product){
                        memory.materials = [a,b]
                        break;
                    }
                }
            }
        }
        
    }
}

function do_reaction(room){
    let memory = room.memory.lab;
    
    if(!memory.product || !memory.materials[0] || !memory.materials[1]){
        solve_product(room)
    }
    if(!memory.product || !memory.materials[0] || !memory.materials[1]){
        return;
    }

    let labs = []
    for(let id of memory.labs){
        let lab = Game.getObjectById(id)
        if(!lab){
            initLab(room)
            return
        }
        labs.push(Game.getObjectById(id))
    }
    if(labs.length > 0){
        let pos = labs[0].pos;
        new RoomVisual(room.name).text(memory.product,pos.x,pos.y)
    }
    for(let i = 0 ;i < Math.min(2,labs.length);i++){
        let lab = labs[i]
        if(memory.boost_labs && memory.boost_labs[lab.id] && memory.boost_labs[lab.id].type)continue;// 在boost
        if(lab.mineralType && lab.mineralType != memory.materials[i]){ // 如果原料炉装了杂质
            let creep = runCreep.getCreep(room,"reaction")
            if(creep){
                // creep容量为空或者能一次装下，就去装，否则就先倒掉
                if(creep.store.getUsedCapacity() == 0 ||
                 creep.store.getFreeCapacity(lab.mineralType) >= lab.store[lab.mineralType]){
                    if(creep.pos.isNearTo(lab)){
                        creep.withdraw(lab,lab.mineralType)
                    }else{
                        creep.moveTo(lab)
                    }
                }else{
                    let terminal = room.terminal
                    if(creep.pos.isNearTo(terminal)){
                        creep.transfer(terminal,Object.keys(creep.store)[0])
                    }else{
                        creep.moveTo(terminal)
                    }
                }
            }
            continue;
        }
        if(!lab.mineralType || lab.store[lab.mineralType] == 0){
            memory.product = null;
            solve_product(room)
            let creep = runCreep.getCreep(room,"reaction")
            if(creep){
                let type = memory.materials[i]
                if(creep.store.getUsedCapacity() != creep.store.getUsedCapacity(type)){
                    // creep装了其他杂质
                    let terminal = room.terminal
                    if(creep.pos.isNearTo(terminal)){
                        creep.transfer(terminal,Object.keys(creep.store)[0])
                    }else{
                        creep.moveTo(terminal)
                    }
                }else if(creep.store.getUsedCapacity(type) == 0){
                    // creep为空
                    let withdrawTarget = null
                    if(room.terminal && room.terminal.store[type] > 0){
                        withdrawTarget = room.terminal
                    }
                    if(!withdrawTarget && room.storage && room.storage.store[type] > 0){
                        withdrawTarget = room.storage;
                    }
                    if(!withdrawTarget){//既然storage/terminal都没有，那说明在lab里面
                        continue;
                    }
                    if(creep.pos.isNearTo(withdrawTarget)){
                        creep.withdraw(withdrawTarget,type)
                        creep.moveTo(lab)
                    }else{
                        creep.moveTo(withdrawTarget)
                    }
                }else{
                    if(creep.pos.isNearTo(lab)){
                        creep.transfer(lab,type)
                    }else{
                        creep.moveTo(lab)
                    }
                }
            }
        }
    }

    for(let i = 2;i<labs.length;i++){
        let lab = labs[i]
        if(memory.boost_labs && memory.boost_labs[lab.id] && memory.boost_labs[lab.id].type)continue;// 在boost
        if(lab.mineralType && lab.mineralType != memory.product){ // 如果产物炉装了杂质
            let creep = runCreep.getCreep(room,"reaction_clean")
            if(creep){
                // creep容量为空或者能一次装下，就去装，否则就先倒掉
                if(creep.store.getUsedCapacity() == 0 ||
                 creep.store.getFreeCapacity(lab.mineralType) >= lab.store[lab.mineralType]){
                    if(creep.pos.isNearTo(lab)){
                        creep.withdraw(lab,lab.mineralType)
                    }else{
                        creep.moveTo(lab)
                    }
                }else{
                    let terminal = room.terminal
                    if(creep.pos.isNearTo(terminal)){
                        creep.transfer(terminal,Object.keys(creep.store)[0])
                        creep.moveTo(lab)
                    }else{
                        creep.moveTo(terminal)
                    }
                }
            }
        }else{
            if(!lab.cooldown){
                lab.runReaction(labs[0],labs[1])
            }
        }
    }
}

function getLimitMin(type){
    return 800
}

function getLimitMax(type){
    const FIGHT = ["XUH2O","XKHO2","XLHO2","XZH2O","XZHO2","XGHO2"]
    if(FIGHT.indexOf(type) != -1){
        return 20000
    }
    return 1500
}

function getAllType(type,room,labs,creeps){
    // 从两个地方获取，一个是建筑，一个是creep
    // if(UNLIMITED_RESOURCES.indexOf(type) != -1) return 1000000;
    let amount = 0;
    if(room.storage)
        amount += room.storage.store[type];
    if(room.terminal)
        amount += room.terminal.store[type];
    labs.forEach(lab => {
        amount += lab.store[type];
    });
    creeps.forEach(creep=>{
        amount += creep.store[type]
    })
    return amount;
}

