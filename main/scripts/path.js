
let posCodeNumberMap = {};
let posCodeCharMap = {};
// pos 转换 char 用的
(function (){
    let a = 'a'.charCodeAt(0)
    let A = 'A'.charCodeAt(0)
    for(let i=0;i<25;i++){
        let b = String.fromCharCode(a+i)
        let j = 25+i
        let B = String.fromCharCode(A+i)
        posCodeNumberMap[i] = b
        posCodeCharMap[b] = i
        posCodeNumberMap[j] = B
        posCodeCharMap[B] = j
    }
}())
module.exports = {
    encodePosArray (posArray){
        return posArray.map(e=>posCodeNumberMap[e.x]+posCodeNumberMap[e.y]).reduce((a,b)=>a+b,"")
    },
    decodePosArray (string){
        let out = []
        for(let i=0;i<string.length;i+=2){
            out.push({x:posCodeCharMap[string[i]],y:posCodeCharMap[string[i+1]]})
        }
        return out;
    },
    
}