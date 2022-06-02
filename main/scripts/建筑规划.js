/********************************
author：ChenyangDu
version:1.1

自动布局
【功能】：选定中心位置，自动规划房内布局
【使用方法】：不必获取视野，传入中心点和房间内的控制器、字母矿、能量矿的位置即可（推荐插旗）
1、放置5个旗子，分别对应房间的中心位置(center)、房间的控制器(pc)、
    房间的字母矿(pm)、房间的能量矿(pa、[pb])，pb没有就不放
2、运行以下代码即可

let center = Game.flags.center; // 房间中心的位置
let pa = Game.flags.pa;
let pb = Game.flags.pb;
let pc = Game.flags.pc;
let pm = Game.flags.pm;
if(center) {
    let points = [pc.pos,pm.pos,pa.pos]
    if(pb)points.push(pb.pos)
    require('./建筑规划').run(center.pos,points)
}

【返回结果】:
// 所有位置都用[x,y]表示
{
    structMap, //一个字典，key是建筑名称，val是建筑位置的数组
    roadLength, //一个数组，不同等级路的长度，第0个元素是0
    containers, //一个位置数组，对应[pc,pm,pa,pb]所对应的container
    links, //一个位置数组，对应[pa,pb,中央link]所对应的link
}

【说明】:
1、消耗CPU大概20个左右
2、控制器的container周围3*3区域默认为upgrader区域，不放置建筑，会尽量避免寻路走这里
3、lab的位置会优先选择4*4离中心最远的地方（为了防止一颗核弹同时打lab和中心）
   找不到会选择3*5或者5*3等方案
4、塔位置是随机选了6个rampart然后找最近的
5、link在5级的时候会先造中间的link，然后造离得远的那个
6、中心点尽量往中间选，靠近边界可能出bug
7、先这样吧。。。。虽然有bug但凑活能用了

********************************/

let cache = {}

module.exports={
    /**
     * @param {RoomPosition} centerpos 房间布局的中心位置
     * @param {RoomPosition[]} points 房间中控制器、字母矿、能量矿的数组
     * @returns 
     */
    run(centerpos,points){
        let name = centerpos.x+'_'+centerpos.y+'_'+centerpos.roomName
        let ret
        if(cache[name]){
            ret = cache[name]
        }else{
            cache[name] = ret = autoPlan(centerpos,points)
        }
        // 可视化，不看就关了

        // 以下方法可以按等级标记
        for(let level = 1;level <= 8;level ++){
            for(let type in CONTROLLER_STRUCTURES){
                let lim = CONTROLLER_STRUCTURES[type]
                if(type == 'road')lim = ret.roadLength
                for(let i = lim[level-1];i<Math.min(ret.structMap[type].length,lim[level]);i++){
                    let e = ret.structMap[type][i]
                    new RoomVisual(centerpos.roomName).text(level,e[0]+0.3,e[1]+0.5,{font:0.4,opacity:0.8})
                }
                if(type == 'container'){
                    for(let i = 0;i<ret.containers.length;i++){
                        let e = ret.containers[i]
                        if((level == 1 && i != 1) || (level == 6 && i == 1)){
                            new RoomVisual(centerpos.roomName).text(level,e[0]+0.3,e[1]+0.5,{font:0.4,opacity:0.8})
                        }
                    }
                    
                }
            }
        }
        // 渲染建筑
        showRoomStructures(centerpos.roomName,ret.structMap)
        return ret
    }
}

/**
 * 
 * @param {RoomPosition} center 
 * @param {RoomPosition[]} points 房间中控制器、字母矿、能量矿的数组
 */
