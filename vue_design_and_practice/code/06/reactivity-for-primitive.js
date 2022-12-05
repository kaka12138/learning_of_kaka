// 原始值的响应式
import { ref, toRef } from "../../utils/ref.js"
import { effect, reactive } from "../../utils/reactive-all.js";
const obj = reactive({ foo:1 })
// 原始值的响应方案
const refVal = ref(1);
effect(() => {
    console.log("原始值的响应式", refVal.value)
})
// ref
setTimeout(() => {
    refVal.value = 2
}, 1000)
