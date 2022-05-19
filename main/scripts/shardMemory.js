let memory = {}
module.exports = {
    get(shardName){
        return memory[shardName]
    },
    set(shardName,mem){
        memory[shardName] = mem
    },
    init(){
        const shardNames = ['shard3','shard2','shard1','shard0']
        shardNames.forEach(shardName=>{
            if(shardName == Game.shard.name){
                memory[shardName] = JSON.parse(InterShardMemory.getLocal() || "{}");
            }else{
                memory[shardName] = JSON.parse(InterShardMemory.getRemote(shardName) || "{}");
            }
        })
    },
    end(){
        InterShardMemory.setLocal(JSON.stringify(memory[Game.shard.name]))
    }
}