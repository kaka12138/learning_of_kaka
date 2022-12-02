### Iterator --- 迭代器或遍历器
- Iterator
    1. 定义:
        1.1 遍历器（Iterator）就是这样一种机制。它是一种接口，为各种不同的数据结构提供统一的访问机制
        1.2 任何数据结构只要部署 Iterator 接口，就可以完成遍历操作
    2. 作用：
        2.1 为各种数据结构，提供一个统一的、简便的访问接口
        2.2 使得数据结构的成员能够按某种次序排列
        2.3 ES6 创造了一种新的遍历命令for...of循环，Iterator 接口主要供for...of消费
    3. 遍历过程
        3.1 创建一个指针对象，指向当前数据结构的起始位置, 遍历器对象本质就是一个指针对象
        3.2 第一次调用指针对象的next方法，可以将指针指向数据结构的第一个成员
        3.3 第二次调用指针对象的next方法，指针就指向数据结构的第二个成员
        3.4 不断调用指针对象的next方法，直到它指向数据结构的结束位置
    4. 默认的Iterator接口
        4.1 ES6 规定，默认的 Iterator 接口部署在数据结构的Symbol.iterator属性，
            或者说，一个数据结构只要具有Symbol.iterator属性，就可以认为是“可遍历的”
    5. 具有Iterator接口的原生数据结构：Array, Map, Set, String, TypedArray, 函数的arguments对象, NodeList对象
    6. 默认调用 Iterator 接口（即Symbol.iterator方法）的场景：
        6.1 for...of 循环
        6.2 解构赋值
        6.3 扩展运算符
        6.4 yield
        6.5 由于数组的遍历会调用遍历器接口，所以任何接受数组作为参数的场合，其实都调用了遍历器接口
            Array.from(), Map(), Set(), WeakMap(), WeakSet(), Promise.all(), Promise.race()
        
    