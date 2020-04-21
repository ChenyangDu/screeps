/*
 * @Author: your name
 * @Date: 2020-02-05 16:16:08
 * @LastEditTime: 2020-04-04 15:01:24
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \default\towerEstimate.js
 */
/*

author：ChenyangDu
功能：绘制塔的伤害，以百为单位，需要配合observe，注意避免和observe代码冲突
提示：特别费CPU，随用随停，建议就运行1tick，然后截屏下来研究

使用示例
var towerEstimate = require('towerEstimate')
towerEstimate.run('W1N2','W3N7')
*/

module.exports = {
    run:function(mainRoomName,observeRoomName){
        const mainRoom = Game.rooms[mainRoomName]
        const observeRoom = Game.rooms[observeRoomName]
        if(!mainRoom){
            console.log('No room')
            return;
        }
        const observer = mainRoom.find(FIND_STRUCTURES,{filter:(o)=>(o.structureType==STRUCTURE_OBSERVER)})
        if(!observer.length){
            console.log('No observe')
            return;
        }
        console.log(observer[0].observeRoom(observeRoomName))
        if(!observeRoom){
            console.log('wait')
            return;
        }
        console.log(Game.shard.name,'est')
        var towers = observeRoom.find(FIND_STRUCTURES,{filter:(o)=>(o.structureType == STRUCTURE_TOWER)})
        for(var x = 0;x<50;x++)
        for(var y = 0;y<50;y++){
            var attack = 0;
            var pos = new RoomPosition(x,y,observeRoomName)
            towers.forEach(tower => {
                let range = pos.getRangeTo(tower)
                if(range <= 5)attack += 600;
                else if (range >= 20)attack += 150;
                else attack += 750-30*range;
            });
            var color = "#00ff00"
            if(attack >= 1575)color = "#88ff00"
            if(attack >= 2250)color = "#ffff00"
            if(attack >= 2925)color = "#ff8800"
            if(attack >= 3600)color = "#ff0000"
            new RoomVisual(pos.roomName).text(attack/100,x,y,{font:0.4,color:color})
        }
    }
}