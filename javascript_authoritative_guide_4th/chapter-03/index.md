### 变量声明
1. var
    - var声明提升(变量提升/hoist): 把变量的声明提升到函数作用域的顶部
    ```JavaScript
        function foo() {
            console.log(age) // undefined
            var age = 26
        }
        // 等价于
        function foo() {
            var age
            console.log(age)
            var age = 26
        }
    ```
    - 多次重复声明同一个变量不会报错
2. let
    - let声明的是块级作用域, 块作用域是函数作用域的子集
    - 不会产生变量提升
    - 暂时性死区：定义变量之前就引用了变量
    - 全局声明：与var关键字不同，使用let在全局作用域中声明的变量不会成为window对象的属性（var声明的变量则会）
    - for循环中的let声明: for循环定义的迭代变量会渗透到循环体外部
    ```JavaScript
        for (var i = 0; i < 5; i++) {}
        console.log(i) // 5
        
        for (let i = 0; i < 5; i++) {}
        console.log(i) // 报错： i未定义
    ```
3. const
    - 与let基本相同
    - 不同点：声明时必须同时赋值, 并且不可修改(如果const声明的变量是引用类型(如：对象), 是可以修改对象的属性)
### 数据类型
1. 基本(简单)数据类型(原始类型)：String Number Boolean Undefined Null Symbol
2. 复杂数据类型(引用类型): Object --- 一种无序名值对的集合
3. typeof: 确定变量的数据类型
    - typeof null: 特殊值null被认为是一个对空对象的引用
    - 可以用于区分函数('function')和对象('object'), 但是函数本质上是'object'