// Array.prototype.flat= function(){return _.flatten(this)};
// // Array.prototype.reduce= function(func){return _.reduce(this,func)};
// Array.prototype.zip= function (another){return _.zip(this,another)};
// Array.prototype.contains= function (another){return _.includes(this,another)};
// Array.prototype.take= function (n){return _.take(this,n)};
// Array.prototype.head= function(){return _.head(this)};
// Array.prototype.last= function(){return _.last(this)};
// Array.prototype.without= function(...e){return _.without(this,...e)};
// Array.prototype.sum= function(...e){return _.sum(this,...e)};
// Array.prototype.toSet= function(){return new Set(this)};
// Array.prototype.toMap= function(){return this.reduce((map,entry)=>{map[entry[0]] = entry[1];return map},{})};
// Array.prototype.find= function(...e){return _.find(this,...e)};
// Array.prototype.maxBy= function(func){return this.reduce((ori, another)=>func(ori)>=func(another)?ori:another,this[0])};
// Array.prototype.minBy= function(func){return this.reduce((ori, another)=>func(ori)<func(another)?ori:another,this[0])};
// Array.prototype.log= function(){console.log(JSON.stringify(this));return this};

// clog=function(...e){console.log(...e)};
// log=function(...e){console.log(JSON.stringify(e))};

// let int32 = Math.pow(2,32)
// randomId = ()=>_.padLeft(Math.ceil(Math.random()*int32).toString(16).toLocaleUpperCase(),8,"0")

// let posCodeNumberMap = {};
// let posCodeCharMap = {};
// // pos 转换 char 用的
// (function (){
//     let a = 'a'.charCodeAt(0)
//     let A = 'A'.charCodeAt(0)
//     for(let i=0;i<25;i++){
//         let b = String.fromCharCode(a+i)
//         let j = 25+i
//         let B = String.fromCharCode(A+i)
//         posCodeNumberMap[i] = b
//         posCodeCharMap[b] = i
//         posCodeNumberMap[j] = B
//         posCodeCharMap[B] = j
//     }
// }())


let pro={
    encodePosArray (posArray){
        return posArray.map(e=>String.fromCharCode(e.x*50+e.y)).reduce((a,b)=>a+b,"")
    },
    decodePosArray (string){
        let out = []
        for(let i=0;i<string.length;i++){
            let num = string.charCodeAt(i)
            out.push({x:Math.floor(num/50),y:num%50})
        }
        return out;
    },
};


global.Utils=pro;