/**
 * 提供跨shard服务，需要跨shard的creep，把creep/room/shard的名字
 * 写到InterShardMemory当中的overminde列表中即可
 * 靠近目标从InterShardMemory中删掉即可
 */
let path_data = {
    
    "shard3_E21N41":[
        { shard: 'shard3', roomName: 'E30N40', x: 13, y: 5 }, 
        { shard: 'shard2', roomName: 'E30N40', x: 26, y: 6 }, 
        { shard: 'shard1', roomName: 'E30N40', x: 24, y: 44 },
        { shard: 'shard0', roomName: 'E50N71', x: 4, y: 48 }, 
        { shard: 'shard0', roomName: 'E40N70', x: 33, y: 27 },
        { shard: 'shard1', roomName: 'E20N40', x: 26, y: 43 },
        { shard: 'shard2', roomName: 'E20N40', x: 27, y: 19 },

        { shard: 'shard2', roomName: 'E40N30', x: 37, y: 18 },
        { shard: 'shard1', roomName: 'E40N30', x: 18, y: 22 },
        { shard: 'shard0', roomName: 'E70N51', x: 2, y: 48 },
        { shard: 'shard0', roomName: 'E30N50', x: 43, y: 16 },
        { shard: 'shard1', roomName: 'E20N40', x: 26, y: 43 },
        
        { shard: 'shard3', roomName: 'E21N41', x: 13, y: 5 }, 
        
    ],
    "shard2_E35N39":[
        { shard: 'shard2', roomName: 'E35N39', x: 19, y: 17 },
    ],
    "shard1_E13N41":[
        { shard: 'shard3', roomName: 'E20N40', x: 36, y: 12 },
        { shard: 'shard2', roomName: 'E20N40', x: 11, y: 18 },

        { shard: 'shard2', roomName: 'E30N40', x: 26, y: 6 },
        { shard: 'shard1', roomName: 'E30N40', x: 24, y: 44 },
        { shard: 'shard0', roomName: 'E50N71', x: 4, y: 48 },
        { shard: 'shard0', roomName: 'E40N70', x: 33, y: 27 },
        { shard: 'shard1', roomName: 'E13N41', x: 20, y: 28 },
    ]
}
let longmove = require("./longmove")

let shardMemory = require("shardMemory")

module.exports = {
    start(creepName,shardName,roomName){
        let data = shardMemory.get(Game.shard.name)
        if(!data.overshard)data.overshard = {}
        let memory = data.overshard
        
        memory[creepName] = shardName+'_'+roomName
        
        shardMemory.set(Game.shard.name,data);
    },
    stop(creepName){
        
        let data = shardMemory.get(Game.shard.name)
        if(!data.overshard)data.overshard = {}
        let memory = data.overshard
        
        if(memory[creepName] && memory[creepName] != 'deleted'){ // 说明是本shard要删掉
            delete memory[creepName]
        }else{
            memory[creepName] = 'deleted' // 提醒别的shard删掉这个
        }
        // console.log('stop',creepName,memory[creepName])
        
        shardMemory.set(Game.shard.name,data);
    },
    run(){
        let shardnames = ['shard3','shard2','shard1','shard0']
        // 清除多余的deleted标记
        if(Game.time % 5 == 0){
            let localdata = shardMemory.get(Game.shard.name)
            let memory = localdata.overshard || {}
            let modefied = false
            for(let creepName in memory){
                if(memory[creepName] == 'deleted'){
                    // console.log(creepName,'will deleted')
                    let need = false;
                    shardnames.forEach(shardname=>{
                        if(shardname != Game.shard.name){
                            let da = JSON.parse(InterShardMemory.getLocal() || "{}");
                            if(da.overshard && da.overshard[creepName] && da.overshard[creepName]!='deleted'){
                                need = true;
                            }
                        }
                    })
                    
                    // console.log(creepName,need)
                    if(!need){
                        delete memory[creepName]
                        modefied = true;
                    }else{
                        
                    }
                }
            }
            if(modefied)
                shardMemory.set(Game.shard.name,localdata);
        }
        


        
        let deletednames = [];
        let data
        shardnames.forEach(shardname=>{
            data = shardMemory.get(shardname)
            let memory = data.overshard || {}
            for(let creepName in memory){
                // console.log(shardname,creepName,memory[creepName])
                if(memory[creepName] != 'deleted'){
                    let paths = path_data[memory[creepName]]
                    let creep = Game.creeps[creepName]
                    // if(creep){
                    //     console.log(shardname,creepName,memory[creepName])
                    // }
                    if(creep && paths){
                        // console.log('over shard ',creep,paths)
                        let pos = this.shardmove(creep,paths)
                        if(pos){
                            if(pos.roomName == creep.room.name){
                                creep.moveTo(pos,{ignoreCreeps:false})
                            }else{
                                longmove.longMoveTo(creep,pos)
                            }
                        }
                    }
                }else{
                    
                    // console.log('delete ',creepName,memory[creepName],shardname,shardname != Game.shard.name)
                    if(shardname != Game.shard.name){//别的shard说这个要删掉
                        deletednames.push(creepName)
                        // console.log('delete ',creepName)
                    }else{ // 自己说要删掉
                        // delete memory[creepName]
                        // shardMemory.set(Game.shard.name,data);
                    }
                }
            }
        })

        data = shardMemory.get(Game.shard.name)
        deletednames.forEach(deletedname=>{
            // console.log('delete',deletedname)
            let memory = data.overshard || {}
            delete memory[deletedname]
            
        })
        shardMemory.set(Game.shard.name,data);

        
        
    },
    shardmove(creep,paths){
        paths = _.filter(paths,(o)=>(o.shard == Game.shard.name))
        let ret = null,minDis = 10000
        paths.forEach(o=>{
            let dis = Game.map.getRoomLinearDistance(creep.pos.roomName,o.roomName)
            if(dis <= minDis){
                minDis = dis
                ret = o
            }
        })
        // let ret = _.min(paths,(o)=>(Game.map.getRoomLinearDistance(creep.pos.roomName,o.roomName)))
        if(ret)return new RoomPosition(ret.x,ret.y,ret.roomName)
        else return null;
    }
}