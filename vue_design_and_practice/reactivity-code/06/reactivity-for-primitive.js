// 原始值的响应式
import { ref, toRef, toRefs, proxyRefs } from "../../utils/ref.js"
import { effect, reactive } from "../../utils/reactive-all.js";
const obj = reactive({ foo: 1, bar: 2 })

// ref
// const refVal = ref(1);
// effect(() => {
//     console.log("原始值的响应式", refVal.value)
// })
// setTimeout(() => {
//     refVal.value = 2
// }, 1000)

// toRef: 解决响应丢失问题
const newObj = {
    foo: toRef(obj, 'foo'),
    bar: toRef(obj, 'bar')
}

effect(() => {
    console.log("toRef解决响应丢失问题", newObj.foo.value)
})

setTimeout(() => {
    newObj.foo.value++
}, 1000)

// toRefs: 批量处理响应式对象, 返回ref类型得的响应式数据
const newObj1 = { ...toRefs(obj)}

effect(() => {
    console.log("toRefs: 批量处理响应式对象, 返回ref类型得的响应式数据", newObj1.bar.value)
})

setTimeout(() => {
    newObj1.bar.value++
}, 1000)

// 自动脱ref
const newObj2 = proxyRefs({...toRefs(obj)})
console.log("自动脱ref", newObj2.foo)