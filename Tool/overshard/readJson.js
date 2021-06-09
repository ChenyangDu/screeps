module.exports=function (path) {
let fs=require("fs")
    let res=fs.readFileSync(path,'utf-8')
    try{
        let js= JSON.parse(res)
        return js
    }catch (e) {
        console.log("js error on "+path)
    }

}