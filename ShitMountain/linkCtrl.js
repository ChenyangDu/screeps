module.exports = {
    run:function(){
        if(Game.time % 11 == 0){
            updateLink();
        }
        var inputlink,outputlink;
        for(var roomName in Memory.inputLinks){
            inputlink = outputlink = null;
            for(var linkid in Memory.inputLinks[roomName]){
                var link = Game.getObjectById(linkid)
                if(link && Memory.inputLinks[roomName][linkid] == true && link.energy >= 500 && link.cooldown == 0)
                    inputlink = link;
                if(link && Memory.inputLinks[roomName][linkid] == false && link.energy < 400)
                    outputlink = link;
            }
            if(inputlink && outputlink){
                inputlink.transferEnergy(outputlink)
            }
        }
    }
};
//45 3

function isNearToBoard(struct){
    const pos = struct.pos;
    if(pos.x<=4 || pos.x >=45 || pos.y <=4 || pos.y >= 45)return true;
    else return false;
}


function updateLink(){
    const myroomNames = _.filter(Game.rooms, (x) => x.controller && x.controller.my )
    var inputlinks = {};
    myroomNames.forEach(myroom => {
        if(!Memory.inputLinks[myroomName]){
            Memory.inputLinks[myroomName] = {};
        }
        var myroomName=myroom.name;
        inputlinks[myroomName] = {};
        var links = myroom.find(FIND_STRUCTURES,{filter:o=>(o.structureType == STRUCTURE_LINK)});
        links.forEach(link => {
            var isInput = true;
            if(isNearToBoard(link))
                isInput = true;
            else{
                var flags = link.pos.findInRange(FIND_FLAGS,1,{
                    filter:o=>(o.color == COLOR_YELLOW && o.secondaryColor == COLOR_YELLOW)
                })
                if(flags.length)
                    isInput = true;
                else isInput = false;
            }
            inputlinks[myroomName][link.id] = isInput;
        });
    });
    Memory.inputLinks = inputlinks;
}