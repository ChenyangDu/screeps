module.exports = {
    runRoom(roomName){
        var flag = Game.flags["Main_" + roomName]
        console.log(flag)
        if(flag){
            runFlag(flag)
        }
    },
    run:function(){
        for(let room of Game.myrooms){
            let roomName = room.name;
            var flag = Game.flags["Main_" + roomName]
            if(room.controller.level == 1 || Game.time % 113 == 0){
                if(flag){
                    // runFlag(room,flag)
                }else if(room.memory.structMap){
                    runMemory(room)
                }

            }
            if(Game.time % 9973 == 0){
                removeRoad(room)
            }
        }
    },
    test:function(){
        var flag = Game.flags.test;
        if(flag){
            let positions = structureLayout[8].buildings[STRUCTURE_ROAD]
            if(positions.length){
                for(var position of positions){
                    let pos = new RoomPosition(position.x + flag.pos.x,position.y + flag.pos.y,flag.pos.roomName)
                    
                    new RoomVisual(pos.roomName).circle(pos.x,pos.y,{radius:0.5,fill:'#00FF00'})
                }
            }
            
        }
    },
    roadBuild :function(flag,position){
        roadBuild(flag,position);
    }
}

var room;
var exits = [
    {"x":1,"y":8},{"x":8,"y":1},{"x":5,"y":12},{"x":12,"y":5},
]
var center = {"x":5,"y":9}

function runMemory(room){
    let structMap = room.memory.structMap
    let level = room.controller.level
    let compeleted = true
    for(let type in structMap){
        let positions = Utils.decodePosArray(structMap[type])
        for(let i=0;i<Math.min(CONTROLLER_STRUCTURES[type][level],positions.length);i++){
            if(type == STRUCTURE_STORAGE){
                if(room.energyCapacityAvailable < 1300){
                    break;
                }
            }
            if(type == STRUCTURE_TERMINAL){
                if(room.energyCapacityAvailable < 2300 ||
                     !room.storage || room.storage.store.getUsedCapacity("energy")<10000)
                break;
            }
            if(type == STRUCTURE_LAB){
                if(!(room.terminal && room.storage && 
                    room.terminal.store.getUsedCapacity("energy") + room.storage.store.getUsedCapacity("energy")>=10000)){
                        break;
                    }
            }
            //console.log(position.x,position.y)
            
            let pos = new RoomPosition(positions[i].x,positions[i].y,room.name)
            let structures = pos.lookFor(LOOK_STRUCTURES).filter((o)=>(o.structureType == type))
            let sites = pos.lookFor(LOOK_CONSTRUCTION_SITES)
            if(sites.length){
                compeleted = false
            }else{
                if(!structures.length){
                    if(pos.createConstructionSite(type) == OK){
                        compeleted = false
                        if(type == STRUCTURE_LAB)break;//lab一个一个造
                    }
                }
            }
        }
    }
    let center = room.terminal || room.storage || _.head(room.find(STRUCTURE_SPAWN))
    if(center){
        if(level >= 2 && sourceKeep(room,center) == false && compeleted){
            compeleted = false
        }
        if(level >= 2 && level < 8 && compeleted){
            controlKeep(room,center)
        }
        if(level >= 6){
            extractor(room,center)
        }
    }
    
    
}

