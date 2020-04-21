module.exports = {
    addSpawnList(roomName,body,name,opt){
        let room = Game.rooms[roomName]
        if(room){
            if(!room.memory.spawnList)room.memory.spawnList = [];
            room.memory.spawnList.push({body:body,name:name,opt:opt})
        }
    }
}