/*
    读取操作:
        1. 访问属性: obj.foo
        2. 判断对象或原型上是否存在给定的 key：key in obj
        3. 使用 for...in 循环遍历对象：for (const key in obj){}
    删除操作:
        1. delete
        2. 注意: 
            由于删除操作会使得对象的键变少，它会影响 for...in 循环的次数，
            因此当操作类型为 'DELETE' 时，我们也应该触发那些与 ITERATE_KEY 相关联的副作用函数重新执行
*/
// global
const bucket = new WeakMap()
let activeEffect
const effectStack = []
const ITERATE_KEY = Symbol()
const TriggerType = {
    SET: 'SET',
    ADD: 'ADD',
    DELETE: 'DELETE'
}
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
function trigger(target, key, type) {
    let depsMap = bucket.get(target)
    if(!depsMap) return
    // 取出与key相关的副作用函数
    const effects = depsMap.get(key)
    // 取出与ITERATE_KEY相关的副作用函数
    const iterateEffects = depsMap.get(ITERATE_KEY)
    
    const effectsToRun = new Set()
    // 将与key关联的副作用函数添加到effectsToRun
    effects&&effects.forEach(effectFn => {
        // 避免无限循环
        if(effectFn !== activeEffect) {
            effectsToRun.add(effectFn)
        }
    })
    // 只有是新增属性时,才会触发副作用函数
    if(type === TriggerType.ADD || type === TriggerType.DELETE) {
        // 将与ITERATE_KEY关联的副作用函数添加到effectsToRun
        iterateEffects&&iterateEffects.forEach(effectFn => {
            if(effectFn !== activeEffect) {
                effectsToRun.add(effectFn)
            }
        })
    }

    effectsToRun.forEach(effectFn => {
        if(effectFn.options.scheduler) {
            effectFn.options.scheduler(effectFn)
        }else {
            effectFn()
        }
    })
}

const obj = { foo: 1, other: 1 }
const p = new Proxy(obj, {
    // 1. 拦截属性访问
    get(target, key, receiver) {
        track(target, key)
        
        return Reflect.get(target, key, receiver)
    },
    // 2.拦截判断对象或原型上是否存在给定的 key：key in obj
    has(target, key) {
        track(target, key)
        return Reflect.has(target, key)
    },
    // 3.拦截使用 for...in 循环遍历对象：for (const key in obj){}
    // 理解: 每进行一次循环(访问一个键), 触发一次track
    ownKeys(target) {
        track(target, ITERATE_KEY)
        return Reflect.ownKeys(target)
    },
    // 拦截删除操作
    deleteProperty(target, key) {
        // 检查被操作是否是自己的属性
        const hadKey = Object.prototype.hasOwnProperty.call(target, key)
        // 检查是否删除成功
        const res = Reflect.deleteProperty(target, key)
        if(hadKey && res) {
            // 注意: 这里是trigger不是track
            trigger(target, key, TriggerType.DELETE)
        }
        return res
    },
    set(target, key, newVal, receiver) {
        // 如果对象上不存在属性,则是添加属性,否则是修改已有属性
        const type = Object.prototype.hasOwnProperty.call(target, key) ? TriggerType.SET : TriggerType.ADD
        // 设置新的值
        const res = Reflect.set(target, key, newVal, receiver)
        // trigger根据type做区分
        trigger(target, key, type)
        return res
    }
})

// test
// 1.拦截key in obj
// effect(() => {
//     console.log('拦截key in obj', 'foo' in p)
// })

// setTimeout(() => {
//     p.foo++
// }, 1000)

// 2.拦截for ... in 之添加新属性
// effect(() => {
//     for(const key in p) {
//         console.log("拦截for...in", key)
//     }
// })
// setTimeout(() => {
//     p.bar = 2
// }, 100)

// 3.拦截for ... in 之修改属性
effect(() => {
    for(const key in p) {
        console.log("拦截for...in", key)
    }
})
setTimeout(() => {
    p.foo = 2
}, 100)