function runFlag(room,flag){
    if(!room){
        console.log('没得视野',flag)
        return;
    }
    let level = room.controller.level;
    let compeleted = true
    for(var type in structureLayout[level].buildings){
        let positions = structureLayout[level].buildings[type]
        if(positions.length){
            for(var position of positions){
                if(type == STRUCTURE_STORAGE){
                    if(room.energyCapacityAvailable < 1300){
                        break;
                    }
                }
                if(type == STRUCTURE_TERMINAL){
                    if(room.energyCapacityAvailable < 2300 ||
                         !room.storage || room.storage.store.getUsedCapacity("energy")<10000)
                    break;
                }
                if(type == STRUCTURE_LAB){
                    if(!(room.terminal && room.storage && 
                        room.terminal.store.getUsedCapacity("energy") + room.storage.store.getUsedCapacity("energy")>=10000)){
                            break;
                        }
                }
                //console.log(position.x,position.y)
                
                let pos = new RoomPosition(position.x + flag.pos.x,position.y + flag.pos.y,flag.pos.roomName)
                let structures = pos.lookFor(LOOK_STRUCTURES).filter((o)=>(o.structureType == type))
                let sites = pos.lookFor(LOOK_CONSTRUCTION_SITES)
                if(sites.length){
                    compeleted = false
                }else{
                    if(!structures.length){
                        if(pos.createConstructionSite(type) == OK){
                            compeleted = false
                            if(type == STRUCTURE_LAB)break;//lab一个一个造
                        }
                    }
                }
            }
        }
    }
    
    if(level >= 2 && sourceKeep(flag) == false && compeleted){
        compeleted = false
    }
    if(level >= 2 && level < 8 && compeleted){
        controlKeep(flag)
    }
    if(level >= 6){
        extractor(flag)
    }
}
function sourceKeep(room,center){
    var sources = room.find(FIND_SOURCES)
    let compeleted = true;
    for(var source of sources){
        
        if(!compeleted)continue;

        let path = myPathFinder(source.pos, {pos:center}).path
        
        // 修路
        if (room.controller.level >= 2){
            for(var i=1;i<path.length;i++){
                if(path[i].createConstructionSite(STRUCTURE_ROAD) == OK){
                    compeleted = false;
                }
            }
        }
        if(path.length > 0){
            // 放黄黄旗
            path[0].createFlag(room.name + '_' + source.id[source.id.length-1],COLOR_YELLOW,COLOR_YELLOW)
            // 放link
            let linkPos = null;
            for(let x = -1;x<=1;x++)
                for(let y = -1;y<=1;y++)
                    if(x || y){
                        let pos = new RoomPosition(path[0].x+x,path[0].y+y,path[0].roomName);
                        // 位置不等于最后一格路
                        if(path.length > 1 && pos.isEqualTo(path[1]))continue;
                        // 不能是墙
                        if(pos.lookFor(LOOK_TERRAIN) == 'wall')continue;
                        // 最近的
                        if(!linkPos || linkPos.getRangeTo(center) > pos.getRangeTo(center)){
                            linkPos = pos;
                        }
                    }
            if(linkPos && linkPos.lookFor(LOOK_STRUCTURES)
                .find(o=>o.structureType == STRUCTURE_LINK) == undefined)
                linkPos.createConstructionSite(STRUCTURE_LINK)
        }else{
            console.log("寻路失败",room.name)
        }
    }
    return compeleted
}
/**
 * 
 * @param {Room} room 
 * @param {Flag} flag 
 * @param {Structure} center 
 * @returns 
 */
function controlKeep(room,center){
    let controller = room.controller;

    let containerPos = null; // 计算container的位置
    {
        let sources = room.find(FIND_MINERALS).concat(room.find(FIND_SOURCES))
        let max_cnt = 0;// creep可以站的点
        let prePoses = [] // 获取待选列表
        let range2 = [
            [0,2],[1,2],[2,2],[2,1],
            [0,-2],[-1,-2],[-2,-2],[-2,-1],
            [-2,0],[-2,1],[-2,2],[-1,2],
            [2,0],[2,-1],[2,-2],[1,-2],
        ]
        let range1 = [
            [0,1],[1,1],[0,-1],[-1,-1],
            [1,0],[1,-1],[-1,0],[-1,1],
        ]
        for(let p of range2){
            let pos = new RoomPosition(p[0]+controller.pos.x,p[1]+controller.pos.y,room.name)
            let ok = true;
            for(let source of sources){
                if(pos.getRangeTo(source) <= 2){ // 不能靠近矿点
                    ok = false;
                    break;
                }
            }
            if(!ok)continue;

            let cnt = 0
            range1.forEach(p1=>{
                if(room.lookFor(LOOK_TERRAIN)[0] != TERRAIN_MASK_WALL){
                    cnt++;
                }
            })
            if(cnt > max_cnt){
                max_cnt = cnt;
                prePoses = [pos]
            }else if(cnt == max_cnt){
                prePoses.push(pos)
            }
        }
        // 从待选中选一个最近的
        containerPos = center.pos.findClosestByPath(prePoses)
    }
    if(!containerPos){
        console.log("container pos error",room.name)
        return;
    }

    let container = _.head(containerPos.lookFor(LOOK_STRUCTURES).filter(o=>o.structureType==STRUCTURE_CONTAINER))
    if(container){
        Memory['prototype'][room.name].tStorage = container.id
    }

    let path = myPathFinder(center.pos,containerPos).path
    for(var i=1;i<path.length-1;i++){
        path[i].createConstructionSite(STRUCTURE_ROAD)
    }
    
    if(path.length){
        // 靠近controller的container
        // let containerPos = path[path.length-1]
        // if(room.tStorage()){
        //     containerPos = room.tStorage().pos
        // }else{
        //     containerPos.createConstructionSite(STRUCTURE_CONTAINER)
        // }
        
        // if(controller.level >= 6){
        //     for(let x = -1;x<=1;x++){
        //         for(let y = -1;y<=1;y++){
        //             if(x || y){
        //                 let pos = new RoomPosition(containerPos.x+x,containerPos.y+y,containerPos.roomName)
        //                 if(pos.lookFor(LOOK_TERRAIN)[0] != 'wall'){
        //                     pos.createConstructionSite(STRUCTURE_ROAD)
        //                 }
        //             }
        //         }
        //     }
        // }
        if(path.length >= 2){
            let notUpgraderPos = path[path.length-2];
            room.memory.notUpgraderPos = notUpgraderPos;
        }
    }
}

