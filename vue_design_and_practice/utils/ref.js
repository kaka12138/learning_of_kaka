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
export function toRef(obj, key) {
    const wrapper = {
        get value() {
            return obj[key]
        }
    }
    return wrapper
}