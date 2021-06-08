if(!Memory.Group)Memory.Group = {}

const dPos = [{x:0,y:0},{x:1,y:0},{x:0,y:1},{x:1,y:1}]
const DIR = [{x:0,y:-1},{x:1,y:-1},{x:1,y:0},{x:1,y:1},
    {x:0,y:1},{x:-1,y:1},{x:-1,y:0},{x:-1,y:-1},]

class Group{
    constructor(name,creeps,headPos){
        this.name = name;
        this.creeps = creeps;
        this.headPos = headPos
    }
    makeGroup(name,creeps){
        if(!name){
            return -1;
        }
        let memory = {};
        memory.creeps = [];

        for(let creep of creeps){
            if(creep){
                memory.creeps.push(creep.id)
            }else{
                memory.creeps.push(null)
            }
        }
        
        Memory.Group[name] = memory
    }
    isTogether(){
        let ret = true;

        let pos = this.headPos;
        if(!pos)return false;

        let creeps = this.creeps;
        for(let i in creeps){
            let creep = creeps[i];
            pos.roomName = creep.pos.roomName
            let dp = dPos[i]
            if(!creep.pos.isEqualTo(addPos(pos,dp))){
                ret = false;
            }
        }

        return ret;
    }
    setPos(pos){
        this.headPos = pos
        Memory.Group[this.name].headPos = pos
    }
    assemble(){
        let pos = this.headPos;
        if(!pos)return;
        let creeps = this.creeps;
        for(let i in creeps){
            let creep = creeps[i];
            pos.roomName = creep.pos.roomName
            let dp = dPos[i]
            creep.moveTo(addPos(pos,dp))
        }
    }
    alter(){
        let creeps = this.creeps
        for(let i in creeps){
            Memory.Group[this.name].creeps[i] = creeps[3-i].id;
        }
        for(let i in creeps){
            creeps[i] = Game.getObjectById(Memory.Group[this.name].creeps[i])
        }
    }
    alterX(){
        let creeps = this.creeps
        Memory.Group[this.name].creeps[0] = creeps[1].id;
        Memory.Group[this.name].creeps[1] = creeps[0].id;
        Memory.Group[this.name].creeps[2] = creeps[3].id;
        Memory.Group[this.name].creeps[3] = creeps[2].id;
        
        for(let i in creeps){
            creeps[i] = Game.getObjectById(Memory.Group[this.name].creeps[i])
        }
    }
    alterY(){
        let creeps = this.creeps
        Memory.Group[this.name].creeps[0] = creeps[2].id;
        Memory.Group[this.name].creeps[2] = creeps[0].id;
        Memory.Group[this.name].creeps[1] = creeps[3].id;
        Memory.Group[this.name].creeps[3] = creeps[1].id;
        
        for(let i in creeps){
            creeps[i] = Game.getObjectById(Memory.Group[this.name].creeps[i])
        }
    }
    move(dir){
        if(!this.isTogether()){
            return -1
        }
        for(let creep of this.creeps){
            //creep.move(dir)
        }
        console.log(this.headPos)
        this.headPos = addPos(this.headPos,DIR[dir-1])
        Memory.Group[this.name].headPos = this.headPos
        console.log(this.headPos)
    }

    heal(target){
        for(let creep of this.creeps){
            creep.heal(target)
        } 
    }
    
}
global.Group = Group

function addPos(a,b){
    let x,y;
    x = a.x + b.x;
    y = a.y + b.y;
    if(x>=0 && x<=49 && y >=0 && y<=49){
        return new RoomPosition(x,y,a.roomName)
    }
}

//Game.prototype.groups = {}
