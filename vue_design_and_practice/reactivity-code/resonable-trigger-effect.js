/*
    合理地触发响应(副作用函数):
        1.当值没有发生变化时，应该不需要触发响应(包含NaN情况)
        2.从原型上继承属性的情况
*/
import { reactive, effect } from "../utils/reactive.js"


// test
// const obj = { foo: 1, other: NaN }
// const p = reactive(obj)

// 1.新,旧值不同才会触发响应
// effect(() => {
//     console.log("新,旧值不同才会触发响应", p.foo)
// })

// setTimeout(() => {
//     // p.foo = 1
//     p.foo = 2
// }, 1000)

// 2.新,旧值不同才会触发响应 --- NaN的情况
// effect(() => {
//     console.log("新,旧值不同才会触发响应", p.other)
// })

// setTimeout(() => {
//     p.other = NaN
// }, 1000)

// 3. 原型上继承属性的情况
const obj = {}
const proto = { bar: 1 }
const child = reactive(obj)
const parent = reactive(proto)
// 设置child的原型为parent
Object.setPrototypeOf(child, parent)

effect(() => {
    // track: child的get -> parent -> parent.bar
    console.log("原型上继承属性的情况", child.bar)
})

setTimeout(() => {
    // 会触发2次副作用函数
    // 原因： child.bar 和 parent.bar 都与副作用函数建立了响应联系。
    // 解释： 
    // 如果设置的属性不存在于对象上，那么会取得其原型，并调用原型的 [[Set]] 方法，也就是 parent 的 [[Set]] 内部方法。
    // 由于 parent 是代理对象，所以这就相当于执行了它的 set 拦截函数。
    // 换句话说，虽然我们操作的是child.bar，但这也会导致 parent 代理对象的 set 拦截函数被执行
    // 两次触发中的关键：触发set操作时, target会改变, receiver不会变, 要屏蔽的是receiver不是target代理对象的情况
    child.bar = 2 
}, 1000)