
// global
const bucket = new WeakMap()
let activeEffect
const effectStack = []
// 注册副作用函数
function effect(fn) {
    const effectFn = () => {
        cleanup(effectFn)
        activeEffect = effectFn
        effectStack.push(effectFn)
        fn()
        effectStack.pop()
        activeEffect = effectStack[effectStack.length - 1]
    }
    effectFn.deps = [] // 反向关联依赖集合
    effectFn()
}
// 每次副作用函数执行时，我们可以先把它从所有与之关联的依赖集合中删除
// 当副作用函数执行完毕后，会重新建立联系(重新track)，但在新的联系中不会包含遗留的副作用函数
function cleanup(effectFn) {
    for(let i = 0; i < effectFn.deps.length; i++) {
        let deps = effectFn.deps[i]
        deps.delete(effectFn)
    }
    effectFn.deps.length = 0
}
// track
function track(target, key) {
    if(!activeEffect) return
    let depsMap = bucket.get(target)
    if(!depsMap) {
        bucket.set(target, (depsMap = new Map()))
    }
    let deps = depsMap.get(key)
    if(!deps) {
        depsMap.set(key, (deps = new Set()))
    }
    deps.add(activeEffect)
    activeEffect.deps.push(deps)
}
// trigger
function trigger(target, key) {
    let depsMap = bucket.get(target)
    if(!depsMap) return
    const effects = depsMap.get(key)
    const effectsToRun = new Set()
    effects&&effects.forEach(effectFn => {
        // 避免无限循环
        if(effectFn !== activeEffect) {
            effectsToRun.add(effectFn)
        }
    })
    effectsToRun.forEach(effectFn => effectFn())
}

// const data = { foo: 1, bar: 1 }
const obj = {
    foo: 1,
    get bar() {
        return this.foo
    }
}
const p = new Proxy(obj, {
    get(target, key, receiver) {
        track(target, key)
        return Reflect.get(target, key, receiver) // 新增
        // return target[key]
    },
    set(target, key, value) {
        target[key] = value
        trigger(target, key)
    }
})

// test
effect(function effectFn() {
    console.log("执行副作用函数", p.bar) 
})
setTimeout(() => { p.foo++ }, 1000)

/*
questions:
   1. 当 effect 注册的副作用函数执行时，会读取 p.bar 属性，它发现 p.bar 是一个访问器属性，
   因此执行 getter 函数。由于在getter 函数中通过 this.foo 读取了 foo 属性值，
   因此我们认为副作用函数与属性foo 之间也会建立联系
   2. bar会与副作用函数建立联系, 但是更新bar的值, 不会变化
   3. 解释: 
   其中 target 是原始对象obj，而 key 就是字符串 'bar'，所以 target[key] 相当于 obj.bar。
   因此，当我们使用 p.bar 访问 bar 属性时，它的 getter 函数内的 this 指向的其实是原始对象obj，这说明我们最终访问的其实是 obj.foo。
   很显然，在副作用函数内通过原始对象访问它的某个属性是不会建立响应联系的   
   4. 解决: 使用Reflect拦截get操作中返回的target[key]
*/