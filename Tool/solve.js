var portals = {}
var edges = {}
var START_ROOM 
var END_ROOM 
var tot_mid = 0;
var mid = {};
var ret;
var cutStart = false;
var cutEnd = false;
const overShardCost = 15;
module.exports = function(START,END){
    //所有虫洞数据
    let shard0Data
    let shard1Data
    let shard2Data
    let shard3Data
    try{
       shard0Data = require('./data0.json');
      shard1Data = require('./data1.json');
       shard2Data = require('./data2.json');
       shard3Data = require('./data3.json');
    }catch (e) {
        console.log("require加载json失败 进行readfile加载")
        shard0Data = require('./readJson')('./data0.json');
        shard1Data = require('./readJson')('./data1.json');
        shard2Data = require('./readJson')('./data2.json');
        shard3Data = require('./readJson')('./data3.json');

    }

    
    //处理所有虫洞
    let portals = [
        buildPortals(shard0Data),
        buildPortals(shard1Data),
        buildPortals(shard2Data),
        buildPortals(shard3Data)
    ];

    //建立跨shard的边
    portals.forEach((portal, index) => index != 0 && buildIntershardEdges(portal, `shard${index}`, portals[index - 1], `shard${index - 1}`));

    if(isCorner(START)) {
        for(let name in edges){
            if(name.indexOf(START) != -1){
                START_ROOM = name;
                // console.log(START)
            }
        }    
    } else {
        let shard = getShard(START);
        let room = getRoomName(START);
        let name = `${shard}_${room}_25_25`;
        if(!portals[shard[shard.length - 1]][room]) portals[shard[shard.length - 1]][room] = [];
        portals[shard[shard.length - 1]][room].push({room, x: 25, y: 25, destination: {room}})
        START_ROOM = name;
        cutStart = true;
    }

    if(isCorner(END)) {
        for(let name in edges){
            if(name.indexOf(END) != -1){
                END_ROOM = name;
            }
        }
    } else {
        let shard = getShard(END);
        let room = getRoomName(END);
        let name = `${shard}_${room}_25_25`;
        if(!portals[shard[shard.length - 1]][room]) portals[shard[shard.length - 1]][room] = [];
        portals[shard[shard.length - 1]][room].push({room, x: 25, y: 25, destination: {room}})
        END_ROOM = name;
        cutEnd = true;
    }

    //建立shard内的边
    portals.forEach((portal, index) => buildInnerShardEdges(portal, `shard${index}`));
    // END_ROOM = END;
    Dijkstra();
    getResult();
    
    console.log('From ',START,'to',END)
    return ret;
}


function buildPortals(data) {
    const portals = {};

    data.forEach(portal => {
        let roomName = portal.room;
        if(!portals[roomName]) portals[roomName] = [];
        portals[roomName].push(portal);
    });

    //每个房间的shard内虫洞只保留边界处的洞,并且过滤掉中心房的虫洞
    for(let roomName in portals){
        let parsed = /^[WE]([0-9]+)[NS]([0-9]+)$/.exec(roomName);
        let x = parseInt(parsed[1]),y = parseInt(parsed[2])
        if(x % 10 == 5 && y % 10 == 5)continue;//过滤掉中心房的虫洞

        let is_NS;
        let is_cross = false;
        if(x % 10 == 0 && y % 10 == 0){//如果不是十字路口，判断他的虫洞属于南北走向的还是东西走向的
            is_cross = true;
            /*
            let rx = roomNameToNum(roomName).x,ry = roomNameToNum(roomName).y;
            if( portals[numToRoomName({x:rx+1,y:ry})] || portals[numToRoomName({x:rx+1,y:ry})] ){
                is_NS = false;
            }else{
                is_NS = true;
            }*/
        }else if(x % 10 == 0){//如果是南北走向的
            is_NS = true;
        }else if(y % 10 == 0){//如果是东西走向的
            is_NS = false;
        }

        if(portals[roomName].length > 20){
            let tmp = [];
            portals[roomName].forEach(portal => {
                if(portal.destination.shard){
                    tmp.push(portal)
                }else{
                    if(!is_cross){
                        
                        if(is_NS){//如果是南北走向的
                            if(portal.y <= 2 || portal.y >= 47){
                                tmp.push(portal)
                            }
                        }else{//如果是东西走向的
                            if(portal.x <= 2 || portal.x >= 47){
                                tmp.push(portal)
                            }
                        }
                    }
                }
            });
            portals[roomName] = tmp;
        }
    }
    return portals;
}