function autoPlan(center,points){
    let cpu = Game.cpu.getUsed();
    const terrain = new Room.Terrain(center.roomName)

    let part = [
        // 弃用的一种布局模式，虽然也能凑活用
        // [1,0,0,0,0,1],
        // [0,1,0,0,1,0],
        // [0,0,1,1,0,0],
        // [0,0,1,1,0,0],
        // [0,1,0,0,1,0],
        // [1,0,0,0,0,1],
        [1,0,0,0],
        [0,1,0,1],
        [0,0,1,0],
        [0,1,0,1],
    ]
    let structMap = {}
    _.keys(CONTROLLER_STRUCTURES).forEach(e=>structMap[e] = [])

    let roomCost = new RoomArray()
    let centerPath = new RoomArray()
    let centerPathRoad = new RoomArray()
    let roadMap = new RoomArray()

    roomCost.initRoomTerrain(center.roomName)
    centerPath.init()
    centerPathRoad.init()
    roadMap.init()

    // 边界不能放
    roomCost.forBorder((x,y,val)=>{
        if(terrain.get(x,y) == 0){
            roomCost.forNear((x,y,val)=>{
                roomCost.set(x,y,0xff)
            },x,y,1)
        }
    })
    // 放ramp
    roomCost.forBorder((x,y,val)=>{
        if(terrain.get(x,y) == 0){
            roomCost.forRange((x,y,val)=>{
                if(val != 0xff){
                    structMap[STRUCTURE_RAMPART].push([x,y])
                    roomCost.set(x,y,0xff)
                }
            },x,y,2)
        }
    })
    // 边界不能放
    roomCost.forBorder((x,y,val)=>{
        if(terrain.get(x,y) == 0){
            roomCost.forNear((x,y,val)=>{
                if(val != 0xff){
                    roomCost.set(x,y,100)
                }
            },x,y,4)
        }
    })


    // 处理矿点和控制器[控制器、字母矿、矿a、(矿b)]
    {
        let costs = new PathFinder.CostMatrix;
        roomCost.forEach((x,y,val)=>{costs.set(x,y,val)})
        
        if(points.length > 0){
            let max_cnt = 0 // 周围的空地数量
        
            let containerPoses = []
    
            roomCost.forRange((_x,_y,val)=>{
                if(val == 0xff)return
                let pos = new RoomPosition(_x,_y,center.roomName)
                
                let cnt = 0
                roomCost.forNear((x,y,val)=>{
                    if(val!=0xff){
                        cnt++
                    }
                },pos.x,pos.y)
                if(cnt > max_cnt){
                    containerPoses = []
                    containerPoses.push(pos)
                    max_cnt = cnt
                }else if(cnt == max_cnt){
                    containerPoses.push(pos)
                }
                
            },points[0].x,points[0].y,2)
            
            containerPoses.forEach(pos=>{
                let ret = PathFinder.search(
                    pos, {pos:center,range:2},
                    {
                        roomCallback:()=>costs,
                        maxRooms:1
                    }
                )
                containerPoses.pathlen = ret.path.length
            })
            containerPoses.sort(a=>a.pathlen)
            let containerPos = _.head(containerPoses)
            
            if(containerPos){
                structMap[STRUCTURE_CONTAINER].push([containerPos.x,containerPos.y])
                roomCost.set(containerPos.x,containerPos.y,0xff)
                costs.set(containerPos.x,containerPos.y,0xff)
                roomCost.forNear((x,y,val)=>{
                    roomCost.set(x,y,90)
                    costs.set(x,y,90)
                },containerPos.x,containerPos.y)
            }
        }
        for(let i=1;i<points.length;i++){
            let x,y
            [x,y] = [points[i].x,points[i].y]
            let ret = PathFinder.search(
                new RoomPosition(x,y,center.roomName), {pos:center,range:1},
                {
                    roomCallback:()=>costs,
                    maxRooms:1
                }
            )
            let path = ret.path;
            if(path.length){
                let pos = path[0]
                structMap[STRUCTURE_CONTAINER].push([pos.x,pos.y])
                roomCost.set(pos.x,pos.y,0xff)
                costs.set(pos.x,pos.y,0xff)

                if(i>1){
                    let linkPoses = []
                    roomCost.forNear((x,y,val)=>{
                        if(val < 0xff)linkPoses.push([x,y])
                    },pos.x,pos.y)
                    let linkpos = null
                    let minRange = 50
                    linkPoses.forEach(e=>{
                        let range = getRange(e,[center.x,center.y])
                        if(range < minRange){
                            minRange = range
                            linkpos = e
                        }
                        if(range == minRange && e[0]!=pos.x&&e[1]!=pos.y){ // 尽可能对角排列不堵路
                            linkpos = e
                        }
                    })
                    
                    if(linkpos){
                        structMap[STRUCTURE_LINK].push(linkpos)
                        roomCost.set(linkpos[0],linkpos[1],0xff)
                        costs.set(linkpos[0],linkpos[1],0xff)

                    }
                }
            }else{
                console.log("no path")
            }
            
        }
    }
    

    roadMap.forEach((x,y,val)=>{
        if(part[(x-center.x+50)%part.length][(y-center.y+50)%part[0].length] == 1 
        && roomCost.get(x,y) < 90){
            roadMap.set(x,y,1)
        }
    })

    // 计算按目前的路径，距离中心的距离
    let updateCenterPathRoad = function(x,y,val,onlyroad = true){
        let _que = [[x,y,val]]
        centerPathRoad.set(x,y,val)
        while(_que.length){
            let top = _que.shift()
            centerPathRoad.forNear((x,y,val)=>{
                if((val == 0 || val > top[2]+1) && roomCost.get(x,y) != 0xff &&
                 (!onlyroad || roadMap.get(x,y)==1)){
                    _que.push([x,y,top[2]+1])
                    centerPathRoad.set(x,y,top[2]+1)
                }
            },top[0],top[1])
        }
    }

    updateCenterPathRoad(center.x,center.y,1)

    let que_border4 = []
    // 计算按默认地形到达中心点的路程
    let que = [[center.x,center.y,1]]
    centerPath.set(center.x,center.y,1)
    while(que.length){
        let top = que.shift()
        let x = top[0]
        let y = top[1]
        // 如果默认地形和目前路径计算结果相差太大，或者不可达，就新建路径
        
        if(roadMap.get(x,y)==1&&(centerPathRoad.get(x,y)==0||centerPathRoad.get(x,y)-centerPath.get(x,y)>4)){
            
            let ret = PathFinder.search(
                center, new RoomPosition(x,y,center.roomName),
                {
                  roomCallback: function(roomName) {
                    let costs = new PathFinder.CostMatrix;
                    roomCost.forEach((x,y,val)=>{
                        if(roadMap.get(x,y) == 1)costs.set(x,y,1)
                        else costs.set(x,y,val)
                    })
                    return costs;
                  },
                  maxRooms:1
                }
            );
            ret.path.forEach(pos=>{
                if(roadMap.get(pos.x,pos.y)==0){
                    
                    let minRoadLength = 10000
                    centerPathRoad.forNear((x,y,val)=>{
                        if(val > 0 && val < minRoadLength && roadMap.get(x,y)==1){
                            minRoadLength = val;
                        }
                    },pos.x,pos.y)
                    updateCenterPathRoad(pos.x,pos.y,minRoadLength+1)
                    roadMap.set(pos.x,pos.y,1)
                    // new RoomVisual(center.roomName).text(
                    //     minRoadLength+1,
                    //     pos,
                    //     {
                    //         font:0.4,
                    //         color:"#ff0"
                    //     }
                    // )
                }
            })
        }
        
        // 如果靠近边界就放入队列，为之后删除多余ramp做准备
        if(x==5||x==44||y==5||y==44){
            que_border4.push(top)
        }

        centerPath.forNear((x,y,val)=>{
            if(val == 0 && roomCost.get(x,y) < 100){
                que.push([x,y,top[2]+1])
                centerPath.set(x,y,top[2]+1)
            }
        },x,y)
    }

    // 删除多余的ramp
    while(que_border4.length){
        let top = que_border4.shift()
        let x = top[0]
        let y = top[1]
        centerPath.forNear((x,y,val)=>{
            if(val == 0 && roomCost.get(x,y) != 0xff){
                que_border4.push([x,y,top[2]+1])
                centerPath.set(x,y,top[2]+1)
            }
        },x,y)
    }

    for(let i=0;i<structMap[STRUCTURE_RAMPART].length;i++){
        let ramp = structMap[STRUCTURE_RAMPART][i]
        let use = false
        centerPath.forNear((x,y,val)=>{
            if( val)use = true
            // if()
        },ramp[0],ramp[1])
        if(!use){
            structMap[STRUCTURE_RAMPART].splice(i,1)
            i--;
        }
    }

    // roomCost.forEach((x,y,val)=>{
    //     new RoomVisual(center.roomName).text(
    //         val,x,y,{
    //             font:0.5,
    //             opacity:0.5
    //         }
    //     )
    // })

    centerPathRoad.init()
    {
        // 计算哪些点适合放建筑
        let structCnt = 0;
        let roadque = [[center.x,center.y,1]]// 路的队列
        let structque = []// 建筑的队列
        let visited = new RoomArray()
        visited.init()
        // 用两个队列，先处理建筑的，并且建筑一加到队列中，就立即在地图上标记，
        // 路反过来，等从队列中取出，需要扩展的时候才加入地图
        centerPathRoad.set(center.x,center.y,1)
        visited.set(center.x,center.y,1)
        while((roadque.length || structque.length) && structCnt < 86){
            let top,x,y;
            top = structque.length?structque.shift():roadque.shift()
            x = top[0]
            y = top[1]
            
            if(roadMap.get(x,y) == 1){
                centerPathRoad.set(x,y,top[2])
                centerPathRoad.forNear((x,y,val)=>{
                    if((val == 0 || val > top[2]+1) && roomCost.get(x,y) < 100
                         && visited.get(x,y) == 0){
                        if(roadMap.get(x,y) == 1){
                            roadque.push([x,y,top[2]+1])
                            visited.set(x,y,1)
                        }
                        else{
                            if(structCnt < 86 && roomCost.get(x,y) < 90){
                                structque.push([x,y,top[2]+1])
                                visited.set(x,y,1)
                                structCnt++
                                roadMap.set(x,y,2)
                                centerPathRoad.set(x,y,top[2]+1)
                            }
                        }
                    }
                },x,y)
            }
        }
    }

    // 删除不挨着的
    roadMap.forEach((x,y,val)=>{
        if(centerPathRoad.get(x,y)==0)roadMap.set(x,y,0)
    })
    // console.log(Game.cpu.getUsed()-cpu)

    // 处理tower
    {
        // 随机选6个ramp，选择最近的建筑，如果距离在20以上就作废
        let seed = 1
        while(structMap[STRUCTURE_TOWER].length<6){
            const len = structMap[STRUCTURE_RAMPART].length
            let ramp = structMap[STRUCTURE_RAMPART][(547*seed)%len]
            let towerPos = null
            let min_range = 50
            roadMap.forEach((x,y,val)=>{
                if(val == 2){
                    let range = getRange(ramp,[x,y])
                    if(range < min_range){
                        min_range = range
                        towerPos = [x,y]
                    }
                }
            })
            if(towerPos && (min_range < 20 || seed > 20)){
                structMap[STRUCTURE_TOWER].push(towerPos)
                roadMap.set(towerPos[0],towerPos[1],3)
                // new RoomVisual(center.roomName).line(
                //     towerPos[0],towerPos[1],ramp[0],ramp[1],{
                //         color:'#f00'
                //     }
                // )
            }
            seed++
        }
    }

    // 处理lab
    let labCenter = null
    {
        let sumExt = new RoomArray()
        sumExt.init()
        roadMap.forEach((x,y,val)=>{
            if(x && y){
                sumExt.set(x,y,((val===2)?1:0)+sumExt.get(x,y-1)+sumExt.get(x-1,y)-sumExt.get(x-1,y-1))
            }
        })
        let getlab = function(len_x,len_y){
            let labPos = null
            let max_range = 0;
            sumExt.forEach((x,y,val)=>{
                let xt = x-len_x
                let yt = y-len_y
                if(verify(xt,yt) && sumExt.get(x,y) - sumExt.get(xt,y)-sumExt.get(x,yt)+sumExt.get(xt,yt) >=10){
                    let range = getRange([x-(len_x-1)/2,y-(len_y-1)/2],[center.x,center.y])
                    if(range > max_range){
                        max_range = range
                        labPos = {x,y}
                    }
                }
            })
            if(labPos){
                for(let x = labPos.x-len_x+1;x<=labPos.x;x++)
                for(let y = labPos.y-len_y+1;y<=labPos.y;y++){
                    if(roadMap.get(x,y)==2){
                        roadMap.set(x,y,3)
                        structMap[STRUCTURE_LAB].push([x,y])
                    }
                }
                labCenter = [labPos.x-(len_x-1)/2,labPos.y-(len_y-1)/2]
                return true
            }
            return false
        }
        // lab的三种方案，可以证明一定存在两个lab到达其他lab的距离在2以内
        getlab(4,4)||getlab(3,5)||getlab(5,3)
        
    }
    
    // 处理nuker observe
    {
        let cache = [[0,0,0],[0,0,0]]
        roadMap.forEach((x,y,val)=>{
            if(val==2){
                if(centerPath.get(x,y) > cache[1][2]){
                    cache[1] = [x,y,centerPath.get(x,y)]
                }
                
                if(cache[1][2] > cache[0][2]){
                    [cache[0],cache[1]] = [cache[1],cache[0]]
                }
            }
        })
        structMap[STRUCTURE_OBSERVER].push([cache[0][0],cache[0][1]])
        structMap[STRUCTURE_NUKER].push([cache[1][0],cache[1][1]])
        roadMap.set(cache[0][0],cache[0][1],3)
        roadMap.set(cache[1][0],cache[1][1],3)
    }

    // 处理中央集群
    {
        let structures = ['link','storage','terminal','factory','powerSpawn','spawn','spawn','spawn']
        let range = 1;
        while(structures.length){
            let put = function(incenter){
                roadMap.forRange((x,y,val)=>{
                    if(val == 2 && structures.length &&
                        (!incenter || (x==center.x || y==center.y))){
                        let type = structures.shift()
                        structMap[type].push([x,y])
                        roadMap.set(x,y,3)
                    }
                },center.x,center.y,range)
            }
            put(true)
            put(false)
            

            range++;
        }
    }

    // 处理extension
    structMap['road'] = []
    structMap[STRUCTURE_EXTENSION] = []
    roadMap.forEach((x,y,val)=>{
        if(val == 1)structMap['road'].push([x,y])
        if(val == 2)structMap[STRUCTURE_EXTENSION].push([x,y])
    })

    // 记录container、link原来对应的位置
    let containers = [],links = []
    structMap['container'].forEach(p=>containers.push(p))
    structMap['link'].forEach(p=>links.push(p))
    
    // 连接矿/控制器
    {
        let costs = new PathFinder.CostMatrix;
        let terrain = new Room.Terrain(center.roomName);
        roadMap.forEach((x,y,val)=>{
            let te = terrain.get(x,y)
            costs.set(x,y,te==TERRAIN_MASK_WALL?255:(te==TERRAIN_MASK_SWAMP?4:2))
        })
        for(let struct of OBSTACLE_OBJECT_TYPES){
            if(structMap[struct]){
                structMap[struct].forEach(e=>{
                    costs.set(e[0],e[1],0xff)
                })
            }
        }
        // 控制器周围的消耗提高
        if(structMap["container"].length>0){
            roadMap.forNear((x,y,val)=>{
                costs.set(x,y,10)
            },structMap["container"][0][0],structMap["container"][0][1])
        }
        
        structMap["road"].forEach(e=>{
            costs.set(e[0],e[1],1)
        })
        
        structMap["container"].sort((a,b)=>getRange(a,[center.x,center.y])-getRange(b,[center.x,center.y]))
        structMap["container"].forEach(e=>{
            let ret = PathFinder.search(
                center,
                {pos:new RoomPosition(e[0],e[1],center.roomName),range:1}, 
                {
                    roomCallback:()=>{return costs},
                    maxRooms:1
                }
            )
            let lastCenterLength
            ret.path.forEach(pos=>{
                if(costs.get(pos.x,pos.y) != 1){
                    structMap['road'].push([pos.x,pos.y])
                    costs.set(pos.x,pos.y,1)
                }else{
                    // new RoomVisual(center.roomName).text('D'+centerPathRoad.get(pos.x,pos.y),pos.x,pos.y,{color:'red'})
                    // updateCenterPathRoad(pos.x,pos.y,centerPathRoad.get(pos.x,pos.y))
                }
                if(centerPathRoad.get(pos.x,pos.y) != 0){
                    lastCenterLength = centerPathRoad.get(pos.x,pos.y)
                }else{
                    lastCenterLength ++
                    centerPathRoad.set(pos.x,pos.y,lastCenterLength)
                    roadMap.set(pos.x,pos.y,1)
                }
            })
            centerPathRoad.set(e[0],e[1],lastCenterLength+1)
            roadMap.set(e[0],e[1],2)
        })
    }

    
    // 删除多余的建筑
    for(let type in structMap){
        if(type == 'lab'){
            structMap[type].sort((a,b)=>getRange(a,labCenter)-getRange(b,labCenter))
        }else if(type == 'link'){
            structMap[type].sort((a,b)=>getRange(a,[center.x,center.y])-getRange(b,[center.x,center.y]))
            if(structMap[type].length == 3){
                [structMap[type][2],structMap[type][1]] = [structMap[type][1],structMap[type][2]]
            }
        }else
        {
            structMap[type].sort((a,b)=>centerPathRoad.get(a[0],a[1])-centerPathRoad.get(b[0],b[1]))
        }
    }
    let roads = {}
    for(let level = 8;level > 0;level --){
        roads[level] = []
        for(let type in structMap){
            let length = Math.min(structMap[type].length,CONTROLLER_STRUCTURES[type][level])
            structMap[type].slice(length).forEach(e=>{
                roadMap.set(e[0],e[1],0)
            })
            
            // if(level >= Game.time % 8)
            //     structMap[type] = structMap[type].slice(0,length)
        }
        if(level == 5 && containers.length >= 2){ // 删掉miner周围的container
            roadMap.set(containers[1][0],containers[1][1],0)
        }
        for(let i = structMap['road'].length-1;i>=0;i--){
            let x = structMap['road'][i][0]
            let y = structMap['road'][i][1]
            let val = centerPathRoad.get(x,y)
            // 周围有其他建筑或路径且只能通过本路到达则标记有用
            let need = false
            centerPathRoad.forNear((_x,_y,_val)=>{
                if(!need && _val == val+1 && roadMap.get(_x,_y) > 0){ // 路径或建筑
                    need = true
                    centerPathRoad.forNear((__x,__y,__val)=>{
                        if(need && (__x != x || __y != y) && __val == val 
                        && roadMap.get(__x,__y) == 1)need = false
                    },_x,_y)
                }
            },x,y)
            if(!need){
                roadMap.set(x,y,0)
                let re = structMap['road'].splice(i,1)
                if(level < 8){
                    roads[level + 1].push(re[0])
                }
            }
        }
    }
    let roadLength = [0,structMap['road'].length]
    for(let level = 2;level <= 8;level ++){
        if(roads[level].length)
            structMap['road'] = structMap['road'].concat(roads[level])
        roadLength.push(structMap['road'].length)
        // console.log(roadLength)
    }
    
    // let level = 1;
    // for(let i = 0;i<structMap['road'].length;i++){
    //     while(i >= roadLength[level])level ++
    //     let e = structMap['road'][i]
    //     new RoomVisual(center.roomName).text(level,e[0],e[1]+0.5,{font:0.5,opacity:0.5})
    // }
    

    // console.log(Game.cpu.getUsed()-cpu)
    return {structMap,roadLength,containers,links};

    // let cnt = {}
    // roadMap.forEach((x,y,val)=>{
    //     if(roadMap.get(x,y) == 1){
    //         let a = centerPathRoad.get(x,y)
    //         let b = centerPath.get(x,y)
    //         new RoomVisual(center.roomName).text(
    //             a,x,y+0.2,
    //             {
    //                 font:0.4,
    //                 color:"#f00"
    //             }
    //         )
    //         new RoomVisual(center.roomName).text(
    //             b,x,y-0.2,
    //             {
    //                 font:0.4,
    //                 color:"#00f"
    //             }
    //         )
    //     }else{
    //         new RoomVisual(center.roomName).text(
    //             centerPath.get(x,y),x,y,
    //             {
    //                 font:0.5,
    //                 color:val?"#0ff":0
    //             }
    //         )
    //     }
    //     if(!cnt[val])cnt[val] = 0;
    //     cnt[val]++;
    // })
    
    
}
// 可视化

