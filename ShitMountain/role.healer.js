
module.exports = {
    run:function(creep,freepos){
        var targets = creep.room.find(FIND_MY_CREEPS, {
            filter: function(object) {
                return object.hits < object.hitsMax;
            }
        });
        if(targets.length){
            targets.sort((a,b) => a.hits - b.hits);
        }
        const target = targets[0]
        if(target) {
            if(creep.heal(target) == ERR_NOT_IN_RANGE) {
                creep.moveTo(target);
            }
        }else{
            if(!creep.pos.isNearTo(freepos))
                creep.moveTo(freepos)
        }
    }
};