function extractor(room,center){
    let miner = room.find(FIND_MINERALS)[0]
    miner.pos.createConstructionSite(STRUCTURE_EXTRACTOR)
    miner.range = 1;
    let path = myPathFinder(center,miner).path
    for(var i=1;i<path.length-1;i++){
        path[i].createConstructionSite(STRUCTURE_ROAD)
    }
    if(path.length){
        // 靠近controller的container
        let minerPos = path[path.length-1]
        if(room.memory.miner){
            minerPos = new RoomPosition(room.memory.miner.pos.x,room.memory.miner.pos.y,room.name)
        }else{
            room.memory.miner = {}
            room.memory.miner.pos = {}
            room.memory.miner.id = miner.id
            room.memory.miner.pos.x = minerPos.x
            room.memory.miner.pos.y = minerPos.y
        }
        minerPos.createConstructionSite(STRUCTURE_CONTAINER)
    }
}

function roadBuild(flag,position){
    var exits = [
        {"x":1,"y":8},{"x":8,"y":1},{"x":5,"y":12},{"x":12,"y":5},
    ]
    exits.forEach(exit => {
        exit.pos = new RoomPosition(exit.x + flag.pos.x,exit.y + flag.pos.y,flag.pos.roomName)
        exit.PathFinder = PathFinder.search(position,exit)
    });
    exits.sort((a,b)=>(a.PathFinder.cost - b.PathFinder.cost))
    let path = exits[0].PathFinder.path
    for(var pos of path){
        new RoomVisual(pos.roomName).circle(pos.x,pos.y);
    }
}