const structuresShape= {
    "spawn": "◎",
    "extension": "ⓔ",
    "link": "◈",
    "road": "•",
    "constructedWall": "▓",
    "rampart": "⊙",
    "storage": "▤",
    "tower": "🔫",
    "observer": "👀",
    "powerSpawn": "❂",
    "extractor": "⇌",
    "terminal": "✡",
    "lab": "☢",
    "container": "□",
    "nuker": "▲",
    "factory": "☭"
}
const structuresColor= {
    "spawn": "cyan",
    "extension": "#0bb118",
    "link": "yellow",
    "road": "#fa6f6f",
    "constructedWall": "#003fff",
    "rampart": "#003fff",
    "storage": "yellow",
    "tower": "cyan",
    "observer": "yellow",
    "powerSpawn": "cyan",
    "extractor": "cyan",
    "terminal": "yellow",
    "lab": "#d500ff",
    "container": "yellow",
    "nuker": "cyan",
    "factory": "yellow"
}

function showRoomStructures(roomName,structMap){
    let roomStructs = new RoomArray().init()
    const visual = new RoomVisual(roomName);
    structMap["road"].forEach(e=>roomStructs.set(e[0],e[1],"road"))
    for(let struct in structMap){
        if(struct=="road"){
            structMap[struct].forEach(e=>{
                roomStructs.forNear((x,y,val)=>{
                    if(val =="road"&&((e[0]>=x&&e[1]>=y)||(e[0]>x&&e[1]<y)))visual.line(x,y,e[0],e[1],{color:structuresColor[struct]})
                },e[0],e[1]);
                visual.text(structuresShape[struct], e[0],e[1]+0.25, {color: structuresColor[struct],opacity:0.75,fontSize: 7})
            })
        }
        else structMap[struct].forEach(e=>visual.text(structuresShape[struct], e[0],e[1]+0.25, {color: structuresColor[struct],opacity:0.75,fontSize: 7}))
    }
}

