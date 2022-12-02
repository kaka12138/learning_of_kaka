
/*
    watch的本质: 利用副作用函数的scheduler选项实现
*/
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
        const res = fn() // 存储真正副作用函数的结果
        effectStack.pop()
        activeEffect = effectStack[effectStack.length - 1]
        return res
    }
    effectFn.options = options // 挂在options
    effectFn.deps = [] // 反向关联依赖集合

    // 非lazy时, 才执行副作用函数
    if(!options.lazy) {
        effectFn()
    }
    return effectFn
   
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

function traverse(value, seen = new Set()) {
    // 如果读取的是原始值, 或者已经读取过, 则不处理
    if(typeof value !== 'object' || value === null || seen.has(value)) return
    seen.add(value)
    // 暂时不考虑数组,和其他结构, 假设为对象
    for(let k in value) {
        traverse(value[k])
    }
    return value
}

// watch
// 不太通用的watch
function watch1(source, cb) {
    effect(() => source.foo, {
        scheduler() {
            // 监听的数据变化时, 触发回调
            cb()
        }
    })
}
// 通用的watch
function watch2(source, cb) {
    let getter
    if(typeof source === 'function') {
        getter = source
    }else {
        getter = () => traverse(source)
    }
    effect(getter, {
        scheduler() {
            cb()
        }
    })
}

// watch获取新旧值
function watch3(source, cb) {
    let getter
    if(typeof source === 'function') {
        getter = source
    }else {
        getter = () => traverse(source)
    }
    let newVal, oldVal
    const effectFn = effect(getter, {
        lazy: true,
        scheduler(fn) {
            newVal = effectFn()
            cb(newVal, oldVal)
            oldVal = newVal
        }
    })
    oldVal = effectFn()
}
// watch的immediate功能
function watch4(source, cb, options = {}) {
    let getter
    if(typeof source === 'function') {
        getter = source
    }else {
        getter = () => traverse(source)
    }
    let newVal, oldVal
    const job = () => {
        newVal = effectFn()
        cb(newVal, oldVal)
        oldVal = newVal
    }
    const effectFn = effect(getter, {
        lazy: true,
        scheduler: job
    })
    if(options.immediate) {
        job()  
    }else {
        oldVal = effectFn()
    }
}

// watch回调(cb)的执行时机. flush配置
function watch5(source, cb, options = {}) {
    let getter
    if(typeof source === 'function') {
        getter = source
    }else {
        getter = () => traverse(source)
    }
    let newVal, oldVal
    const job = () => {
        newVal = effectFn()
        cb(newVal, oldVal)
        oldVal = newVal
    }
    const effectFn = effect(getter, {
        lazy: true,
        scheduler: () => {
            if(options.flush === 'post') {
                const p = Promise.resolve()
                p.then(job)
            }else {
                job()
            }
        }
    })
    if(options.immediate) {
        job()  
    }else {
        oldVal = effectFn()
    }
}

// watch的清除无效回调(cb)的功能
function watch6(source, cb, options = {} ) {
    let getter
    if(typeof source === 'function') {
        getter = source
    }else {
        getter = () => traverse(source)
    }
    // 回调注册函数
    let cleanup
    function onValidate(fn) {
        cleanup = fn
    }
    let newVal, oldVal
    const job = () => {
        newVal = effectFn()
        cb(newVal, oldVal, onValidate)
        oldVal = newVal
    }
    const effectFn = effect(getter, {
        lazy: true,
        scheduler: () => {
            if(options.flush === 'post') {
                const p = Promise.resolve()
                p.then(job)
            }else {
                job()
            }
        }
    })
    if(options.immediate) {
        job()  
    }else {
        oldVal = effectFn()
    }
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
// 1. 不太通用的watch
// watch1(obj, () => {
//     console.log("obj.foo变化")
// })
// setTimeout(() => { obj.foo++ }, 1000)

// 2. 通用的watch
// watch2(obj, () => {
//     console.log("obj.foo变化")
// })
// watch2(() => obj.bar, () => {
//     console.log("obj.bar变化")
// })
// setTimeout(() => { obj.bar++ }, 1000)

// watch获取新旧值
// watch3(() => obj.foo, (newVal, oldVal) => {
//     console.log("watch获取新旧值", newVal, oldVal)
// })

// setTimeout(() => { obj.foo++ }, 1000)

// watch的immediate功能
// watch4(
//     () => obj.foo, 
//     (newVal, oldVal) => {
//         console.log("watch的immediate功能", newVal, oldVal)
//     },
//     {
//         immediate: true
//     }
// )

// watch的清除无效回调(cb)的功能
let finalData
watch6(() => obj.foo, async (newVal, oldVal, onValidate) => {
    let expired = false
    onValidate(() => {
        expired = true
    })
    const res = await fetch("xxxx")
    if(!expired) {
        finalData = res
    }
})
obj.foo++
setTimeout(() => {
    obj.foo++
}, 200)