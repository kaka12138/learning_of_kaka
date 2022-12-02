/*
    1.模拟遍历器
*/

// demo1
function makeIterator(array) {
    var nextIndex = 0
    return {
        next() {
            return nextIndex < array.length ? 
            { value: array[nextIndex++], done: false } : 
            { value: undefined, done: true }
        }
    }
}
// demo2
function makeIterator2(array) {
    var nextIndex = 0
    return {
        next() {
            return nextIndex < array.length ? { value: array[nextIndex++] } : { done: true }
        }
    }
}
// const it = makeIterator(['a', 'b'])
// const it = makeIterator2(['a', 'b'])
// console.log("next", it.next())
// console.log("next", it.next())
// console.log("next", it.next())

// 对象上部署Iterator接口
const ob = {
    data: ['a', 'b', 'c'],
    [Symbol.iterator]() {
        const self = this
        let index = 0
        return {
            next() {
                return index < self.data.length ? { value: self.data[index++], done: false }: { value: undefined, done: true }
            }
        }
    }
}
for(let i of ob) {
    console.log("对象上部署Iterator接口", i)
}

// Iterator配合generator使用
const obj = {
    [Symbol.iterator]:  function* () {
        yield 1;
        yield 2;
        yield 3;
    }
}
for(let i of obj) {
    console.log("默认Iterator", i)
}

// 具有Iterator接口的原生数据结构
let arr = ['a', 'b', 'c']
let iter = arr[Symbol.iterator]()

console.log("具有Iterator接口的原生数据结构", iter.next())
console.log("具有Iterator接口的原生数据结构", iter.next())
console.log("具有Iterator接口的原生数据结构", iter.next())
console.log("具有Iterator接口的原生数据结构", iter.next())


