
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

// const data = { foo: 1 }
// const data = { ok: true, text: "分支切换和cleanup" }
// const data = { foo: true, bar: true }
const data = { foo: 1, bar: 1 }
const obj = new Proxy(data, {
    get(target, key) {
        track(target, key)
        return target[key]
    },
    set(target, key, value) {
        target[key] = value
        trigger(target, key)
    }
})

// test
// 1. 基本响应
// effect(function effectFn() {
//     document.body.innerText = obj.foo 
// })
// setTimeout(() => {
//     obj.foo = "reactivity"
// }, 1000)

// 2. 分支切换和cleanup
// effect(function effectFn() {
//     document.body.innerText = obj.ok ? obj.text: 'not'
// })

// setTimeout(() => {
//     obj.ok = false
// }, 1000)

// 3.嵌套effect
// let temp1, temp2
// effect(function effectFn1() {
//     console.log("effectFn1执行")
//     effect(function effectFn2() {
//         console.log("effectFn2执行")
//         temp2 = obj.bar
//     })
//     temp1 = obj.foo
// })
// setTimeout(() => {
//     // obj.foo = false
//     obj.bar = false
// })

// 4. 无限循环
effect(function effectFn() {
    obj.foo++
})