function build(start,end){
    let length = calPosDis(start,end);
    if(!edges[start]) edges[start] = {};
    if(!edges[end]) edges[end] = {};
    edges[start][end] = length;
    edges[end][start] = length;
}

function buildInnerShardEdges(portals, shardName) {
    //从每个十字路口出发，向周围9格建立双向边
    for(let roomName in portals){
        let parsed = /^[WE]([0-9]+)[NS]([0-9]+)$/.exec(roomName);
        let x = roomNameToNum(roomName).x,y = roomNameToNum(roomName).y;
        if(parseInt(parsed[1]) % 10 == 0 && parseInt(parsed[2]) % 10 == 0){
            for(let startPortal of portals[roomName]){
                let startPortalName = shardName + '_'+roomName + '_' + startPortal.x + '_' + startPortal.y;

                let range = 10;
                for(let dx=-range;dx<=range;dx++){
                    for(let dy=-range;dy<=range;dy++){
                        let nx = x + dx,ny = y + dy;
                        // if(dx == 0 && dy == 0)continue;
                        if(Math.abs(dx) + Math.abs(dy) > range)continue;
                        let nextRoomName = numToRoomName({x:nx,y:ny})
                        if(!isCenter(nextRoomName) && portals[nextRoomName]){//如果不是中心房并且有portal
                            for(let endPortal of portals[nextRoomName]){
                                let endPortalName = shardName + '_'+nextRoomName + '_' + endPortal.x + '_' + endPortal.y;
                                build(startPortalName,endPortalName)
                            }
                        }
                    }
                }
            }
        }
    }

    
    //每个虫洞之间建立距离为0的双向边
    for(let roomName in portals){
        for(let portal of portals[roomName]){
            if(!portal.destination.shard){//说明是shard内虫洞
                let portalName = shardName + '_'+roomName + '_' + portal.x + '_' + portal.y;
                let endPortalName = shardName + '_'+portal.destination.room + '_' + portal.destination.x + '_' + portal.destination.y;
                if(!edges[portalName]) edges[portalName] = {};
                edges[portalName][endPortalName] = 0;//只建立单向的，最终都会是双向的
            }
        }
    }
}


function buildIntershardEdges(portals1, shardName1, portals2, shardName2) {
    for (const roomName in portals1) {
        const portals = portals1[roomName];
        for (const portal of portals) {
            if(portal.destination.shard != shardName2) continue;
            // 获取目标虫洞
            if(!portals2[portal.destination.room]) continue; // 目标房不可用
            let desPortal = portals2[portal.destination.room].find(p => p.destination.shard == shardName1 && p.destination.room == portal.room);
            if(!desPortal) continue; // 对应房间没有回来的虫洞

            let name1 = `${shardName1}_${portal.room}_${portal.x}_${portal.y}`;
            let name2 = `${shardName2}_${desPortal.room}_${desPortal.x}_${desPortal.y}`;
            if(!edges[name1]) edges[name1] = {};
            if(!edges[name2]) edges[name2] = {};
            edges[name1][name2] = 0;
            edges[name2][name1] = 0;    
        }
    }
}
let searchedroom_num = 0;
function Dijkstra(){
    ret = {};
    ret.path = [];
    var finded = 0;
    
    //Dijkstra
    var tmp_dis = {}
    var dis = {};//表示距离起点的长度
    mid = {}//表示上一个节点，用来记录路径
    var queue = [{room:START_ROOM,dis:0,mid:START_ROOM}]
    var max_dis = 0;
    while(queue.length){
        //queue.sort((a,b) => (a.dis - b.dis))
        let min_index = 0;
        for(let i=1;i<queue.length;i++){
            if(queue[i].dis < queue[min_index].dis){
                min_index = i;
            }
        }
        let top = queue[min_index];
        queue.splice(min_index,1)
        if(top){
            if(mid[top.room])continue;
            if(top.dis % 100 == 0 && top.dis > max_dis){
                max_dis = top.dis
                // console.log((top.dis/15).toFixed(2)+'%')
            }
            dis[top.room] = top.dis;
            mid[top.room] = top.mid;
            
            if(top.room.indexOf(END_ROOM) != -1){
                ret.distance = top.dis;
                
                show(top.mid)
                ret.path.push(top.room)
                ret.totalRooms = tot_mid
                
                break;
            }

            if(top.room.indexOf('shard3')!=-1)
                console.log(searchedroom_num++,top.room,top.dis)
            //console.log('top',top.room,top.dis)
            for(let nextRoomName in edges[top.room]){
                if(!dis[nextRoomName] && !mid[nextRoomName]&& top.dis + edges[top.room][nextRoomName] < 1500){
                    if(!tmp_dis[nextRoomName])tmp_dis[nextRoomName] = top.dis + edges[top.room][nextRoomName]+1;
                    if(top.dis + edges[top.room][nextRoomName] < tmp_dis[nextRoomName]){
                        queue.push({
                            room:nextRoomName,
                            dis:top.dis + edges[top.room][nextRoomName],
                            mid:top.room
                        })
                        tmp_dis[nextRoomName] = top.dis + edges[top.room][nextRoomName];
                    }
                    //console.log('next',{room:nextRoomName,dis:top.dis + edges[top.room][nextRoomName]})
                }
            }
        }
    }
}
//处理结果

