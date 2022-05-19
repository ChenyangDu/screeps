/*
autoBlueprint
saveBlueprint
showBlueprint

pa sourceA
pb sourceB
pc controller
pm mineral

storagePos
block_范围_后缀

{
    "controller": "Dy",
    "link": "eIgStF",
    "storage": "sF",
    "spawn": "qFsDsH",
    "tower": "rFsEsGqDuDqH",
    "powerSpawn": "uF",
    "road": "rGsIrHqGpFqErDsCtDuEvFuGtHtGrEtEvIvHwGuItJwJxKxGtKrBqAtBuAoEnDnCpArysytyvArJqKpKoJnInHoGwExDxCwBwyxyyAyByEyFyHyIyJoBmJmKnLoLrLsLuLvLwLmGmFmEmBmAnyoyvG",
    "terminal": "uH",
    "factory": "tI",
    "extension": "sBsArAtArCqBpBqCpCoCpDoDpEqypyuyvytCuCuBvBwCwDvDvEpGrIqIpIoIpHoHpJqJwAxByCyDxExFwFsJrKsKoFnEnGnFnJoKnKnAnBoAmCmDmHmI",
    "lab": "wIwHxHxIxJvJuJuKvKwK",
    "observer": "xA",
    "nuker": "vC"
}
 */


