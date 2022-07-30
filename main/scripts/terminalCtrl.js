/**
 * 市场当中的物品分为通用类型和特供类型
 * 通用类型是所有房间都需要的，比如能量、power、各类化合物
 * 特供类型是工厂里面的各类商品
 * 
 * 写一个函数判断该种产品是否需要购买或者是否需要售出就完事了
 * 
 */
let historyPrice = {}
module.exports = {
    run(){
        if(Game.time % 1500 == 0)historyPrice = {}
        if(Game.time % 10 == 1){
            let terminals = []
            Game.myrooms.forEach(room => {
                if(room.terminal){
                    terminals.push(room.terminal)
                }
            });
            terminals.forEach(terminal=>{
                solve(terminal)
            })
            balance(terminals)
        }
        
    }
}


/**
 * 
 * @param {StructureTerminal[]} terminals 
 */
function balance(terminals){
    let balanceType = []
    for(let terminal of terminals){
        for(let type in terminal.store){
            if(balanceType.indexOf(type) == -1 && 
                getRoomUsedCapacity(type,terminal.room) >= 2*getBalanceLimit(type)){
                balanceType.push(type)
            }
        }
    }
    for(let terminal of terminals){
        for(let type of balanceType){
            let have = getRoomUsedCapacity(type,terminal.room)
            let limit = getBalanceLimit(type)
            if(have < limit){
                let max_terminal,max_c = 0
                for(let _terminal of terminals){
                    if(getRoomUsedCapacity(type,_terminal.room) > max_c){
                        max_c = getRoomUsedCapacity(type,_terminal.room)
                        max_terminal = _terminal
                    }
                }

                if(max_terminal){
                    max_terminal.send(type,Math.min(max_terminal.store[type],limit),terminal.room.name)
                }
            }
        }
    }
}
/**
 * 
 * @param {StructureTerminal} terminal 
 */
function solve(terminal){
    let room = terminal.room
    for(let type in terminal.store){
        let amount = getSellorBuy(type,room)
        if(amount < 0){
            let orders = Game.market.getAllOrders({type: ORDER_BUY, resourceType: type});
            // console.log(type,amount,orders.length)
            if(orders.length){
                orders = orders.sort((a,b)=>(-getRealPrice(a,room.name,'buy') + getRealPrice(b,room.name,'buy')))
                let order = orders[0]
                // console.log(order.id,order.roomName,order.price,getRealPrice(order,room.name,'buy'))
                let avg,std
                [avg,std] = getPrice(type)
                if(getRealPrice(order,room.name,'buy') > 0 && order.price > 0.8*(Math.max(0,avg))){
                    // console.log(order.id,order.roomName,order.price,getRealPrice(order,room.name,'buy'))
                    Game.market.deal(order.id,Math.min(room.terminal.store[type], -amount),room.name)
                }else{
                    // console.log('cheep',type,getRealPrice(order,room.name,'buy') ,order.roomName,order.price, avg , std)
                }
            }
        }
    }
    for(let type of baseLabType.concat(['energy'])){
        
        let amount = getSellorBuy(type,room)
        if(amount > 0){
            let orders = Game.market.getAllOrders({type: ORDER_SELL, resourceType: type});
            if(orders.length){
                orders = orders.sort((a,b)=>(getRealPrice(a,room.name,'sell') - getRealPrice(b,room.name,'sell')))
                let order = orders[0]
                let avg,std
                [avg,std] = getPrice(type)
                
                if(order.price < 1.1*(Math.max(0,avg + std))){
                    // console.log(order.id,order.roomName,order.price,getRealPrice(order,room.name,'buy'))
                    Game.market.deal(order.id,amount,room.name)       
                }else{
                    // console.log('exp',type, getRealPrice(order,room.name,'buy') ,order.price, avg , std)
                }
            }
        } 
    }
}

/**
 * 计算考虑路费之后的价格
 */
function getRealPrice(order,roomName,order_type = 'sell'){
    if(order.resourceType == 'energy'){
        if(order_type == 'sell'){
            return order.price*1000/(1000-Game.market.calcTransactionCost(1000,roomName,order.roomName))
        }
        return order.price*1000/(1000+Game.market.calcTransactionCost(1000,roomName,order.roomName))
    }else{
        if(order_type == 'sell'){
            return (order.price*1000 + getPrice('energy')[0]*Game.market.calcTransactionCost(1000,roomName,order.roomName))/1000
        }else{
            return (order.price*1000 - getPrice('energy')[0]*Game.market.calcTransactionCost(1000,roomName,order.roomName))/1000
        }
    }
        
}

function getPrice(type){
    if(historyPrice[type]){
        return historyPrice[type]
    }
    let records = Game.market.getHistory(type)
    if(records.length > 0){
        
        return historyPrice[type] = [_.last(records).avgPrice,_.last(records).stddevPrice]
    }
    return null
}

const baseLabType = ['O','H','Z','K','U','L','X']
function getSellorBuy(type,room){
    if(type == 'energy'){
        if(getRoomFreeCapacity(null,room) <= 50*1000)
            return -10000 //卖能量
        else if(getRoomUsedCapacity('energy',room) <= 25000 && Game.market.credits >= 40*1000*1000){
            console.log(Game.market.credits);
            return 5000 // 买能量
        }
    }
    if(baseLabType.indexOf(type) != -1 ){
        let amount = getRoomUsedCapacity(type,room)
        if(amount >= 50*1000 ){
            return 50*1000 - amount
        }else if(amount <= 1000){
            return 1000 - amount
        }
    }
    return 0
}

function getBalanceLimit(type){
    if(type == 'energy')return 30000
    else if(baseLabType.indexOf(type) != -1)return 3000
    else return 500
}

/**
 * 
 * @param {String} type 
 * @param {Room} room 
 */
function getRoomUsedCapacity(type,room){
    let amount = 0
    if(room.terminal)amount += room.terminal.store.getUsedCapacity(type)
    if(room.storage)amount += room.storage.store.getUsedCapacity(type)
    return amount
}
function getRoomFreeCapacity(type,room){
    let amount = 0
    if(room.terminal)amount += room.terminal.store.getFreeCapacity(type)
    if(room.storage)amount += room.storage.store.getFreeCapacity(type)
    return amount
}