import { shallowReactive, reactive, effect } from "../utils/reactive.js"

const obj = { foo: { bar: 1 } }
const pShallow = shallowReactive(obj)
const p = reactive(obj)

// 浅响应
// effect(() => {
//     // console.log("浅响应", pShallow.foo.bar) // error
//     console.log("really 浅响应", pShallow.foo)
// })

// setTimeout(() => {
//     // pShallow.foo.bar = 2 // error
//     pShallow.foo = { bar: 2 }
// }, 1000)

// 深响应
effect(() => {
    // TODO: 根据Vue, p.foo是会触发响应的
    // console.log("这种不会触发响应", p.foo)
    console.log("深响应", p.foo.bar)
})

setTimeout(() => {
    p.foo.bar = 22
}, 2000)