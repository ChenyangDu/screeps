

class UnionFind{
    constructor(size) {
        this.size  = size
    }
    init() {
        if(!this.parent)
            this.parent = new Array(this.size)
        for(let i=0;i<this.size;i++){
            this.parent[i]=i;
        }
    }
    find(x) {
        let r = x;
        while (this.parent[r] != r) r = this.parent[r];
        while (this.parent[x] != x) {
            let t = this.parent[x];
            this.parent[x] = r;
            x = t;
        }
        return x;
    }
    union(a,b){
        a = this.find(a)
        b = this.find(b)
        if(a>b)this.parent[a]=b;
        else if(a!=b) this.parent[b]=a;
    }
    same(a,b){
        return this.find(a) ==  this.find(b)
    }
}


global.UnionFind = UnionFind


/**
 * 二分图匹配
 * @param arrA 实体A 列表
 * @param arrB 实体B 列表
 * @param lineFunc (a,b)=> a到b 是否有边
 * @return {[A, B][]}
 */
global.bipartiteGraphMatching = function (arrA,arrB,lineFunc) {
    let alen = arrA.length;
    let blen = arrB.length;
    let used;
    let b2a = {};
    let dfs = (x)=> {
        for (let i = 0; i < blen; i++) {
            // if(lineFunc(arrA[x], arrB[i]))
            //     HelperVisual.showLine(arrA[x], arrB[i], "blue")
            if (!used[i] && lineFunc(arrA[x], arrB[i])) {
                used[i] = 1
                if (b2a[i] === undefined || dfs(b2a[i])) {
                    b2a[i] = x;
                    return 1;
                }
            }
        }
        return 0
    }
    for (let i = 0; i < alen; i++){
        used = {}
        dfs(i);
    }

    return Object.entries(b2a).map(e=>[arrA[e[1]],arrB[e[0]]])
}

