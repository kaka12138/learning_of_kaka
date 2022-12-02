import { effect, readonly, shallowReadonly } from "../utils/reactive.js"

const obj = { foo: { bar: 1 } }
const pReadonlyShallow = shallowReadonly(obj)
const pReadonly = readonly(obj)

// shallow readonly
// effect(() => {
//     console.log("shallow readonly", pReadonlyShallow.foo)
// })
// pReadonlyShallow.foo.bar = 2 // 但是深层的对象不是只读

effect(() => {
    console.log("readonly", pReadonly.foo)
})
pReadonly.foo.bar = 22