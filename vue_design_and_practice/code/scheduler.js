
// global
const bucket = new WeakMap()
let activeEffect
const effectStack = []
// 注册副作用函数
function effect(fn, options = {}) {
    const effectFn = () => {
        cleanup(effectFn)
        activeEffect = effectFn
        effectStack.push(effectFn)
        fn()
        effectStack.pop()
        activeEffect = effectStack[effectStack.length - 1]
    }
    effectFn.options = options // 挂在options
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
    effectsToRun.forEach(effectFn => {
        // 存在调度器则执行, 并将当前副作用函数返回给调度器
        if(effectFn.options.scheduler) {
            effectFn.options.scheduler(effectFn)
        }else {
            effectFn()
        }
    })
}

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
// 1.调度器控制副作用函数执行顺序
// effect(
//     () => console.log(obj.foo),
//     {
//         scheduler(fn) {
//             setTimeout(fn)
//         }
//     }
// )
// obj.foo++
// console.log("end")

// 2.调度器控制副作用函数执行次数
const jobQueue = new Set()
const p = Promise.resolve() // 微任务
let isFlushing = false
function flushJob() {
    if(isFlushing) return
    isFlushing = true
    p.then(() => {
        jobQueue.forEach(job => job())
    }).finally(() => {
        isFlushing = false
    })
}
effect(
    () => {console.log(obj.foo)},
    {
        scheduler(fn) {
            jobQueue.add(fn)
            flushJob()
        }
    }
)

obj.foo++
obj.foo++