let pro={
    /**
     * 更新房间的路线,必须要要8级全部建筑
     * @param room
     * @param structMap
     */
    createRoads (room,roomManor,structMap){
        let storageX = room.storage.pos.x+1
        let storageY = room.storage.pos.y
        let visited = new RoomArray()
        // let roomStructs = new RoomArray()
        let costRoad = new RoomArray().init()
        let costRoad2 = new RoomArray().init()
        let roomWalkable = new RoomArray()

        roomWalkable.init().initRoomTerrainWalkAble(room.name)

        let queMin = new PriorityQueue(true)
        let queMax = new PriorityQueue(false)

        visited.init()
        roomManor.forEach((x,y,val)=>{
            if(roomWalkable.get(x,y)&&val==1){
                let nd = undefined
                roomManor.forNear((x1,y1,val1)=>{
                    if(roomWalkable.get(x1,y1)&&!val1&&!nd)nd = NewNode(1,x,y)
                },x,y)
                if(nd){
                    queMin.push(nd)
                    visited.exec(nd.x,nd.y,1)
                }
            }
        })
        queMin.whileNoEmpty(nd=>{
            roomManor.forNear((x,y,val)=>{
                if(!visited.exec(x,y,1)&&val>0){
                    queMin.push(NewNode(nd.k+1,x,y))
                }
            },nd.x,nd.y)
            roomManor.set(nd.x,nd.y,nd.k)
        })
        roomManor.forEach((x,y,val)=>{HelperVisual.showText(room.name,roomManor.get(x,y),{x:x,y:y},"blue")})

        queMin.push(NewNode(1,storageX,storageY));

        for(let k in structMap){
            structMap[k].forEach(e=>{
                if(k==STRUCTURE_RAMPART&&roomWalkable.get(e.x,e.y))return;
                roomWalkable.set(e.x,e.y,k)
            })
        }


        for(let k in structMap){
            structMap[k].forEach(e=>{
                if(k==STRUCTURE_RAMPART||k==STRUCTURE_WALL||k==STRUCTURE_LINK||k==STRUCTURE_CONTAINER||k==STRUCTURE_EXTRACTOR)return;
                costRoad.forNear((x,y,val)=>{
                    costRoad.set(x,y,1)
                    costRoad2.set(x,y,1)
                },e.x,e.y,1)
            })
        }
        costRoad2.forEach((x,y,val)=>{
            if(val==0){
                costRoad.forNear((x,y,val)=>{
                    costRoad.set(x,y,0)
                },x,y,1)
            }
        })

        visited.init()
        queMin.whileNoEmpty(nd=>{
            roomWalkable.forNear((x,y,val)=>{
                if(!visited.exec(x,y,1)&&val>0||val==STRUCTURE_RAMPART){
                    queMin.push(NewNode(nd.k+1,x,y))
                }
            },nd.x,nd.y)
            roomWalkable.set(nd.x,nd.y,nd.k)
        })

        costRoad.forEach((x,y,val)=>{
            if(val&&roomWalkable.get(x,y)>0){
                // HelperVisual.showText(room.name,(""+roomWalkable.get(x,y)).substr(0,2),{x:x,y:y},val>0?"red":"blue")
                queMax.push(NewNode(roomWalkable.get(x,y),x,y))
            }
        })
        queMax.whileNoEmpty(nd=>{
            roomWalkable.forNear((x,y,val)=>{
                if(val<nd.k&&roomWalkable.get(x,y)>0){
                    costRoad.set(x,y,1)
                    if(roomManor.get(x,y)>3)queMax.push(NewNode(val,x,y))
                }
            },nd.x,nd.y)
            // HelperVisual.showText(room.name,roomManor.get(nd.x,nd.y),nd,"blue")
            roomWalkable.set(nd.x,nd.y,STRUCTURE_ROAD)
        })


        structMap["road"] = []
        roomWalkable.forEach((x,y,val)=>{
            if(val==STRUCTURE_ROAD){structMap["road"].push({x:x,y:y})}
        })

        let costs = new PathFinder.CostMatrix;
        let terrain = new Room.Terrain(room.name);
        for(let i=0;i<50;i++){
            for(let j=0;j<50;j++){
                let te = terrain.get(i,j)
                if(i>=40||i<10||j>=40||j<10)
                    costs.set(i,j,te==TERRAIN_MASK_WALL?255:(te==TERRAIN_MASK_SWAMP?5:3))
                else
                    costs.set(i,j,te==TERRAIN_MASK_WALL?255:(te==TERRAIN_MASK_SWAMP?4:2))
            }
        }
        for(let struct of OBSTACLE_OBJECT_TYPES){
            if(structMap[struct]&&struct!=STRUCTURE_RAMPART&&struct!=STRUCTURE_CONTAINER&&struct!=STRUCTURE_ROAD){
                structMap[struct].forEach(e=>{
                    costs.set(e.x,e.y,255)
                })
            }
        }
        structMap["road"].forEach(e=>{
            costs.set(e.x,e.y,1)
        })
        structMap["container"].sort(e=>Math.sqrt((e.x-storageX)*(e.x-storageX)+(e.y-storageY)*(e.y-storageY)))
        structMap["container"].forEach(e=>{
            let ret = PathFinder.search(
                new RoomPosition(storageX,storageY,room.name),
                {pos:new RoomPosition(e.x,e.y,room.name),range:1},
                {
                    roomCallback:()=>{return costs},
                    maxRooms:1
                }
            )
            ret.path.forEach(pos=>{
                if(costs.get(pos.x,pos.y) != 1){
                    structMap['road'].push({x:pos.x,y:pos.y})
                    costs.set(pos.x,pos.y,1)
                }
            })

        })

    },
    updateWall(room,structMap){
        let roomStructures= new RoomArray()
        let roomManor= new RoomArray().init()
        let roomWalkable = new RoomArray()
        let visited = new RoomArray()

        roomStructures.init()
        visited.init()
        roomWalkable.init().initRoomTerrainWalkAble(room.name)
        let queMin = new PriorityQueue(true)


        for(let k in structMap){
            structMap[k].forEach(e=>{
                if(k==STRUCTURE_ROAD&&roomWalkable.get(e.x,e.y))return;
                roomStructures.set(e.x,e.y,k)
                if(k!=STRUCTURE_RAMPART&&k!=STRUCTURE_WALL&&k!=STRUCTURE_CONTAINER&&k!=STRUCTURE_LINK&&k!=STRUCTURE_EXTRACTOR&&k!=STRUCTURE_LINK)
                    roomWalkable.forNear((x,y,val)=>{
                        if(roomWalkable.get(x,y)&&!visited.exec(x,y,1)){
                            queMin.push(NewNode(0,x,y))
                        }
                            // roomManor.set(x,y,1)
                    },e.x,e.y,3)
            })
        }

        let WallError = false

        structMap[STRUCTURE_WALL] = []
        structMap[STRUCTURE_RAMPART] = []
        queMin.whileNoEmpty(nd=>{
            let struct = roomStructures.get(nd.x,nd.y);
            roomManor.set(nd.x,nd.y,1)
            if(struct==STRUCTURE_WALL||struct==STRUCTURE_RAMPART){
                return;
            }
            if(!roomWalkable.get(nd.x,nd.y))return;
            HelperVisual.showText(room.name,"▓",{x:nd.x,y:nd.y},'cyan')
            let isBorder = e=>!(e.x>0&&e.y>0&&e.x<49&&e.y<49)
            if(isBorder(nd))WallError=true;
            roomWalkable.forNear((x,y,val)=>{
                if(roomWalkable.get(x,y)&&!visited.exec(x,y,1)){
                    queMin.push(NewNode(0,x,y))
                }
            },nd.x,nd.y)
        })

        if(WallError){
            console.log("围墙没维好，建筑会被打到")
            return;
        }
        visited.init()
        roomManor.forEach((x,y,val)=>{
            if(!val&&roomWalkable.get(x,y)){
                roomManor.forNear((x,y,val)=>{
                    let struct = roomStructures.get(x,y)
                    if((struct==STRUCTURE_RAMPART||struct==STRUCTURE_WALL)
                        &&!visited.exec(x,y,1) &&roomManor.get(x,y)){
                        structMap[struct].push({x:x,y:y});
                        // HelperVisual.showText(room.name,"▓",{x:x,y:y},'cyan')
                    }
                },x,y)
            }
        })
        return roomManor
    },
    saveStructMap (){
        let s = Game.flags.saveBlueprint;
        if(!s)return
        let room = Game.rooms[s.pos.roomName]
        if(!room||!(room.controller&&room.controller.my)){
            console.log("房间不是我的，禁止保存");
            return;
        }
        // let t = Game.cpu.getUsed();
        let structs = room.find(FIND_STRUCTURES,{filter:(e)=>(e.my||e.structureType==STRUCTURE_CONTAINER||e.structureType==STRUCTURE_WALL)&&e.structureType!=STRUCTURE_ROAD&&e.structureType!=STRUCTURE_CONTROLLER})

        let walkAble = new RoomArray().init()
        walkAble.initRoomTerrainWalkAble(room.name)

        let structMap = {}
        structs.forEach(e=>{
            if(!structMap[e.structureType])structMap[e.structureType] = []
            structMap[e.structureType].push(e.pos)
        })

        /** 验证缺少 */
        _.keys(CONTROLLER_STRUCTURES).forEach(struct=>{
            let len = CONTROLLER_STRUCTURES[struct][8]
            if(struct==STRUCTURE_RAMPART||struct==STRUCTURE_WALL||struct==STRUCTURE_ROAD)return;
            if(struct==STRUCTURE_LINK)len = 3
            if(struct==STRUCTURE_CONTAINER)len = 4
            if(!structMap[struct]||structMap[struct].length<len){
                let currentLen = (structMap[struct]?structMap[struct].length:0)
                console.log(struct+" 未使用完:现有"+currentLen+",最少"+len)
            }
        })

        let roomManor = pro.updateWall(room,structMap)
        pro.createRoads(room,roomManor,structMap)

        // pro.showRoomStructures(room.name,structMap)
        // log(Game.cpu.getUsed()-t)
        _.keys(structMap).forEach(e=>{
            structMap[e] = Utils.encodePosArray(structMap[e].map(t=>{return {x:t.x,y:t.y}}))
        })
        Memory.rooms[s.pos.roomName].structMap = structMap
        s.remove();
    },
    tryCreateCons(pos,struct){
        let room = Game.rooms[pos.roomName];
        if(room.constructionSite.length+(room._construct_builed||0)<10){
            let head = pos.lookFor(LOOK_STRUCTURES).filter(e=>e.structureType == struct).head()
            if(!head){
                room._construct_builed=(room._construct_builed||0)+1
                pos.createConstructionSite(struct)
            }
        }
    },
    tryCreateStructs(room,structMap,struct,structCnt=2500){
        structCnt = Math.min(structCnt,CONTROLLER_STRUCTURES[struct][room.level])
        if(structMap[struct]){
            let needBuild = false
            if(room[struct]&&room[struct].length>-1){ // 如果是数组类型
                if(structCnt>room[struct].length)needBuild=true
            }else if(!room[struct])needBuild=true //不是数组类型或者没建筑过
            if(needBuild){
                let str2Pos = Utils.decodePosArray(structMap[struct]);
                str2Pos.take(structCnt).forEach(e=>{pro.tryCreateCons(new RoomPosition(e.x,e.y,room.name),struct)})
            }
            // if(structCnt)
            // if(structMap[struct].length<structCnt)
        }
    },
    showRoomStructures  (roomName,structMap){
        let roomStructs = new RoomArray().init()
        const visual = new RoomVisual(roomName);
        if(structMap["road"])structMap["road"].forEach(e=>roomStructs.set(e.x,e.y,"road"))
        _.keys(CONTROLLER_STRUCTURES).forEach(struct=>{
            if(!structMap[struct])return;
            if(struct=="road"){
                structMap[struct].forEach(e=>{
                    roomStructs.forNear((x,y,val)=>{
                        if(val =="road"&&((e.x>=x&&e.y>=y)||(e.x>x&&e.y<y)))visual.line(x,y,e.x,e.y,{color:structuresColor[struct]})
                    },e.x,e.y);
                    visual.text(structuresShape[struct], e.x,e.y+0.25, {color: structuresColor[struct],opacity:0.75,font: 1})
                })
            }
            else structMap[struct].forEach(e=>visual.text(structuresShape[struct], e.x,e.y+0.25, {color: structuresColor[struct],opacity:0.75,font: 1}))
        })
    },
    tryAutoBuildLowLevel0 (room){
        if((Game.time+room.hashCode()) % 150 == 0  && Game.cpu.bucket>50 && room.memory.structMap){
            pro.tryCreateStructs(room,room.memory.structMap,STRUCTURE_SPAWN);
            pro.tryCreateStructs(room,room.memory.structMap,STRUCTURE_EXTENSION);
            // room.memory.structMap[STRUCTURE_SPAWN].take(1).forEach(e=>{pro.tryCreateCons(new RoomPosition(e[0],e[1],room.name),STRUCTURE_SPAWN)})
            // room.memory.structMap[STRUCTURE_EXTENSION].take(10).forEach(e=>{pro.tryCreateCons(new RoomPosition(e[0],e[1],room.name),STRUCTURE_EXTENSION)})
        }
    },
    tryAutoBuildLowLevel800 (room){
        if((Game.time+room.hashCode()) % 150 == 0 && Game.cpu.bucket>50 && room.memory.structMap){
            // 开始建 road 和 container
            pro.tryCreateStructs(room,room.memory.structMap,STRUCTURE_EXTENSION);
            pro.tryCreateStructs(room,room.memory.structMap,STRUCTURE_CONTAINER,3);
            pro.tryCreateStructs(room,room.memory.structMap,STRUCTURE_TOWER);
            if(room.extension&&room.extension.length>=20)
                pro.tryCreateStructs(room,room.memory.structMap,STRUCTURE_STORAGE);
                // room.memory.structMap[STRUCTURE_STORAGE].take(1).forEach(e=>{pro.tryCreateCons(new RoomPosition(e[0],e[1],room.name),STRUCTURE_STORAGE)})
            pro.tryCreateStructs(room,room.memory.structMap,STRUCTURE_ROAD);
        }
    },
    tryAutoBuildHighLevel (room){
        if((Game.time+room.hashCode()) % 600 == 0 && Game.cpu.bucket>500&&room.memory.structMap){ // 4级后600tick更新一次
            // 开始建 road 和 container
            _.keys(CONTROLLER_STRUCTURES).forEach(struct=>{
                if(struct == STRUCTURE_RAMPART || struct == STRUCTURE_WALL)return;
                pro.tryCreateStructs(room,room.memory.structMap,struct);
                // room.memory.structMap[struct].take(CONTROLLER_STRUCTURES[struct][room.level]).forEach(e=>{
                //     let pos = new RoomPosition(e[0],e[1],room.name);
                //     let head = pos.lookFor(LOOK_STRUCTURES).filter(e=>e.structureType == struct).head()
                //     if(!head)pos.createConstructionSite(struct)
                // })
            })
        }
    },
    exec (){
        pro.computeAnyRoom();
        pro.saveStructMap();
        pro.showRoom();
    },
    showRoom (){
        let show = Game.flags.showBlueprint;
        if(show){
            if(Memory.rooms[show.pos.roomName].structMap)
                HelperVisual.showRoomStructures(show.pos.roomName,Memory.rooms[show.pos.roomName].structMap)
        }
    },
    getBlocked(){
        let roomArray = null;
        if (ManagerFlags.getFlagsByPrefix("block").length) {
            roomArray = new RoomArray().init()
            ManagerFlags.getFlagsByPrefix("block").forEach(f=>{
                let size = parseInt(f.name.split("_")[1]||1)
                roomArray.set(f.pos.x,f.pos.y,TERRAIN_MASK_WALL)
                roomArray.forNear((x,y)=>{
                    roomArray.set(x,y,TERRAIN_MASK_WALL)
                },f.pos.x,f.pos.y,size)
            })
            roomArray.forEach((x,y,val)=>{
                if(val) HelperVisual.showText(Game.flags.pa.pos.roomName,"*",{x:x,y:y})
            })
        }
        return roomArray;
    },
    computeAnyRoom (){
        let blocked = pro.getBlocked();
        let p = Game.flags.autoBlueprint;
        if(!p)return;
        if(Game.cpu.bucket<300)return;
        if(Game.rooms[p.pos.roomName]&&Game.rooms[p.pos.roomName].controller){
            pro.computeRoom(p)
            p.remove()
            return;
        }
        let pa = Game.flags.pa;
        let pb = Game.flags.pb;
        let pc = Game.flags.pc;
        let pm = Game.flags.pm;
        if(p&&pa&&pc&&pm) {
            let roomStructsData = ManagerPlanner.computeManor(p.pos.roomName,[pc,pm,pa,pb],blocked)
            if(roomStructsData){
                Memory.rooms[roomStructsData.roomName]=Memory.rooms[roomStructsData.roomName]||{}
                _.keys(roomStructsData.structMap).forEach(e=>{
                    roomStructsData.structMap[e] = Utils.encodePosArray(roomStructsData.structMap[e].map(t=>{return {x:t[0],y:t[1]}}))
                })
                Memory.rooms[roomStructsData.roomName].structMap = roomStructsData.structMap
            }else console.log("storagePos 位置不合适")
            p.remove()
        }
    },
    computeRoom (roomObject){
        if(Game.cpu.bucket<300)return;
        let points = []
        points = points.concat([roomObject.room.controller.pos])
        points = points.concat([roomObject.room.find(FIND_MINERALS)[0].pos])
        points = points.concat(roomObject.room.find(FIND_SOURCES).map(e=>e.pos))
        points = points.map(e=>{return {pos:new RoomPosition(e.x,e.y,roomObject.pos.roomName) }} )
        let roomStructsData = ManagerPlanner.computeManor(roomObject.pos.roomName,points)
        _.keys(roomStructsData.structMap).forEach(e=>{
            roomStructsData.structMap[e] = Utils.encodePosArray(roomStructsData.structMap[e].map(t=>{return {x:t[0],y:t[1]}}))
        })
        if(!Memory.rooms[roomObject.pos.roomName])Memory.rooms[roomObject.pos.roomName] = {}
        Memory.rooms[roomObject.pos.roomName].structMap = roomStructsData.structMap
    }
};
let ManagerFlags={
    globalFlags:[],
    init(){
        pro.globalFlags = []

        if(!Memory.flags)Memory.flags = {}
        for (let name in Memory.flags) {
            if (!Game.flags[name]) {
                delete Memory.flags[name];
            }
        }

        let flagRoomMap = {}

        for (let name in Game.flags) {
            let strLs = name.split("_");
            let prefix = strLs[0]
            let roomName = strLs.length>=1?strLs[1]:undefined
            let room = Game.rooms[roomName]

            if(room){
                flagRoomMap[roomName] = flagRoomMap[roomName]||[]
                flagRoomMap[roomName].push(Game.flags[name])
            }
            let nextPos = Game.flags[name].memory.nextPos;
            if (nextPos) {
                let rp = new RoomPosition(nextPos.x,nextPos.y,nextPos.roomName);
                if(Game.flags[name].pos.isEqualTo(rp))delete Game.flags[name].memory.nextPos;
                else Game.flags[name].setPosition(rp)

            }
        }

        for(let name in flagRoomMap){
            Game.rooms[name].setFlagList(flagRoomMap[name])
        }


    },
    getFlagsByPrefix (prefix){
        if(!Game._flagPerfixMap){
            let map = Game._flagPerfixMap = {}
            _.values(Game.flags).forEach(flag=>{
                
                    let strLs = flag.name.split("_");
                    let p = strLs.length>=1?strLs[0]:strLs
                
                // let p = flag.getPrefix();
                if(map[p]) map[p].push(flag);
                else map[p] = [flag]
            })
        }
        return Game._flagPerfixMap[prefix]||[]
    }

};


global.ManagerAutoPlanner = pro;