import { reactive } from "./reactive-all.js"
// 原始值的响应方案
export function ref(val) {
    const wrapper = {
        value: val
    }
    // 区分是原始值的包裹对象还是非原始值的响应对象
    Object.defineProperty(wrapper, '__v__isRef',  {
        value: true
    })
    return reactive(wrapper)
}
// toRef: 基于响应式对象上的一个属性，创建一个对应的 ref
/**
 * 
 * @param {响应式对象} obj 
 * @param {与响应式对象同名的键} key 
 * @return ref类型响应式对象
 */
export function toRef(obj, key) {
    const wrapper = {
        get value() {
            return obj[key]
        },
        set value(val) {
            obj[key] = val
        }
    }
    Object.defineProperty(wrapper, "__v__isRef", {
        value: true
    })
    return wrapper
}

/**
 * 
 * @param {响应式对象} obj 
 * @return 经过toRef处理的ref类型的响应式对象
 */
export function toRefs(obj) {
    const ret = {}
    for(let key in obj) {
        ret[key] = toRef(obj, key)
    }
    return ret
}

/*
    自动脱ref
        1. 由于 toRefs 会把响应式数据的第一层属性值转换为 ref，因此必须通过 value 属性访问值：newObj.foo.value
        2. 实现的效果： newObj.foo
*/
export function proxyRefs(target) {
    return new Proxy(target, {
        get(target, key, receiver) {
            const value = Reflect.get(target, key, receiver)
            return value.__v__isRef ? value.value : value
        },
        set(target, key, newValue, receiver) {
            const value = target[key]
            if(value.__v__isRef) {
                value.value = newValue
                return true
            }
            return Reflect.set(target, key, newValue, receiver)
        }
    })
}