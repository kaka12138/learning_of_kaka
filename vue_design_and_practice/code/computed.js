/*
    computed的本质: 副作用函数的懒执行
    实现computed的响应式: 手动track和trigger
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

// computed
// 实现懒计算
function computed1(getter) {
    const effectFn =  effect(getter, {
        lazy: true
    })
    const obj = {
        // 当读取obj的value时, 才执行副作用函数
        get value() {
            return effectFn()
        }
    }
    return obj
}
// 实现缓存功能
function computed2(getter) {
    let value
    let dirty = true
    const effectFn =  effect(getter, { lazy: true, scheduler() {
        dirty = true
    }})
    const obj = {
        get value() {
            if(dirty) {
                console.log("重新计算")
                value = effectFn()
                dirty = false
            }
            return value
        }
    }
    return obj
}
// 计算属性中的依赖变化时,重新计算计算属性的结果
function computed(getter) {
    let value
    let dirty = true
    const effectFn =  effect(getter, { lazy: true, scheduler() {
        if(!dirty) {
            dirty = true
             // 手动trigger计算属性的赋值操作
            trigger(obj, 'value')
        }
    }})
    const obj = {
        get value() {
            if(dirty) {
                value = effectFn()
                dirty = false
            }
            // 手动track计算属性的读操作
            track(obj, 'value')
            return value
        }
    }
    return obj
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
// 懒计算
// const sumRes1 = computed1(() => obj.foo + obj.bar)
// console.log("懒计算sumRes1", sumRes1.value)

// 缓存功能
// const sumRes2 = computed2(() => obj.foo + obj.bar)
// console.log("缓存功能sumRes2", sumRes2.value)
// console.log("缓存功能sumRes2", sumRes2.value)
// obj.foo++
// console.log("缓存功能sumRes2", sumRes2.value)

// 计算属性中的依赖变化时,重新计算计算属性的结果
const sumRes = computed(() => obj.foo + obj.bar)
console.log("计算依赖变化", sumRes.value)
obj.foo++
console.log("计算依赖变化", sumRes.value)