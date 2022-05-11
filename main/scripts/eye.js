/**
 * 【功能】侦查房间，控制斥候移动和observe，记录房间相关信息
 * 
 * 【结构】
 * 在Memory.eye.rooms = {}中存储各房的信息
 * 键值为房间名称，spytick,obtick表示上次观察该房间的tick
 * eyetick为二者的最小值
 */
var spawnCtrl = require("spawnCtrl")
var autoOutMiner = require("autoOutMiner")
module.exports = {
    init,
    spawnSpy,
    runCreep,
    isfree,
    watchRoom,
}


function init(){
    if(!Memory.eye)Memory.eye = {}
    if(!Memory.eye.rooms)Memory.eye.rooms = {}
}

function spawnSpy(){
    Game.myrooms.forEach(room => {
        if(Game.time % 1019 == 0 && room.controller.level >= 3){
            spawnCtrl.addSpawnList(room.name,[MOVE],"斥候_"+room.name+'_'+Game.time%1511)
        }
    });
}

/** @param {Creep} creep */
function runCreep(creep){
    // watchRoom(creep.room)
    // return;
    if(creep.ticksToLive >= 1498){
        creep.notifyWhenAttacked(false);
    }
    let targetRoom = creep.memory.targetRoom
    if(creep.room.name == targetRoom){
        targetRoom = null
    }
    creep.say(targetRoom)
    // 已到达或者目标不存在
    if(!targetRoom){
        if(!Memory.eye.rooms[creep.room.name])Memory.eye.rooms[creep.room.name] = {}
        Memory.eye.rooms[creep.room.name].spytick = Game.time
        watchRoom(creep.room)

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
    }
    
    creep.moveTo(new RoomPosition(25,25,targetRoom),{
        reusePath:20,
        visualizePathStyle:{
            fill: 'transparent',
            stroke: '#fff',
            lineStyle: 'dashed',
            strokeWidth: .15,
            opacity: .1
        }
    })
    creep.memory.targetRoom = targetRoom
}


/**
 * 
 * @param {Room} room 
 */
function watchRoom(room){
    if(!room)return
    // console.log('watch',room.name)

    let memory = Memory.eye.rooms[room.name]
    if(!memory){memory = {}}

    autoOutMiner.watchReverse(room) // 外矿

    // 记录房间占有情况
    // 如果是别人的房间
    if(room.controller){
        memory.controller = {}
        if(room.controller.owner){
            memory.controller.ownerusername = room.controller.owner.username
            memory.controller.level = room.controller.level
        }
    }
}

/**
 * 获取房间是否能够通行
 * @param {*} roomName 
 */
function isfree(roomName){
    let memory = Memory.eye.rooms[roomName]
    if(!memory)return false // 未探索的房间
    if(!memory.controller || !memory.controller.ownerusername)return true; //没有控制器的房间
    if(memory.controller.ownerusername != Game.username){
        return false // 别人的房间
    }
    if(memory.controller.ownerusername == Game.username){
        return true // 我的房间
    }
    console.log('is free error')
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