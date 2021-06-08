module.exports = {
    run: function(creep,freepos) {
        const targets = creep.pos.findInRange(FIND_HOSTILE_CREEPS, 3);
        if(targets.length > 0) {
            creep.rangedAttack(targets[0]);
        }
        var target = creep.pos.findClosestByPath(FIND_HOSTILE_CREEPS)
        if(!target)
            target = creep.pos.findClosestByPath(FIND_HOSTILE_STRUCTURES)
        if(target){
            if(creep.attack(target) == ERR_NOT_IN_RANGE){
                creep.moveTo(target);
            }else{
                if(creep.pos.inRangeTo(target, 3)) {
                    creep.rangedAttack(target);
                }
            }
        }else{
            if(!creep.pos.isNearTo(freepos))
                creep.moveTo(freepos,{ignoreCreeps:false})
        }
	}
};