let getRange=function(a,b){
    return Math.max(Math.abs(a[0]-b[0]),Math.abs(a[1]-b[1]))
}

// 房间数组类
function verify(x,y){
    return x>=0&&x<50&&y>=0&&y<50
}
let RoomArray_proto= {
    exec(x,y,val){
        let tmp = this.arr[x*50+y]
        this.set(x,y,val);
        return tmp
    },
    get(x,y){
        return this.arr[x*50+y];
    },
    set(x,y,value){
        this.arr[x*50+y]=value;
    },
    init(){
        if(!this.arr)
            this.arr = new Array(50*50)
        for(let i=0;i<2500;i++){
            this.arr[i]=0;
        }
        return this;
    },
    forEach(func){
        for(let y = 0; y < 50; y++) {
            for(let x = 0; x < 50; x++) {
                func(x,y,this.get(x,y))
            }
        }
    },
    for4Direction(func,x,y,range=1){
        for(let e of [[1,0],[-1,0],[0,1],[0,-1]]){
            let xt=x+e[0]
            let yt=y+e[1]
            if(verify(xt,yt))
                func(xt,yt,this.get(xt,yt))
        }
    },
    forNear(func,x,y,range=1){
        for(let i=-range;i<=range;i++){
            for(let j=-range;j<=range;j++){
                let xt=x+i
                let yt=y+j
                if((i||j)&&verify(xt,yt))
                    func(xt,yt,this.get(xt,yt))
            }
        }
    },
    forRange(func,x,y,range=1){
        let xt,yt
        for(let i=-range;i<=range;i++){
            let j = range;
            xt=x+i
            yt=y+j
            if(verify(xt,yt))
                func(xt,yt,this.get(xt,yt))
                
            j = -range;
            xt=x+i
            yt=y+j
            if(verify(xt,yt))
                func(xt,yt,this.get(xt,yt))
        }
        
        for(let j=-range+1;j<range;j++){
            let i = range;
            xt=x+i
            yt=y+j
            if(verify(xt,yt))
                func(xt,yt,this.get(xt,yt))
                
            i = -range;
            xt=x+i
            yt=y+j
            if(verify(xt,yt))
                func(xt,yt,this.get(xt,yt))
        }
    },
    forBorder(func,range=1){
        for(let y = 0; y < 50; y++) {
            func(0,y,this.get(0,y))
            func(49,y,this.get(49,y))
        }
        for(let x = 1; x < 49; x++) {
            func(x,0,this.get(x,0))
            func(x,49,this.get(x,49))
        }
    },
    initRoomTerrain(roomName){
        if(!this.arr)
            this.arr = new Array(50*50)
        let terrain = new Room.Terrain(roomName);
        this.forEach((x,y)=> {
            let v = terrain.get(x,y)
            this.set(x,y, v==TERRAIN_MASK_WALL?0xff:v==TERRAIN_MASK_SWAMP?4:2)
        })
    }
}
class RoomArray {
    constructor(){
        this.__proto__ = RoomArray_proto
    }
}