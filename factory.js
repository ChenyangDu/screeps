
function materialLimited(type){
    var min_amount = 600; 
    if(COMMODITIES[type]){
        if(COMMODITIES[type].level == 1)min_amount = 50;
        if(COMMODITIES[type].level == 2)min_amount = 10;
        if(COMMODITIES[type].level == 3)min_amount = 5;
        if(COMMODITIES[type].level == 4)min_amount = 2;
    }
    if(['composite','crystal','liquid'].indexOf(type) != -1)min_amount = 150;
    if(['wire','condensate','alloy','cell'].indexOf(type) != -1)min_amount = 120;
    if(type == 'energy')min_amount = 1000
    return min_amount;
}

function productLimited(type){
    //这部分是设置每种产品的数量上限，超过上限将不再生产
    //默认压缩产品5000，区域性产品2000，各等级商品分别为1000，500，100，100
    var maxAmount = 5000;
    
    if(['wire','condensate','alloy','cell'].indexOf(type) != -1)maxAmount = 2000;
    if(COMMODITIES[type]){
        if(COMMODITIES[type].level == 1)maxAmount = 1000;
        if(COMMODITIES[type].level == 2)maxAmount = 500;
        if(COMMODITIES[type].level == 3)maxAmount = 100;
        if(COMMODITIES[type].level == 4)maxAmount = 100;
    }
    //压缩电池和解压没有上限，但不建议用这个代码来实现
    if(type == 'liquid'){
        return 15000
    }
    if(type == 'transistor'){
        return 550
    }
    return maxAmount
}

module.exports = {
    run:function(){
        var output = {
            
            W39N26:['utrium_bar','oxidant','reductant','keanium_bar','zynthium_bar','lemergium_bar','purifier','ghodium_melt'],
            W43N27:['wire','condensate','alloy','cell'],

            W38N24:['switch','concentrate','tube','phlegm','composite'],//1
            W47N21:['transistor','extract','fixtures','tissue','crystal',],//2
            W38N26:['microchip','spirit','frame','liquid','muscle']//3
        } 

        if(amountOf('tube') >= 1500){
            let indexOf = output.W38N24.indexOf('tube')
            if(indexOf != -1){
                output.W38N24.splice(indexOf,1)
            }
        }
        if(amountOf('fixtures') >= 300){
            let indexOf = output.W47N21.indexOf('fixtures')
            if(indexOf != -1){
                output.W47N21.splice(indexOf,1)
            }
        }
        if(amountOf('transistor')>=500){
            output.W38N26.push('microchip')
        }
        if(Game.rooms.W39N26.storage && Game.rooms.W39N26.storage.store.energy > 600000){
            output.W39N26.push('battery')
        }
        
        for(var roomName in output){
            var out = null;
            if(!Memory.factory){
                Memory.factory = {}
            }
            if(!Memory.factory[roomName]){
                Memory.factory[roomName] = {}
            }
            try{out = Memory.factory[roomName].out}catch(err){}
            if(out){
                for(var type of out){
                    
                    if(type == 'battery' ||type == 'energy' || amountOf(type) <= productLimited(type)){
                        if(factoryRun(roomName,type) == true){
                            break;
                        }
                    }
                }
            }
        }
        
        if(Game.time % 17 == 0){
            for(roomName in output){
                Memory.factory[roomName].out = output[roomName]
                output[roomName].sort((a,b)=>(amountOf(a)-amountOf(b)))
                var input = []
                for(var outType of output[roomName]){
                    for(var inType in COMMODITIES[outType].components){
                        if(output[roomName].indexOf(inType) === -1 && input.indexOf(inType) === -1)
                            input.push(inType)
                    }
                }
                Memory.factory[roomName].in = input
            }
        }
        //isReady('transistor')
    }
}

function factoryRun(roomName,product){
    const room = Game.rooms[roomName]
    if(!Memory.factory[roomName])Memory.factory[roomName] = {};
    const factory = Game.getObjectById(Memory.factory[roomName].factoryId);
    if(factory){
        if(factory.cooldown == 0){
            if(factory.produce(product) == OK){
                return true;
            }
        }
    }else{
        var factoryId = room.find(FIND_STRUCTURES,{filter:o=>(o.structureType == STRUCTURE_FACTORY)});
        if(factoryId.length)factoryId = factoryId[0];
        else factoryId = null;
        if(factoryId){
            Memory.factory[roomName].factoryId = factoryId.id;
        }
    }
    return false;
}
function amountOf(type){
    const rooms = _.filter(Game.rooms, (x) => x.controller && x.controller.my && x.terminal &&Memory.factory[x.name])

    var amount = 0;
    rooms.forEach(room => {
        amount += room.terminal.store[type]
        if(room.storage){
            amount += room.storage.store[type]
        }

        if(Memory.factory[room.name].factoryId && Game.getObjectById(Memory.factory[room.name].factoryId)){
            amount += Game.getObjectById(Memory.factory[room.name].factoryId).store[type]
        }
    });
    //console.log(type,amount)
    return amount
}

function isReady(type){
    var amount = 1000000;
    var sons = COMMODITIES[type].components
    for(var subType in sons){
        console.log(subType,amountOf(subType),sons[subType],Math.floor(amountOf(subType)/sons[subType]))
        amount = Math.min(amount,Math.floor(amountOf(subType)/sons[subType]))
    }
    console.log(amount,Math.ceil(1000/COMMODITIES[type].cooldown))
    return amount >= Math.ceil(1000/COMMODITIES[type].cooldown)
}