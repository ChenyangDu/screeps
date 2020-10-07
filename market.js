
const myOrders = [/*
    {
        type:'O',
        my_price:1,
        roomName:'W1N2',
        save:9*1000,
    }{
        type:'microchip',
        my_price:8000,
        roomName:'W38N26',
        save:00,
    },
    {
        type:'circuit',
        my_price:15000,
        roomName:'W38N26',
        save:0,
    },
    {
        type:'crystal',
        my_price:5,
        roomName:'W47N21',
        save:1000,
    },
    {
        type:'composite',
        my_price:2.5,
        roomName:'W38N24',
        save:1000,
    },
    {
        type:'composite',
        my_price:2.5,
        roomName:'W38N24',
        save:1000,
    },/*
    {
        type:'fixtures',
        my_price:1500,
        roomName:'W47N21',
        save:50,
    },
    {
        type:'frame',
        my_price:6000,
        roomName:'W38N26',
        save:0,
    },*/
]

const needOrders = [
    {
        type:'U',
        price:0.045,
        save:10000,
    },{
        type:'Z',
        price:0.045,
        save:10000,
    },{
        type:'K',
        price:0.05,
        save:10000,
    },{
        type:'L',
        price:0.07,
        save:10000,
    },{
        type:'O',
        price:0.1,
        save:10000,
    },{
        type:'H',
        price:0.1,
        save:10000,
    },{
        type:'X',
        price:0.15,
        save:10000,
    },{
        type:'G',
        price:0.16,
        save:0,
    },
    {
        type:'ops',
        price:2,
        save:3000
    },/*{
        type:'silicon',
        price:4,
        save:0
    },{
        type:'mist',
        price:4,
        save:00
    },{
        type:'biomass',
        price:4,
        save:00
    },{
        type:'metal',
        price:4,
        save:00
    },
    {
        type:'energy',
        price:0.02,
        save:0
    },{
        type:'XZHO2',
        price:3,
        save:10000
    },{
        type:'XZH2O',
        price:3,
        save:10000
    },{
        type:'XGHO2',
        price:3,
        save:10000
    },{
        type:'XUH2O',
        price:3,
        save:10000
    },{
        type:'XLHO2',
        price:3,
        save:10000
    },{
        type:'XKHO2',
        price:3,
        save:10000
    },{
        type:'power',
        price:5,
        save:0
    },*/
]
module.exports = {
    run:function(){
        
        for(var myOrder of myOrders){
            var room = Game.rooms[myOrder.roomName]
            var type = myOrder.type,my_price = myOrder.my_price;
            if(room.terminal.store[type] > myOrder.save){//console.log(type)
                var orders = Game.market.getAllOrders(order => order.type == ORDER_BUY &&
                    order.amount > 0 &&
                    (order.resourceType == type));
                if(orders && orders.length){
                    orders.sort((a,b)=>(b.price - a.price))
                    var order = orders[0]
                    if(order.price >= my_price){
                        var amount = Math.min(room.terminal.store[type] - myOrder.save,order.amount);
                        console.log('报！',type,'价格价格已谈妥，',order.price,'一个,共计',
                        amount,'个，收入',amount * order.price);
                        console.log(Game.market.deal(order.id,amount,room.name))
                    }
                }
            }
        }

        var dealRoomName = 'W43N27'
        if(Game.rooms[dealRoomName].terminal.store.getFreeCapacity() < 20000)return;
        for(var needOrder of needOrders){
            const type = needOrder.type;
            //console.log(type, amountOf(type) , needOrder.save,amountOf(type) < needOrder.save)
            if(amountOf(type) < needOrder.save){
                var orders = Game.market.getAllOrders(order => order.type == ORDER_SELL &&
                    order.amount > 0 &&
                    (order.resourceType == type));
                //console.log(order.length)
                if(orders.length){
                    orders.sort((a,b)=>(a.price - b.price))
                    var order = orders[0]
                    if(order.price < needOrder.price){
                        //console.log(order.id,100,dealRoomName)
                        Game.market.deal(order.id,1000,dealRoomName)
                    }
                }
            }
        }

        

    },
    energyBuy:function(){
        const rooms = _.filter(Game.rooms, (x) => x.controller && x.controller.my && x.terminal)
        rooms.forEach(room => {
            if(room.storage && room.storage.store.energy < 200000 && room.terminal.store.energy < 100000){
                var orders = Game.market.getAllOrders(order => order.type == ORDER_SELL &&
                    order.amount > 0 &&
                    (order.resourceType == 'energy'));
                if(orders.length){
                    orders.sort((a,b)=>(a.price*1000/(1000-Game.market.calcTransactionCost(1000,room.name,a.roomName)) -
                    b.price*1000/(1000-Game.market.calcTransactionCost(1000,room.name,b.roomName))))
                    var order = orders[0]
                    for(let i=0;i<orders.length;i++){
                        //console.log(orders[i].price)
                    }
                    //console.log(order.id,order.price)
                    let maxprice = 0.1;
                    //if(Game.shard.name == 'shard3')maxprice = 1;
                    //console.log('cheapest',order.price,order.price*1000/(1000-Game.market.calcTransactionCost(1000,room.name,order.roomName)))
                    if(order.price*1000/(1000-Game.market.calcTransactionCost(1000,room.name,order.roomName)) < maxprice){
                        //console.log(order.id,order.price)
                        Game.market.deal(order.id,10000,room.name)
                    }
                }
            }
        });
    },
    getPrice:function(askType){
        for(var order of needOrders){
            if(order.type == askType){
                return order.price
            }
        }
        return 0;
    }
}


function amountOf(type){
    const rooms = _.filter(Game.rooms, (x) => x.controller && x.controller.my && x.terminal&&Memory.factory[x.name])
    var amount = 0;
    rooms.forEach(room => {
        room = Game.rooms[room.name]
        amount += room.terminal.store[type]
        if(room.storage){
            amount += room.storage.store[type]
        }
        if(Memory.factory[room.name].factoryId){
            amount += Game.getObjectById(Memory.factory[room.name].factoryId).store[type]
        }
    });
    //console.log(type,amount)
    return amount
}