function getResult(){

    //删去中间节点
    var path = ret.path;
    for(let i=0;i<path.length-2;i++){
        //console.log(calPosDis(path[i],path[i+2]))
        if(path[i].split('_') [0] == path[i+1].split('_') [0] && 
        path[i].split('_') [0] == path[i+2].split('_') [0] &&
        calPosDis(path[i],path[i+2]) <=100){
            path.splice(i+1,1)
            i--;
        }
    }

    //删去同一个虫洞的第二个坐标
    for(let i=0;i<path.length-1;i++){
        if(edges[path[i]][path[i+1]] == 0){
            path.splice(i+1, 1)
            // i--;
        }
    }

    //修改path,将字符串改为对象
    path = []
    for(let i=0;i<ret.path.length;i++){
        var str = ret.path[i].split('_')
        path.push({
            shard:str[0],
            roomName:str[1],
            x:parseInt(str[2]),
            y:parseInt(str[3])
        })
    }

    //删除起始和终止节点
    if(cutStart) path.splice(0, 1);
    if(cutEnd) path.splice(path.length - 1, 1);

    ret.path = path;
}

//打印结果
function show(roomName){
    tot_mid++;
    
    if(mid[roomName] && mid[roomName] != roomName){
        show(mid[roomName])
    }
    
    ret.path.push(roomName)
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
    return {x:x,y:y};
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
function isHighWay(roomName){
    let parsed = /[WE]([0-9]+)[NS]([0-9]+)$/.exec(roomName);
    let x = parseInt(parsed[1]),y = parseInt(parsed[2]);
    return x % 10 == 0 || y % 10 == 0;
}
function isCorner(roomName) {
    let parsed = /[WE]([0-9]+)[NS]([0-9]+)$/.exec(roomName);
    let x = parseInt(parsed[1]),y = parseInt(parsed[2]);
    return x % 10 == 0 && y % 10 == 0;
}
function isCenter(roomName) {
    let parsed = /[WE]([0-9]+)[NS]([0-9]+)$/.exec(roomName);
    let x = parseInt(parsed[1]),y = parseInt(parsed[2]);
    return x % 10 == 5 && y % 10 == 5;
}
function getShard(string) {
    return /^shard[0-3]/.exec(string)[0];
}
function getRoomName(string) {
    return string.split('_')[1];
}
function posToNum(pos){
    let pos_split = pos.split('_')
    let roomName = pos_split[1],x = parseInt(pos_split[2]),y = parseInt(pos_split[3])
    let num = roomNameToNum(roomName)
    num.x = num.x * 49 + x,num.y = num.y * 49 + y;
    return num;
}
function disNum(numA,numB){
    return Math.max(Math.abs(numA.x - numB.x),Math.abs(numA.y - numB.y))
}
function calPosDis(posA,posB){
    let numA = posToNum(posA),numB = posToNum(posB)
    return disNum(numA,numB)
}
