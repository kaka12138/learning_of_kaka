/*
    - 数组是对象:
        1.数值是异质对象, 因为数组对象的 [[DefineOwnProperty]] 内部方法与常规对象不同
    - 数组的读取操作:
        1. 通过索引访问数组元素值：arr[0]
        2. 访问数组的长度：arr.length
        3. 把数组作为对象，使用 for...in 循环遍历
        4. 使用 for...of 迭代遍历数组
        6. 数组的原型方法，如 concat/join/every/some/find/findIndex/includes 等
        5. 以及其他所有不改变原数组的原型方法, forEach/map 等
    - 数组的索引和length
        1. 操作根据索引操作数组元素,影响数组length
        2. 操作数组length, 影响数组元素
    - 数组的查找方法
    - 注意点： 访问方法等于读取属性这个操纵
        
*/

import { reactive, effect } from "../utils/reactive-for-array.js"

const arr = reactive(['foo'])

// 修改数组
// effect(() => {
//     console.log("修改数组", arr[0])
// })
// setTimeout(() => {
//     arr[0] = 'bar'
// }, 1000)

// 操作根据索引操作数组元素,影响数组length
// effect(() => {
//     console.log("操作根据索引操作数组元素,影响数组length", arr.length)
// })
// setTimeout(() => {
//     arr[1] = 'bar'
// }, 1000)

// 操作数组length, 影响数组元素
// effect(() => {
//     console.log("操作数组length, 影响数组元素", arr[0])
// })
// setTimeout(() => {
//     arr.length = 0
// }, 1000)

// 数组的查找方法
const obj = {}
const arr1 = reactive([obj])

effect(() => {
    /*
        原因：
        1. 通过代理对象访问元素时, 如果值任然是被代理的(类型是object), 那么返回的值就是新的代理对象
           arr1[0]访问时：首先arr1是一个代理对象, 继续递归时arr1[0]是一个object, 所以返回的arr1[0]是一个新得的代理对象
        2. arr1.includes(): includes 方法内部也会通过 arr1 访问数组元素, 得到一个新的代理对象
        3. 关键：这两个代理对象是不同的
        // demo 解释:
        // let objDemo = {}
        // let p = new Proxy(objDemo, {})
        // let p2 = new Proxy(objDemo, {})
        // console.log("比较两个代理对象", p === p2)
    */
    console.log("数组的查找方法-includes", arr1.includes(arr1[0]))
})

effect(() => {
    /*
        原因:
        1. arr1是一个代理对象, includes在内部使用arr1访问元素时,得到的代理对象中的
        2. 而obj是一个原始对象, 所以两者取得的元素进行比较时是不同的
    */
    console.log("这种情况也不行", arr1.includes(obj))
})

// 重写数组隐式改变length的方法
effect(() => {
    console.log("重写数组隐式改变length的方法", arr.push(1))
})
effect(() => {
    console.log("重写数组隐式改变length的方法", arr.push(1))
})

