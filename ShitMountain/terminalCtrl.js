/*
 * @Author: your name
 * @Date: 2020-02-01 00:50:04
 * @LastEditTime: 2020-04-08 08:42:27
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \default\terminalCtrl.js
 */

function energyStore(room){
    var amount = 0;
    if(room.storage)amount += room.storage.store[RESOURCE_ENERGY]
    if(room.terminal){
        
            amount += room.terminal.store[RESOURCE_ENERGY]
    }
    return amount;
}
var rooms
module.exports = {
    run:function(){
        rooms = _.filter(Game.rooms, (x) => x.controller && x.controller.my && x.terminal)
        
        // balence
        var types = ['H','O','Z','K','L','U','X','power','energy','ops','G'];
        var factoryTypes = [];
        
        rooms.forEach(room => {
            
            types.forEach(type => {
                
                var amount = 500
                if(type == 'energy')amount = 10000
                if(type == 'ops')amount = 100
                if(room.terminal &&  room.terminal.store[type] < amount){
                    var richrooms = rooms.filter((r)=>r.terminal && r.terminal.store[type] >= 2*amount)
                    
                    if(richrooms.length > 0){
                        richrooms[0].terminal.send(type,amount,room.name)
                    }
                }
            });
            var need = null
            try{need = Memory.factory[room.name].in}catch(e){}
            if(need){
                factoryTypes = factoryTypes.concat(need)
            }
            
        });
        // factory
        //if(Game.time % 20 !=0)return;
        /*
        factoryTypes = Array.from(new Set(factoryTypes))
        factoryTypes.forEach(type => {
            if(type != 'energy'){
                
                var min_amount = 600;
                if(['wire','condensate','alloy','cell'].indexOf(type) != -1)min_amount = 120;
                if(COMMODITIES[type]){
                    if(COMMODITIES[type].level == 1)min_amount = 50;
                    if(COMMODITIES[type].level > 1)min_amount = 10
                }

                var richroom = rooms[0];
                var poorroom = null
                for (var room of rooms){
                    need = null
                    try{need = Memory.factory[room.name].in}catch(e){}
                    
                    if(need && need.indexOf(type) != -1 && room.terminal.store[type] < min_amount){
                        if(!poorroom || poorroom.terminal.store[type] >= room.terminal.store[type]){
                            poorroom = room
                        }
                    }
                    
                }
                if(poorroom)
                    for(var room of rooms){
                        if(richroom.name == poorroom.name)richroom = null;
                        if(!richroom)richroom = room;
                        else{
                            if(room.name != poorroom.name && richroom.terminal.cooldown == 0 && room.terminal.store[type] > richroom.terminal.store[type]){
                                richroom = room
                            }
                        }
                    }
                //if(type == 'wire')console.log(richroom,poorroom,Math.min(1000,richroom.terminal.store[type]))
                if(poorroom && richroom.name != poorroom.name){
                    if(richroom.terminal.send(type,Math.min(min_amount,richroom.terminal.store[type]),poorroom.name) == OK){
                        //console.log(richroom,poorroom,Math.min(500,richroom.terminal.store[type]),type)
                    }
                    
                }
            }
        })*/
    },
    need:function(roomName,type,amount){
        rooms = _.filter(Game.rooms, (x) => x.controller && x.controller.my && x.terminal)
        var richrooms = rooms.filter((r)=>r.terminal && r.terminal.store[type] >= 2*amount && r.name != roomName)
        if(richrooms.length > 0){
            console.log('need ',richrooms[0],roomName,type,amount)
            richrooms[0].terminal.send(type,amount,roomName)
        }
    }
};