var roleAttacker = {
    run: function(creep) {
        
        if(creep.room.name == 'W39N26'){
            creep.moveTo(28,0)
            return;
        }
        
        const targets = creep.pos.findInRange(FIND_HOSTILE_CREEPS, 3);
        if(targets.length > 0) {
            creep.rangedAttack(targets[0]);
        }
        
        var target = creep.pos.findClosestByPath(FIND_HOSTILE_CREEPS)
        if(!target){
            target = creep.pos.findClosestByPath(FIND_HOSTILE_STRUCTURES)
        }
        if(target){
            if(!creep.pos.isNearTo(target)){
                creep.moveTo(target);
            }else{
                creep.attack(target)
            }
            if(creep.pos.inRangeTo(target, 3)) {
                creep.rangedAttack(target);
            }
        }else{
            if(!creep.pos.isNearTo(36,13))
                creep.moveTo(36,13)
        }
	}
};

module.exports = roleAttacker