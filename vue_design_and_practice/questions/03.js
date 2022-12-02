const child = {bar:2, get bar() {
    console.log("get in child")
    return this.bar
}} 
const parent = { bar:1,  get bar() {
    console.log("get in parent")
    return this.bar
}, set bar(val) {
    console.log("set in parent")
    this.bar = val
} }
Object.setPrototypeOf(child, parent)

Reflect.get(child, 'bar')
// Reflect.set(child, 'bar', 2)

