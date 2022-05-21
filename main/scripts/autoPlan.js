module.exports={
    run(){
        let center = Game.flags.center;
        if(center){
            autoPlan(center.pos)
            // cal(center.pos)
        }
    }
}

function verify(x,y){
    return x>=0&&x<50&&y>=0&&y<50
}

/**
 * 
 * @param {RoomPosition} center 
 */
function autoPlan(center){
    // console.log('center')
    const terrain = new Room.Terrain(center.roomName)

    let part = [
        [1,0,0,0],
        [0,1,0,1],
        [0,0,1,0],
        [0,1,0,1],
    ]
    let roomCost = new RoomArray()
    let centerPath = new RoomArray()
    let centerPathRoad = new RoomArray()
    let structMap = new RoomArray()

    
    roomCost.initRoomTerrain(center.roomName)
    centerPath.init()
    centerPathRoad.init()
    structMap.init()

    roomCost.forBorder((x,y,val)=>{
        if(terrain.get(x,y) == 0){
            roomCost.forNear((x,y,val)=>{
                roomCost.set(x,y,0xff)
            },x,y)
        }
    })

    
    
    structMap.forEach((x,y,val)=>{
        if(part[(x+center.x)%4][(y+center.y)%4] == 1 
        && roomCost.get(x,y) != 0xff){
            structMap.set(x,y,1)
        }
    })

    

    // 计算按目前的路径，距离中心的距离
    let updateCenterPathRoad = function(x,y,val){
        let _que = [[x,y,val]]
        centerPathRoad.set(x,y,val)
        while(_que.length){
            let top = _que.shift()
            centerPathRoad.forNear((x,y,val)=>{
                if((val == 0 || val > top[2]+1) && roomCost.get(x,y) != 0xff && structMap.get(x,y)==1){
                    _que.push([x,y,top[2]+1])
                    centerPathRoad.set(x,y,top[2]+1)
                }
            },top[0],top[1])
        }
    }

    updateCenterPathRoad(center.x,center.y,1)

    // 计算按默认地形到达中心点的路程
    let que = [[center.x,center.y,1]]
    centerPath.set(center.x,center.y,1)
    while(que.length){
        let top = que.shift()
        let x = top[0]
        let y = top[1]
        // 如果默认地形和目前路径计算结果相差太大，或者不可达，就新建路径
        if(structMap.get(x,y)==1&&(centerPathRoad.get(x,y)==0||centerPathRoad.get(x,y)-centerPath.get(x,y)>3)){
            console.log(x,y,centerPath.get(x,y),centerPathRoad.get(x,y))
            // done = true;
            let ret = PathFinder.search(
                center, new RoomPosition(x,y,center.roomName),
                {
            
                  roomCallback: function(roomName) {
                    let costs = new PathFinder.CostMatrix;
                    roomCost.forEach((x,y,val)=>{
                        if(structMap.get(x,y) == 1)costs.set(x,y,1)
                        else costs.set(x,y,val)
                    })
                    return costs;
                  },
                  maxRooms:1
                }
            );
            ret.path.forEach(pos=>{
                if(structMap.get(pos.x,pos.y)==0){
                    
                    let minRoadLength = 10000
                    centerPathRoad.forNear((x,y,val)=>{
                        if(val > 0 && val < minRoadLength && structMap.get(x,y)==1){
                            minRoadLength = val;
                        }
                    },pos.x,pos.y)
                    updateCenterPathRoad(pos.x,pos.y,minRoadLength+1)
                    structMap.set(pos.x,pos.y,1)
                    new RoomVisual(center.roomName).text(
                        minRoadLength+1,
                        pos,
                        {
                            font:0.4,
                            color:"#f0f"
                        }
                    )
                }
            })
        }
        

        centerPath.forNear((x,y,val)=>{
            if(val == 0 && roomCost.get(x,y) != 0xff){
                que.push([x,y,top[2]+1])
                centerPath.set(x,y,top[2]+1)
            }
        },top[0],top[1])
    }

    // let done = false
    // structMap.forEach((x,y,val)=>{
    //     if(done)return;
    //     if(val == 1 &&(centerPathRoad.get(x,y)==0||centerPath.get(x,y)-centerPathRoad.get(x,y)>4)){
            
    //         // done = true;
    //         let ret = PathFinder.search(
    //             center, new RoomPosition(x,y,center.roomName),
    //             {
            
    //               roomCallback: function(roomName) {
    //                 let costs = new PathFinder.CostMatrix;
    //                 roomCost.forEach((x,y,val)=>{
    //                     if(structMap.get(x,y) == 1)costs.set(x,y,1)
    //                     else costs.set(x,y,val)
    //                 })
    //                 return costs;
    //               },
    //               maxRooms:1
    //             }
    //         );
    //         ret.path.forEach(pos=>{
    //             if(structMap.get(pos.x,pos.y)==0){
                    
    //                 let minRoadLength = 10000
    //                 centerPathRoad.forNear((x,y,val)=>{
    //                     if(val > 0 && val < minRoadLength && structMap.get(x,y)==1){
    //                         console.log(pos.x,pos.y,x,y,val)
    //                         minRoadLength = val;
    //                     }
    //                 },pos.x,pos.y)
    //                 updateCenterPathRoad(pos.x,pos.y,minRoadLength+1)

    //                 new RoomVisual(center.roomName).text(
    //                     minRoadLength+1,
    //                     pos,
    //                     {
    //                         font:0.4,
    //                         color:"#f0f"
    //                     }
    //                 )
    //             }
    //         })
    //     }
    // })
    
    

    structMap.forEach((x,y,val)=>{
        if(val == 1){
            structMap.forNear((x,y,val)=>{
                if(val == 0 && roomCost.get(x,y) != 0xff){
                    structMap.set(x,y,2) 
                }
            },x,y)
        }
    })


    let cnt = {}
    structMap.forEach((x,y,val)=>{
        if(val){
            let val = structMap.get(x,y)
            if(val == 1){
                let a = centerPathRoad.get(x,y)
                let b = centerPath.get(x,y)
                new RoomVisual(center.roomName).text(
                    a,x,y+0.2,
                    {
                        font:0.4,
                        color:val==1?"#f00":0
                    }
                )
                new RoomVisual(center.roomName).text(
                    b,x,y-0.2,
                    {
                        font:0.4,
                        color:val==1?"#ff0":0
                    }
                )
            }else{
                new RoomVisual(center.roomName).text(
                    0,x,y,
                    {
                        font:0.5,
                        color:0
                    }
                )
            }
            if(!cnt[val])cnt[val] = 0;
            cnt[val]++;
        }
    })
    
    for(let type in cnt){
        console.log(type,":",cnt[type])
    }
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
        for(let i=-range;i<=range;i++){
            let j = range;
            let xt=x+i
            let yt=y+j
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