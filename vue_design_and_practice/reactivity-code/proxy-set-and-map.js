/*
    - 处理Set的size属性和delete方法
        1.根据Set的size属性的访问流程, 通过代理对象访问size属性时报错是因为this指向问题
          this指向了代理对象, 而代理对象上没有[[SetData]]内部槽
          解决：在get拦截时改变this指向
        2.在调用delete时, this始终指向代理对象
          解决：bind绑定原始对象
        3.关键点：
            当访问 p.size 时，访问器属性的 getter 函数会立即执行，此时我们可以通过修改 receiver 来改变 getter 函数的 this 的指向。
            而当访问 p.delete 时，delete 方法并没有执行，真正使其执行的语句是p.delete(1) 这句函数调用。
            因此，无论怎么修改 receiver，delete 方法执行时的this 都会指向代理对象 p，而不会指向原始 Set 对象
    - 避免污染原始数据
        1.给原始数据添加响应式数据
    - 处理forEach
        1.导致问题的原因就是上面曾提到的，当通过 value.size 访问 size 属性时，这里的 value 是原始数据对象，
          即 new Set([1, 2, 3])，而非响应式数据对象，因此无法建立响应联系]
        2.forEach的this指向问题
        3.当使用 forEach 遍历 Map 类型的数据时，它既关心键，又关心值, 所以即使是设置操纵也应该触发副作用函数

*/
import { effect, reactive } from "../utils/reactive-for-set-and-map.js"
// 代理Set
// const s = new Set([1, 2, 3])
// const p = reactive(s)
// effect(() => {
//     console.log("访问Set的size属性", p.size)
// })
// setTimeout(() => {
//     // p.add(4)
//     p.delete(2)
// }, 1000)

// 避免污染原始数据
// const m = new Map()
// const p1 = reactive(m)
// const p2 = reactive(new Map())
// p1.set('p2', p2)

// effect(() => {
//     console.log("读取原始数据", m.get('p2').size)
// })

// setTimeout(() => {
//     m.get('p2').set('foo', 1)
// }, 1000)

// forEach
// const key = { key: 1 }
// const value = new Set([1, 2, 3])
// const p = reactive(new Map([ [ key, value ] ]))

// effect(() => {
//     p.forEach((value, key) => {
//         console.log("forEach遍历的问题", value.size)
//     })
// })

// setTimeout(() => {
//     // 没有触发响应
//     p.get(key).delete(1)
// }, 1000)

const p2 = reactive(new Map([[ 'key', NaN ], ['key2', 222]]))
// effect(() => {
//     p2.forEach((value, key) => {
//         console.log("修改也会触发副作用函数的", value)
//     })
// })
// setTimeout(() => {
//     p2.set('key', 22)
// }, 1000)

// 迭代器和entries, values
// effect(() => {
//   for(const [key, value] of p2.entries()) {
//     console.log("遍历entries", key, value)
//   }
// })

// effect(() => {
//   for(const value of p2.values()) {
//     console.log("遍历values", value)
//   }
// })

effect(() => {
  for(const key of p2.keys()) {
    console.log("遍历keys", key)
  }
})

setTimeout(() => {
    // 修改相同的key对应的值，不能触发副作用函数
    // p2.set('key2', 100)
    p2.set('key3', 333)
}, 1000)