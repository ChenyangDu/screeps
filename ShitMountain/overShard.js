/*
 * @Author: your name
 * @Date: 2020-04-12 01:24:14
 * @LastEditTime: 2020-04-12 03:03:42
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \default\overShard.js
 */
module.exports = {
    run:function(creep,paths){
        paths = _.filter(paths,(o)=>(o.shard == Game.shard.name))
        let ret = _.min(paths,(o)=>(Game.map.getRoomLinearDistance(creep.pos.roomName,o.roomName)))
        if(ret)return new RoomPosition(ret.x,ret.y,ret.roomName)
        else return null;
    }
}
