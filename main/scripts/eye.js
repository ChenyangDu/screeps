/**
 * 【功能】侦查房间，控制斥候移动和observe
 * 
 * 【结构】
 * 在Memory.eye.rooms = {}中存储各房的信息
 * 键值为房间名称，spytick,obtick表示上次观察该房间的tick
 * eyetick为二者的最小值
 */

module.exports = {
    init,
    runCreep,
}

function init(){
    if(!Memory.eye)Memory.eye = {}
    if(!Memory.eye.rooms)Memory.eye.rooms = {}
}

/** @param {Creep} creep */
function runCreep(creep){
    creep.say("spy")
    let targetRoom = creep.memory.targetRoom
    if(creep.room.name == targetRoom){
        targetRoom = null
    }
    // 已到达或者目标不存在
    if(!targetRoom){
        if(!Memory.eye.rooms[creep.room.name])Memory.eye.rooms[creep.room.name] = {}
        Memory.eye.rooms[creep.room.name].spytick = Game.time
        watchRoom(creep.room)
    }
    const dir = [[0,1],[0,-1],[1,0],[-1,0]]
    const EXITS = [FIND_EXIT_BOTTOM,FIND_EXIT_TOP,FIND_EXIT_RIGHT,FIND_EXIT_LEFT]
    let x,y;
    [x,y] = roomNameToNum(creep.room.name)
    
    let min_ticks = Game.time
    for(let k = 0;k<4;k++){
        let nx = x + dir[k][0]
        let ny = y + dir[k][1]
        if(creep.room.find(EXITS[k]).length > 0){//相通
            let nextRoomName = numToRoomName({x:nx,y:ny})
            if(!Memory.eye.rooms[nextRoomName])Memory.eye.rooms[nextRoomName] = {}
            let ticks = Memory.eye.rooms[nextRoomName].spytick
            if(!ticks)ticks = 0
            if(ticks < min_ticks){
                min_ticks = ticks
                targetRoom = nextRoomName
            }
        }
    }
    creep.moveTo(new RoomPosition(25,25,targetRoom))
    creep.memory.targetRoom = targetRoom
}

function watchRoom(room){
    console.log('watch',room)
}

function isborder(pos){
    return pos.x <= 1 || pos.x >= 48 || pos.y <= 1 || pos.y >= 48
}

//房间名称和坐标互相转化，其中设E0S0为(0,0),ES区域的坐标为正
function roomNameToNum(roomName){
    let parsed = /^[WE]([0-9]+)[NS]([0-9]+)$/.exec(roomName);
    let x,y;
    x = parseInt(parsed[1]),y = parseInt(parsed[2]);
    if(roomName.indexOf('W') != -1){
        x = -x-1;
    }
    if(roomName.indexOf('N') != -1){
        y = -y-1;
    }
    return [x,y];
}
function numToRoomName(pos){
    let x = pos.x,y =  pos.y;
    let roomName = "";
    if(x >= 0){
        roomName += 'E';
    }else {
        roomName +='W';
        x = -x-1;
    }
    roomName += x;
    if(y >= 0){
        roomName += 'S'
    }else{
        roomName += 'N'
        y = -y-1;
    }
    roomName += y;
    return roomName
}