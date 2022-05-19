/**
 * showRoomTowerDamage
 *
 */
global.structuresShape= {
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
    "extractor": "☸",
    "terminal": "✡",
    "lab": "☢",
    "container": "□",
    "nuker": "▲",
    "factory": "☭"
}
global.structuresColor= {
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
let pro={
    //线性同余随机数
    rnd ( seed ){
        return ( seed * 9301 + 49297 ) % 233280; //为何使用这三个数?
    },
    // seed 的随机颜色
    randomColor  (seed){
        seed = parseInt(seed)
        let str = "12334567890ABCDEF"
        let out = "#"
        for(let i=0;i<6;i++){
            seed = pro.rnd(seed+Game.time%100)
            out+=str[parseInt(seed)%str.length]
        }
        return out
    },
    roomMap:{},
    getRoomVisual (roomNameOrObj){
        let roomName = roomNameOrObj.name||roomNameOrObj
        if(!pro.roomMap[roomName]){
            pro.roomMap[roomName] = new RoomVisual(roomNameOrObj.name||roomNameOrObj)
        }
        return pro.roomMap[roomName]
    },
    // 大概消耗1 CPU！ 慎用！
    showRoomStructures  (roomName,structMap){
        let roomStructs = new RoomArray().init()
        const visual = new RoomVisual(roomName);
        if(structMap["road"])
            Utils.decodePosArray(structMap["road"]).forEach(e=>roomStructs.set(e.x,e.y,"road"))
        _.keys(CONTROLLER_STRUCTURES).forEach(struct=>{
            if(struct=="road"){
                Utils.decodePosArray(structMap[struct]).forEach(e=>{
                    roomStructs.forNear((x,y,val)=>{
                        if(val =="road"&&((e.x>=x&&e.y>=y)||(e.x>x&&e.y<y)))visual.line(x,y,e.x,e.y,{color:structuresColor[struct]})
                    },e.x,e.y);
                    visual.text(structuresShape[struct], e.x,e.y+0.25, {color: structuresColor[struct],opacity:0.75,font: 1})
                })
            }
            else Utils.decodePosArray(structMap[struct]).forEach(e=>visual.text(structuresShape[struct], e.x,e.y+0.25, {color: structuresColor[struct],opacity:0.75,font: 1}))
        })
    },
    exec (){
        pro.showRoomTowerDamage();
    },
    showRoomTowerDamage (){
        let flag = Game.flags.showRoomTowerDamage;
        if(flag){
            let visual = pro.getRoomVisual(flag.pos.roomName)
            let t = Game.cpu.getUsed();
            let font = 0.25
            WarCache.getTowerDamageRoomArray(flag.pos.roomName).forEach((x,y,val)=>{
                if(val>=3000)visual.text(val, x,y+0.35, {color: "cyan",opacity:0.25,font: font})
                else if(val>=2400)visual.text(val, x,y+0.35, {color: "pink",opacity:0.25,font: font})
                else if(val>=1800)visual.text(val, x,y+0.35, {color: "red",opacity:0.25,font: font})
                else if(val>=1200)visual.text(val, x,y+0.35, {color: "BlueViolet",opacity:0.25,font: font})
                // else visual.text("⊙", x,y+0.25, {color: "cyan",opacity:0.75,font: 1})
            })
            console.log("showRoomTowerDamage : cpuUsed  " + (Game.cpu.getUsed()-t))

            // let towers = flag.room.find(FIND_STRUCTURES,{filter:e=>e.structureType==STRUCTURE_TOWER})
            // for(let y = 0; y < 50; y+=1) {
            //     for(let x = 0; x < 50; x+=1) {
            //         let dists = towers.map(e=>WarDamageCal.calTowerDamage(Math.max(Math.abs(e.pos.x-x),Math.abs(e.pos.y-y))))
            //         visual.text(_.sum(dists)/10, x,y+0.25, {color: "red",opacity:0.75,font: 1})
            //     }
            // }
        }
    },
    showText (roomNameOrObj , text, objOrPos, color='red',font = 1) {
        if(roomNameOrObj.pos||roomNameOrObj.x!==undefined){
            if(roomNameOrObj.x===undefined)objOrPos = roomNameOrObj.pos
            else objOrPos = roomNameOrObj
            roomNameOrObj= objOrPos.roomName
        }
        let visual = pro.getRoomVisual(roomNameOrObj)
        let pos=objOrPos.pos||objOrPos
        visual.text(text, pos.x,pos.y+0.35, {color: color,opacity:0.75,font: font})
    },
    showLine (posA , posB ,color='red',offset) {
        let visual = pro.getRoomVisual(posA.pos?posA.pos.roomName:posA.roomName)
        posA=posA.pos||posA
        posB=posB.pos||posB
        if(offset)visual.line(posA.x+offset.x,posA.y+offset.y,posB.x+offset.x,posB.y+offset.y, {color: color})
        else visual.line(posA,posB, {color: color})
    },
    mapShowText (roomNameOrObj , text, objOrPos, color='red',font = 1) {
        if(roomNameOrObj.pos){
            objOrPos = roomNameOrObj.pos
            roomNameOrObj= objOrPos.roomName
        }
        // let visual = pro.getRoomVisual(roomNameOrObj)
        let pos=objOrPos.pos||objOrPos
        Game.map.visual.text(text, pos, {color: color,opacity:0.75,font: font})
    },
    showPath (posArray, color='red') {
        let roomNameMap = {}
        posArray.forEach(e=>{
            if (!roomNameMap[e.roomName]) {
                roomNameMap[e.roomName] = []
            }
            roomNameMap[e.roomName].push(e)
        })
        _.keys(roomNameMap).forEach(k=>{
            pro.getRoomVisual(k).poly(roomNameMap[k],{stroke : color})
        })
        // let visual = pro.getRoomVisual(roomNameOrObj)
        // let pos=objOrPos.pos||objOrPos
        // visual.text(text, pos.x,pos.y+0.25, {color: color,opacity:0.75,font: 7})
    },
}

global.HelperVisual=pro