function myPathFinder(startPos,target){
    return PathFinder.search(
        startPos, target,
        {
        // 我们需要把默认的移动成本设置的更高一点
        // 这样我们就可以在 roomCallback 里把道路移动成本设置的更低
        plainCost: 2,
        swampCost: 4,

        roomCallback: function(roomName) {

            let room = Game.rooms[roomName];
            if (!room) return;
            let costs = new PathFinder.CostMatrix;

            room.find(FIND_STRUCTURES).forEach(function(struct) {
                if (struct.structureType === STRUCTURE_ROAD || 
                    struct.structureType === STRUCTURE_CONTAINER) {
                    // 相对于平原，寻路时将更倾向于道路
                    costs.set(struct.pos.x, struct.pos.y, 1);
                } else if (struct.structureType !== STRUCTURE_CONTAINER &&
                            (struct.structureType !== STRUCTURE_RAMPART ||
                            !struct.my)) {
                    // 不能穿过无法行走的建筑
                    costs.set(struct.pos.x, struct.pos.y, 0xff);
                }
            });
            room.find(FIND_CONSTRUCTION_SITES).forEach(function(site) {
                if(site.structureType == STRUCTURE_ROAD){
                    costs.set(site.pos.x,site.pos.y,1);
                }
                if(site.structureType == STRUCTURE_CONTAINER){
                    costs.set(site.pos.x,site.pos.y,1);
                }
            })

            return costs;
        },
        }
    );
}
function removeRoad(room){
    room.find(FIND_STRUCTURES,{
        filter:road=>{
            if(road.structureType != STRUCTURE_ROAD)return false
            let structs = road.pos.lookFor(LOOK_STRUCTURES)
            if(structs.length > 1){
                structs.forEach(struct => {
                    if(OBSTACLE_OBJECT_TYPES.indexOf(struct.structureType) != -1){
                        road.destroy();
                    }
                });
            }
        }
    })
}
const structureLayout = {
    1: {
        "rcl":1,
        "buildings":{
            "extension":[],
            "spawn":[
                {"x":7,"y":8}
            ],
            "road":[],
            "tower":[],
            "storage":[],
            "terminal":[],
            "powerSpawn":[],
            "link":[],
            "container":[],
            "lab":[],
            "nuker":[],
            "observer":[],
            "factory":[]
        }
    },
    2: {
        "rcl":2,
        "buildings":{
            "extension":[
                {x:6,y:6},{x:7,y:6},{x:7,y:7},{x:8,y:7},{x:8,y:8},
            ],
            "spawn":[
                {"x":7,"y":8}
            ],
            "road":[
                {x:6,y:9},{x:7,y:5},{x:9,y:8},{x:8,y:6},{x:9,y:7},{x:8,y:9},{x:7,y:10},
            ],
            "tower":[],
            "storage":[],
            "terminal":[],
            "powerSpawn":[],
            "link":[],
            "container":[],
            "lab":[],
            "nuker":[],
            "observer":[],
            "factory":[],
            "rampart":[
            ]
        }
    },
    3: {
        "rcl":3,
        "buildings":{
            "extension":[
                {x:3,y:5},{x:5,y:5},{x:6,y:5},{x:6,y:6},{x:7,y:6},
                {x:7,y:7},{x:4,y:4},{x:5,y:3},{x:8,y:7},{x:8,y:8},
            ],
            "spawn":[
                {"x":7,"y":8}
            ],
            "road":[
                {x:6,y:9},{x:5,y:8},{x:4,y:7},{x:3,y:6},{x:4,y:5},
                {x:5,y:4},{x:6,y:4},{x:7,y:5},{x:9,y:8},{x:8,y:6},
                {x:9,y:7},{x:8,y:9},{x:7,y:10},
            ],
            "tower":[
                {"x":5,"y":7}
            ],
            "storage":[],
            "terminal":[],
            "powerSpawn":[],
            "link":[],
            "container":[],
            "lab":[],
            "nuker":[],
            "observer":[],
            "factory":[],
            "rampart":[
            ]
        }
    },
    4: {
        "rcl":4,
        "buildings":{
            "extension":[
                {x:3,y:4},{x:3,y:5},{x:5,y:5},{x:6,y:5},{x:6,y:6},{x:7,y:6},{x:7,y:7},
                {x:7,y:4},{x:8,y:5},{x:8,y:4},{x:7,y:3},{x:4,y:3},{x:4,y:4},{x:6,y:2},
                {x:5,y:3},{x:8,y:7},{x:8,y:8},{x:9,y:5},{x:9,y:6},{x:10,y:6},
            ],
            "spawn":[
                {"x":7,"y":8}
            ],
            "road":[
                {x:6,y:9},{x:5,y:8},{x:4,y:7},{x:3,y:6},{x:4,y:5},{x:5,y:4},
                {x:6,y:4},{x:7,y:5},{x:10,y:7},{x:6,y:3},{x:9,y:8},{x:8,y:6},
                {x:9,y:7},{x:8,y:9},{x:7,y:10},
            ],
            "tower":[
                {"x":5,"y":7}
            ],
            "storage":[
                {"x":5,"y":9}
            ],
            "terminal":[],
            "powerSpawn":[],
            "link":[],
            "container":[],
            "lab":[],
            "nuker":[],
            "observer":[],
            "factory":[],
            "rampart":[
                {"x":7,"y":8},{"x":5,"y":7},{"x":5,"y":9}
            ]
        }
    },
    5: {
        "rcl":5,
        "buildings":{
            "extension":[
                {x:9,y:4},
                {x:3,y:4},{x:3,y:5},{x:5,y:5},{x:6,y:5},{x:6,y:6},
                {x:7,y:6},{x:7,y:7},{x:7,y:4},{x:8,y:5},{x:8,y:4},{x:8,y:3},
                {x:8,y:2},{x:7,y:3},{x:4,y:3},{x:5,y:2},{x:4,y:4},{x:6,y:2},
                {x:6,y:1},{x:7,y:1},{x:5,y:3},{x:8,y:7},{x:8,y:8},{x:9,y:5},
                {x:9,y:6},{x:10,y:6},{x:11,y:5},{x:10,y:5},{x:9,y:3},{x:10,y:4},
            ],
            "spawn":[
                {"x":7,"y":8}
            ],
            "road":[
                {x:6,y:9},{x:5,y:8},{x:4,y:7},{x:3,y:6},{x:4,y:5},{x:5,y:4},{x:6,y:4},
                {x:7,y:5},{x:10,y:7},{x:6,y:3},{x:7,y:2},{x:9,y:8},{x:8,y:6},{x:9,y:7},
                {x:8,y:9},{x:7,y:10},{x:11,y:6},{x:8,y:1},{x:9,y:2},{x:10,y:3},{x:11,y:4},
                {x:12,y:5},
            ],
            "tower":[
                {"x":5,"y":7},{"x":4,"y":8}
            ],
            "storage":[
                {"x":5,"y":9}
            ],
            "terminal":[],
            "powerSpawn":[],
            "link":[
                {"x":6,"y":8}
            ],
            "container":[],
            "lab":[],
            "nuker":[],
            "observer":[],
            "factory":[],
            "rampart":[
                {"x":7,"y":8},{"x":5,"y":7},{"x":5,"y":9},{"x":4,"y":8}
            ]
            
        }
    },
    6: {
        "rcl":6,
        "buildings":{
            "extension":[
                {x:2,y:8},{x:2,y:9},{x:3,y:9},{x:3,y:10},{x:4,y:10},{x:4,y:11},{x:5,y:11},
                {x:1,y:7},{x:2,y:5},{x:2,y:6},{x:9,y:4},{x:3,y:4},{x:3,y:5},{x:5,y:5},
                {x:6,y:5},{x:6,y:6},{x:7,y:6},{x:7,y:7},{x:7,y:4},{x:8,y:5},{x:8,y:4},
                {x:8,y:3},{x:8,y:2},{x:7,y:3},{x:4,y:3},{x:5,y:2},{x:4,y:4},{x:6,y:2},
                {x:6,y:1},{x:7,y:1},{x:5,y:3},{x:8,y:7},{x:8,y:8},{x:9,y:5},{x:9,y:6},
                {x:10,y:6},{x:11,y:5},{x:10,y:5},{x:9,y:3},{x:10,y:4},
            ],
            "spawn":[
                {"x":7,"y":8}
            ],
            "road":[
                {x:6,y:9},{x:5,y:8},{x:4,y:7},{x:3,y:6},{x:2,y:7},{x:4,y:5},{x:5,y:4},
                {x:6,y:4},{x:7,y:5},{x:10,y:7},{x:6,y:3},{x:7,y:2},{x:9,y:8},{x:8,y:6},
                {x:9,y:7},{x:8,y:9},{x:7,y:10},{x:6,y:11},{x:11,y:6},{x:8,y:1},{x:9,y:2},
                {x:10,y:3},{x:11,y:4},{x:12,y:5},{x:5,y:12},{x:4,y:12},{x:3,y:11},
                {x:2,y:10},{x:1,y:9},{x:1,y:8},
            ],
            "tower":[
                {"x":5,"y":7},{"x":4,"y":8}
            ],
            "storage":[
                {"x":5,"y":9}
            ],
            "terminal":[
                {"x":4,"y":9}
            ],
            "powerSpawn":[],
            "link":[
                {"x":6,"y":8}
            ],
            "container":[],
            "lab":[
                {"x":8,"y":10},{"x":8,"y":11},{"x":7,"y":11},
            ],
            "nuker":[],
            "observer":[],
            "factory":[],
            "rampart":[
                {"x":7,"y":8},{"x":5,"y":7},{"x":5,"y":9},{"x":4,"y":8},{"x":4,"y":9},

            ]
        }
    },
    7: {
        "rcl":7,
        "buildings":{
            "extension":[
                {x:2,y:8},{x:2,y:9},{x:3,y:9},{x:3,y:10},{x:4,y:10},{x:4,y:11},{x:5,y:11},
                {x:1,y:7},{x:9,y:4},{x:2,y:6},{x:2,y:5},{x:3,y:4},{x:3,y:5},{x:5,y:5},
                {x:6,y:5},{x:6,y:6},{x:7,y:6},{x:7,y:7},{x:7,y:4},{x:8,y:5},{x:8,y:4},
                {x:8,y:3},{x:8,y:2},{x:7,y:3},{x:4,y:3},{x:5,y:2},{x:4,y:4},{x:6,y:2},
                {x:6,y:1},{x:7,y:1},{x:11,y:9},{x:12,y:9},{x:5,y:3},{x:8,y:7},{x:8,y:8},
                {x:12,y:8},{x:9,y:5},{x:9,y:6},{x:10,y:6},{x:11,y:5},{x:10,y:5},{x:12,y:6},
                {x:12,y:7},{x:11,y:7},{x:11,y:8},{x:10,y:8},{x:11,y:10},{x:10,y:9},
                {x:9,y:3},{x:10,y:4},
            ],
            "spawn":[
                {"x":7,"y":8},
                {"x":7,"y":9}
            ],
            "road":[
                {x:6,y:9},{x:5,y:8},{x:4,y:7},{x:3,y:6},{x:2,y:7},{x:4,y:5},{x:5,y:4},
                {x:6,y:4},{x:7,y:5},{x:10,y:7},{x:6,y:3},{x:7,y:2},{x:9,y:8},{x:8,y:6},
                {x:9,y:7},{x:8,y:9},{x:7,y:10},{x:6,y:11},{x:11,y:6},{x:8,y:1},{x:9,y:2},
                {x:10,y:3},{x:11,y:4},{x:12,y:5},{x:13,y:6},{x:13,y:7},{x:13,y:8},
                {x:13,y:9},{x:12,y:10},{x:11,y:11},{x:10,y:12},{x:9,y:13},{x:8,y:13},
                {x:7,y:13},{x:6,y:13},{x:5,y:12},{x:4,y:12},{x:3,y:11},{x:2,y:10},
                {x:1,y:9},{x:1,y:8},{x:10,y:10},{x:9,y:9},
            ],
            "tower":[
                {"x":5,"y":7},{"x":4,"y":8},{"x":5,"y":6},
            ],
            "storage":[
                {"x":5,"y":9}
            ],
            "terminal":[
                {"x":4,"y":9}
            ],
            "powerSpawn":[],
            "link":[
                {"x":6,"y":8}
            ],
            "container":[],
            "lab":[
                {"x":8,"y":10},{"x":8,"y":11},{"x":7,"y":11},
                {"x":8,"y":12},{"x":7,"y":12},{"x":6,"y":12},
            ],
            "nuker":[],
            "observer":[],
            "factory":[],
            "rampart":[
                {"x":7,"y":8},{"x":5,"y":7},{"x":5,"y":9},{"x":5,"y":6},
                {"x":4,"y":8},{"x":4,"y":9},{"x":7,"y":9},
            ]
        }
    },
    8: {
        "rcl":8,
        "buildings":{
            "extension":[
                {"x":4,"y":3},{"x":4,"y":4},{"x":3,"y":4},{"x":2,"y":5},{"x":2,"y":6},
                {"x":3,"y":5},{"x":5,"y":3},{"x":5,"y":2},{"x":6,"y":1},{"x":7,"y":1},
                {"x":6,"y":2},{"x":1,"y":7},{"x":5,"y":5},{"x":6,"y":5},{"x":6,"y":6},
                {"x":7,"y":6},{"x":7,"y":7},{"x":8,"y":7},{"x":8,"y":8},{"x":7,"y":3},
                {"x":7,"y":4},{"x":8,"y":4},{"x":8,"y":5},{"x":9,"y":5},{"x":9,"y":6},
                {"x":10,"y":6},{"x":10,"y":5},{"x":10,"y":4},{"x":9,"y":3},{"x":8,"y":3},
                {"x":8,"y":2},{"x":9,"y":4},{"x":11,"y":5},{"x":10,"y":8},{"x":10,"y":9},
                {"x":2,"y":8},{"x":2,"y":9},{"x":3,"y":9},{"x":3,"y":10},{"x":4,"y":10},
                {"x":4,"y":11},{"x":5,"y":11},{"x":11,"y":7},{"x":11,"y":8},{"x":11,"y":9},
                {"x":11,"y":10},{"x":12,"y":6},{"x":12,"y":7},{"x":12,"y":8},{"x":12,"y":9},
                {"x":5,"y":1},{"x":4,"y":1},{"x":4,"y":2},{"x":3,"y":2},{"x":3,"y":3},
                {"x":2,"y":3},{"x":2,"y":4},{"x":1,"y":4},{"x":1,"y":5},{"x":1,"y":6},
            ],
            "spawn":[
                {"x":7,"y":8},
                {"x":7,"y":9},
                {"x":6,"y":10},
            ],
            "road":[
                {"x":4,"y":0},{"x":3,"y":1},{"x":2,"y":2},{"x":1,"y":3},{"x":0,"y":4},
                {"x":5,"y":0},{"x":6,"y":0},{"x":7,"y":0},{"x":0,"y":5},{"x":0,"y":6},
                {"x":0,"y":7},{"x":1,"y":8},{"x":1,"y":9},{"x":2,"y":10},{"x":2,"y":7},
                {"x":3,"y":6},{"x":4,"y":7},{"x":8,"y":1},{"x":7,"y":2},{"x":6,"y":3},
                {"x":5,"y":4},{"x":4,"y":5},{"x":6,"y":4},{"x":7,"y":5},{"x":8,"y":6},
                {"x":9,"y":7},{"x":5,"y":8},{"x":6,"y":9},{"x":7,"y":10},{"x":8,"y":9},
                {"x":9,"y":8},{"x":10,"y":7},{"x":11,"y":6},{"x":3,"y":11},{"x":4,"y":12},
                {"x":6,"y":11},{"x":5,"y":12},{"x":6,"y":13},{"x":7,"y":13},{"x":8,"y":13},
                {"x":9,"y":13},{"x":10,"y":12},{"x":9,"y":2},{"x":10,"y":3},{"x":11,"y":4},
                {"x":12,"y":5},{"x":13,"y":6},{"x":13,"y":7},{"x":13,"y":8},{"x":13,"y":9},
                {"x":12,"y":10},{"x":11,"y":11},
            ],
            "tower":[
                {"x":5,"y":7},{"x":4,"y":8},{"x":5,"y":6},
                {"x":4,"y":6},{"x":3,"y":7},{"x":3,"y":8},
            ],
            "storage":[
                {"x":5,"y":9}
            ],
            "terminal":[
                {"x":4,"y":9}
            ],
            "powerSpawn":[
                {"x":6,"y":7}
            ],
            "link":[
                {"x":6,"y":8}
            ],
            "container":[],
            "lab":[
                {"x":8,"y":10},{"x":8,"y":11},{"x":7,"y":11},
                {"x":8,"y":12},{"x":7,"y":12},{"x":6,"y":12},
                {"x":9,"y":9},{"x":9,"y":10},{"x":9,"y":11},{"x":9,"y":12},
            ],
            "nuker":[
                {"x":10,"y":10}
            ],
            "observer":[
                {"x":10,"y":11}
            ],
            "factory":[
                {"x":5,"y":10}
            ],
            "rampart":[
                {"x":5,"y":7},{"x":4,"y":8},{"x":5,"y":6},
                {"x":4,"y":6},{"x":3,"y":7},{"x":3,"y":8},
                {"x":5,"y":9},{"x":4,"y":9},
                {"x":7,"y":8},
                {"x":7,"y":9},
                {"x":6,"y":10},
                // {"x":4,"y":0},{"x":3,"y":1},{"x":2,"y":2},{"x":1,"y":3},{"x":0,"y":4},{"x":0,"y":5},
                // {"x":0,"y":6},{"x":0,"y":7},{"x":1,"y":8},{"x":1,"y":9},{"x":2,"y":10},{"x":3,"y":11},
                // {"x":4,"y":12},{"x":3,"y":4},{"x":3,"y":3},{"x":5,"y":2},{"x":6,"y":2},{"x":6,"y":3},
                // {"x":5,"y":5},{"x":5,"y":6},{"x":4,"y":6},{"x":3,"y":5},{"x":4,"y":4},{"x":6,"y":4},
                // {"x":7,"y":5},{"x":6,"y":6},{"x":4,"y":7},{"x":2,"y":6},{"x":2,"y":5},{"x":2,"y":4},
                // {"x":5,"y":4},{"x":6,"y":7},{"x":5,"y":8},{"x":3,"y":7},{"x":3,"y":6},{"x":7,"y":8},
                // {"x":6,"y":9},{"x":5,"y":9},{"x":7,"y":7},{"x":9,"y":8},{"x":8,"y":9},{"x":7,"y":9},
                // {"x":8,"y":7},{"x":11,"y":8},{"x":11,"y":10},{"x":8,"y":10},{"x":8,"y":8},{"x":12,"y":8},
                // {"x":11,"y":9},{"x":10,"y":7},{"x":10,"y":6},{"x":11,"y":6},{"x":9,"y":5},{"x":9,"y":4},
                // {"x":8,"y":4},{"x":4,"y":2},{"x":5,"y":1},{"x":6,"y":1},{"x":7,"y":3},{"x":7,"y":4},
                // {"x":1,"y":4},{"x":1,"y":5},{"x":1,"y":6},{"x":1,"y":7},{"x":2,"y":8},{"x":3,"y":9},
                // {"x":4,"y":10},{"x":5,"y":10},{"x":6,"y":10},{"x":6,"y":11},{"x":7,"y":11},{"x":8,"y":11},
                // {"x":9,"y":11},{"x":10,"y":11},{"x":10,"y":10},{"x":6,"y":12},{"x":6,"y":13},{"x":7,"y":12},
                // {"x":8,"y":12},{"x":9,"y":12},{"x":7,"y":13},{"x":8,"y":13},{"x":9,"y":13},{"x":10,"y":12},
                // {"x":12,"y":10},{"x":12,"y":9},{"x":6,"y":0},{"x":7,"y":0},{"x":7,"y":1},{"x":8,"y":1},
                // {"x":8,"y":2},{"x":9,"y":2},{"x":9,"y":3},{"x":10,"y":4},{"x":10,"y":5},{"x":11,"y":5},
                // {"x":12,"y":5},{"x":12,"y":6},{"x":13,"y":7},{"x":12,"y":7},{"x":11,"y":7},{"x":8,"y":5},
                // {"x":7,"y":6},{"x":8,"y":6},{"x":9,"y":7},{"x":9,"y":9},{"x":9,"y":10},{"x":10,"y":9},
                // {"x":10,"y":8},{"x":6,"y":8},{"x":7,"y":10},{"x":9,"y":6},{"x":2,"y":3},{"x":3,"y":2},
                // {"x":4,"y":1},{"x":5,"y":0},{"x":4,"y":3},{"x":5,"y":3},{"x":7,"y":2},{"x":8,"y":3},
                // {"x":6,"y":5},{"x":5,"y":7},{"x":4,"y":8},{"x":3,"y":8},{"x":3,"y":10},{"x":4,"y":11},
                // {"x":5,"y":12},{"x":5,"y":11},{"x":2,"y":9},{"x":4,"y":9},{"x":2,"y":7},{"x":4,"y":5},
                // {"x":10,"y":3},{"x":11,"y":4},{"x":13,"y":6},{"x":13,"y":8},{"x":13,"y":9},{"x":11,"y":11},
            ]
        }
    },
}