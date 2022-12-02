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
export function effect(fn, options = {}) {
    const effectFn = () => {
        cleanup(effectFn)
        activeEffect = effectFn
        effectStack.push(effectFn)
        const res = fn()
        effectStack.pop()
        activeEffect = effectStack[effectStack.length - 1]
        return res
    }
    effectFn.deps = [] // 反向关联依赖集合
    effectFn.options = options
    // 非lazy时, 才执行副作用函数
    if(!options.lazy) {
        effectFn()
    }
    return effectFn
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

// 创建响应式函数
function createReactive(obj, isShallow = false, isReadaonly = false) {
    return new Proxy(obj, {
        // 1. 拦截属性访问
        get(target, key, receiver) {
            
            // 代理对象可以通过raw属性方法到原始对象(被代理的对象)
            if(key === 'raw') {
                return target
            }
            // 非只读数据才track, 建立响应
            if(!isReadaonly) {
                track(target, key)
            }
            // 获取get访问结果
            const res = Reflect.get(target, key, receiver) // 当前对象上不存在属性时, 调用原型的[[Get]]
            console.log("res", res)
            // 浅响应
            if(isShallow) {
                return res
            }
            // 深响应
            if(typeof res === 'object' && res !== null) {
                // 继续递归, 将结果包装成响应式数据
                return isReadaonly ? readonly(res) : reactive(res)
            }
            return res
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
            // 处理只读
            if(isReadaonly) {
                console.warn(`属性${key} 是只读的`)
                return true
            }

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
            // 处理只读
            if(isReadaonly) {
                console.warn(`属性${key} 是只读的`)
                return true
            }
            // 设置新值前获取旧值
            const oldVal = target[key]
            // 如果对象上不存在属性,则是添加属性,否则是修改已有属性
            const type = Object.prototype.hasOwnProperty.call(target, key) ? TriggerType.SET : TriggerType.ADD
            // 设置新的值
            const res = Reflect.set(target, key, newVal, receiver) // 当前对象上不存在属性时, 调用原型的[[Set]]
            // 说明receiver是target的代理对象
            // 只有当 receiver 是 target 的代理对象时才触发更新，这样就能够屏蔽由原型引起的更新了
            if(target === receiver.raw) {
                // 新旧值不全等, 并且都不是NaN
                if(oldVal !== newVal && (oldVal === oldVal || newVal === newVal)) {
                    trigger(target, key, type)
                }
            }
            return res
        }
    })
}

export function reactive(obj) {
    return createReactive(obj)
}
export function shallowReactive(obj) {
    return createReactive(obj, true)
}

export function readonly(obj) {
    return createReactive(obj, false, true)
}

export function shallowReadonly(obj) {
    return createReactive(obj, true, true)
}