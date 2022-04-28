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
creep.memory.boost.material = [
    {
        type:'KH',amount:8,labid:xxx,
    },
    {
        type:'ZO',amount:2,labid:xxx,
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
            let creepName = carryCtrl.borrowCreep(room)
            console.log("borrow",creepName);
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
                    if(creep.store.getUsedCapacity() == 0){
                        carryCtrl.returnCreep(room,creeps[role].name)
                        console.log("return",creeps[role].name);
                        creeps[role].name = null;
                    }else{
                        let terminal = room.terminal
                        if(creep.pos.isNearTo(terminal)){
                            console.log("near",Object.keys(creep.store),Object.keys(creep.store)[0])
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
    init:runCreep.init,
    end:runCreep.end,
    reaction,
    boost,
}

function reaction(room){
    initLab(room); // 初始化
    // solve_product(room) // 计算应该生产哪种化合物
    do_reaction(room)// 进行反应
}

function boost(creep,opt){

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
            return a.id - b.id
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
    console.log('solve,product',room.memory.lab.product)
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
        if(allCreeps[room.name] && allCreeps[room.name].carryers){
            carryers = allCreeps[room.name].carryers
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
        pre_products.sort((a,b)=>(a.amount - b.amount))
        let str = ""
        for(let o of pre_products){
            str += o.type + o.amount + " "
        }
        console.log(str)
        if(pre_products.length > 0){
            memory.product = pre_products[0].type
            console.log(memory.product)
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

    for(let i = 0 ;i < Math.min(2,memory.reaction_nums);i++){
        let lab = labs[i]
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
                        creep.transfer(Object.keys(creep.store)[0])
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
                if(creep.store.getUsedCapacity(type) == 0){
                    let target = null
                    if(room.terminal && room.terminal.store[type] > 0){
                        target = room.terminal
                    }
                    if(!target && room.storage && room.storage.store[type] > 0){
                        target = room.storage;
                    }
                    if(creep.pos.isNearTo(target)){
                        creep.withdraw(target,type)
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

    for(let i = 2;i<memory.reaction_nums;i++){
        let lab = labs[i]
        if(lab.mineralType && lab.mineralType != memory.product){ // 如果产物炉装了杂质
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
                        creep.transfer(Object.keys(creep.store)[0])
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
    return 1500
}

function getLimitMax(type){
    const FIGHT = ["XUH2O","XKHO2","XLHO2","XZH2O","XZHO2","XGHO2"]
    if(FIGHT.indexOf(type) != -1){
        return 20000
    }
    return 3000
}

function getAllType(type,room,labs,creeps){
    // 从两个地方获取，一个是建筑，一个是creep
    if(UNLIMITED_RESOURCES.indexOf(type) != -1) return 1000000;
    let amount = 0;
    amount += room.storage.store[type];
    amount += room.terminal.store[type];
    labs.forEach(lab => {
        amount += lab.store[type];
    });
    creeps.forEach(creep=>{
        amount += creep.store[type]
    })
    return amount;
}

