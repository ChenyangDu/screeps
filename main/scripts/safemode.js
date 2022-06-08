module.exports = {
    run(){
        Game.myrooms.forEach(room => {
            runRoom(room)
        });
    }
}
/**
 * 
 * @param {Room} room 
 */
function runRoom(room){
    let enemy = _.head(room.find(FIND_HOSTILE_CREEPS))
    

    if(enemy /*&& enemy.owner.username != 'Invader'*/){
        let danger = false
        enemy.body.forEach(part=>{
            if(part.type != MOVE){
                danger = true
            }
        })
        if(danger){
            let structures = room.find(FIND_STRUCTURES,{
                filter:o=>{
                    if(o.structureType != STRUCTURE_SPAWN && o.structureType != STRUCTURE_EXTENSION)return;
                    let ramp = _.find(o.pos.lookFor(LOOK_STRUCTURES),o=>o.structureType==STRUCTURE_RAMPART)
                    if(!ramp && o.pos.inRangeTo(enemy,3)){
                        room.controller.activateSafeMode()
                    }
                }
            })
        }
    }
}