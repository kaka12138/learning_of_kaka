/**
 * 创建渲染器
 * @param { 抽离为可配置的, 不依赖于某一个环境 } options 
 * @returns 
 */
 function createRenderer(options) {
    const {
        createElement,
        setElementText,
        insert,
        patchProps,
        createText,
        setText,
    } = options
    /**
     * 
     * @param {旧vnode} n1 
     * @param {新vnode} n2 
     * @param {挂载点, 容器} container 
     */
    function patch(n1, n2, container) {
        // 处理节点类型不同(标签不同)的情况: 先卸载旧节点,再挂载新节点
        if(n1 && n1.type !== n2.type) {
            unmount(n1)
            n1 = null
        }
        
        const { type } = n
        // 根据节点类型做更新操作
        if(type === 'string') {
            // 普通节点
            if(!n1) {
                mountElement(n2, container)
            }else {
                // 更新操作
                patchElement(n1, n2)
            }
            
        } else if(type === Text) {
            // 文本节点
            if(!n1) {
                // 没有旧节点,直接挂载
                const el = n2.el = createText(n2.children)
                insert(el, container)
            }else {
                const el = n2.el = n1.el
                // 存在旧节点,更新节点
                if(n2.children !== n1.children) {
                    setText(el, n2.children)
                }
            }
        } else if(type === Fragment) {
            // Fragment节点：本身不渲染, 只渲染其children
            if(!n1) {
                n2.forEach(child => patch(null, child, container))
            }else {
                patchChildren(n1, n2, container)
            }
        } else if(type === 'object') {
            // 组件节点
            
        } else if(type === 'xxx') {
            // 其他类型

        }    
    }
    /**
     * 
     * @param {类似这样的对象： { type: 'h1', children: 'hello' }} vnode 
     * @param {挂载点, 本质上是Dom对象} container 
     */
    function render(vnode, container) {
        if(vnode) {
            // 存在新节点, 与旧节点一起传递给patch函数, 进行补丁操作
            patch(container._vnode, vnode, container)
        }else {
            // 旧vnode存在, 新vnode不存在,说明是卸载操作(unmount)
            if(container._vnode) {
                // 卸载旧的,真实Dom
                unmount(container._vnode)
            }
        }
        // 记录旧vnode
        container._vnode = vnode
    }
    /**
     * 挂载元素
     * @param {*} vnode 
     * @param {*} container 
     */
    function mountElement(vnode, container) {
        // 创建真实Dom元素, 并将虚拟Dom和真实Dom建立联系
        const el = vnode.el = createElement(vnode.type)
        // 处理子节点
        if(typeof vnode.children === 'string') {
            setElementText(el, vnode.children)
        }else if(Array.isArray(vnode.children)) {
            vnode.children.forEach(child => patch(null, child, el))
        }

        // 处理props
        if(vnode.props) {
            for(const key in vnode.props) {
                patchProps(el, key, null, vnode.props[key])
            }
        }
        // 将元素插入到容器
        insert(el, container)
        
    }
    /**
     * 卸载真实Dom
     * @param {虚拟Dom} vnode 
     */
    function unmount(vnode) {
        // vnode为Fragment类型, 卸载其children
        if(vnode.type === Fragment) {
            vnode.children.forEach(child => unmount(child))
            return
        }
        const parent = vnode.el.parentNode
        if(parent) {
            parent.removeChild(vnode.el)
        }
    }
    /**
     * 
     * @param {旧vnode} n1 
     * @param {新vnode} n2 
     */
    function patchElement(n1, n2) {
        const el = n2.el = n1.el // 这里取的是旧节点的Dom
        const oldProps = n1.props
        const newProps = n2.props

        // 1.更新props, 放到旧的el上
        for(const key in newProps) {
            // 更新新旧节点同名的属性
            if(newProps[key] !== oldProps[key]) {
                patchProps(el, key, oldProps[key], newProps[key])
            }
        }
        for(const key in oldProps) {
            // 添加在旧节点而不在新节点的属性
            if(!(key in newProps)) {
                patchProps(el, key, oldProps[key], null)
            }
        }

        // 2.更新children
        patchChildren(n1, n2, el)
    }
    /**
     * 更新子节点
     * @param {旧} n1 
     * @param {新: 没有子节点, 文本节点, 一组节点} n2 
     * @param {*} container 
     */
    function patchChildren(n1, n2, container) {
        if(typeof n2.children === "string") {
            // 新节点: 文本节点, 旧节点：一组节点
            if(Array.isArray(n1.children)) {
                // 卸载其子节点
                n1.children.forEach(child => unmount(child))
            }
            // 其他情况：只需要将新的文本内容设置给容器元素即可
            setElementText(container, n2.children)
        }else if(Array.isArray(n2.children)) {
            // 新节点：一组节点
            
            // 旧节点：也是一组节点
            if(Array.isArray(n1.children)) {
                // TODO: diff算法比较新旧节点
                // 问题：新节点数量可能多于或者少于旧节点的数量
                const oldChildren = n1.children
                const newChildren = n2.children

                // 记录查找过程中的最大索引(比索引小的, 标识需要移动该节点, 否则重新赋值最大索引)
                let lastIndex = 0
                // 移动复用节点的前提：找到相同的节点(可复用的节点),先更新其内容
                for(let i = 0; i < newChildren.length; i++) {
                    const newVnode = newChildren[i]
                    for(let j = 0; i < oldChildren.length; j++) {
                        const oldVnode = oldChildren[j]
                        if(newVnode.key === oldVnode.key) {
                            patch(oldVnode, newVnode, container)
                            // 说明：索引小于最大节点, 需要移动该节点
                            if(j < lastIndex) {
                                
                            } else {
                                lastIndex = j
                            }
                            break; // 跳出循环, 避免找到后的无效遍历
                        }
                    }
                }
                
            } else {
                // 其他两种情况：清除旧节点内部内容, 挂载新节点的内心
                setElementText(container, "")
                n2.children.forEach(child => patch(null, child, container))
            }
        }else {
            // 新节点：没有子节点
            if(Array.isArray(n1.children)) {
                n1.children.forEach(child => unmount(child))
            }else if(typeof n1.children === "string") {
                setElementText(container, n1.children)
            }
        }
    }

    return {
        render
    }
}

/// utils
function shouldSetAsProps(el, key, value) {
    if(el.tagName === "INPUT" && key === 'form') return false
    return key in el
}
/**
 * 处理props中的class, 转成字串
 * @param {*} classVal 
 * @returns 
 */
function normalizeClass(classVal) {
    const type = typeof classVal
    if(type === 'string') {
        return classVal
    }else if(Array.isArray(classVal)) {
        return [...new Set(classVal.map(c => normalizeClass(c)))].join(" ")
    }else if(type === 'object') {
        return [...new Set(Object.keys(classVal).map(key => classVal[key] ? key : ''))].join(" ").trim()
    }
}

// test
const renderer = createRenderer({
    createElement(tag) {
        console.log(`创建${tag}元素`)
        return { tag }
    },
    createText(text) {
        return document.createTextNode(text)
    },
    setText(el, text) {
        el.nodeValue = text
    },
    createComment(comment) {
        return document.createComment(comment)
    },
    setElementText(el, text) {
        console.log(`设置${JSON.stringify(el)}的文本内容：${text}`)
        el.textContent = text
    },
    patchProps(el, key, preValue, nextValue) {
        if(shouldSetAsProps(el, key, nextValue)) {
            const type = typeof el[key]
            // 处理事件
            if(/^on/.test(key)) {
                // 将el.vei定义成对象, 避免不同事件的屏蔽问题
                const invokers = el.vei || (el.vei = {})
                // 获取伪造的事件处理函数invoker
                let invoker = invokers[key]
                const name = key.slice(2).toLowerCase()
                if(nextValue) {
                    if(!invoker) {
                        invoker = el.vei[key] = (e) => {
                            // 处理事件冒泡？：阻止所有绑定时间晚于事件触发时间的事件处理函数的执行。
                            if(e.timeStamp < invoker.attached) return
                            // 处理多个事件回调处理函数的情况, 遍历调用回调函数
                            if(Array.isArray(invoker.value)) {
                                invoker.value.forEach(fn => fn(e))
                            }else {
                                invoker.value(e)
                            }
                        }
                        invoker.value = nextValue
                        // 记录事件绑定时间
                        invoker.attached = performance.now()
                        el.addEventListener(name, invoker)
                    }else {
                        // 事件变化时, 更新invoker, 可以减少removeEventListener操作
                        invoker.value = nextValue
                    }
                }else if(invoker) {
                    // 移除事件
                    el.removeEventListener(name, invoker)
                }
                
            }else if(key === 'class') {
                // 处理class属性
                el.className = nextValue || ""
            }else if(type === 'boolean' && nextValue === '') {
                el[key] = true
            }else {
                el[key] = nextValue
            }
        }else {
            el.setAttribute(key, nextValue)
        }
    },
    // 在特定的parent下添加指定元素, anchor为null将被插入到parent的末尾
    insert(el, parent, anchor = null) {
        console.log(`将${JSON.stringify(el)}, 添加到${JSON.stringify(parent)}`)
        parent.children = el
    }
})

// 节点描述
// const vnode = {
//     type: "h1",
//     children: "hello"
// }

// vnode描述事件
// const vnode = {
//     type: 'p',
//     props: {
//         onClick: [
//             () => {
//                 alert('clicked1')
//             },
//             () => {
//                 alert('clicked2')
//             }
//         ],
//         onContextmenu: [
//             () => {
//                 alert("onContextmenu")
//             }
//         ]
//     },
//     children: 'text'
// }

// 描述文本节点, 注释节点, Fragment
const Text = Symbol()
const Comment = Symbol()
const Fragment = Symbol()
const textVnode = {
    type: Text,
    children: "文本节点内容"
}
const commentVnode = {
    type: Comment,
    children: "注释节点内容"
}
const fragmentVnode= {
    type: Fragment,
    children: [
        { type: 'li', children: 'text1' },
        { type: 'li', children: 'text2' },
        { type: 'li', children: 'text3' },
    ]
}
const listVnode = {
    type: 'ul',
    children: [
        {
            type: Fragment,
            children: [
                { type: 'li', children: 'text1' },
                { type: 'li', children: 'text2' },
                { type: 'li', children: 'text3' },
            ]
        }
    ]
}

const container = { type: 'root' }
renderer.render(vnode, container)


// diff 算法 记录
/*
    第一种 更新：无法原地复用旧节点
        const oldLen = oldChildren.length
        const newLen = newChildren.length
        const commonLen = Math.min(oldLen, newLen)
        // 取两者中短的长度进行遍历更新
        for(let i = 0; i < commonLen; i++) {
            patch(oldChildren[i], newChildren[i], container)
        }

        // 新增节点
        if(newLen > oldLen) {
            for(let i = commonLen; i < newLen; i++) {
                patch(null, newChildren[i], container)
            }
        }else if(newLen < oldLen) {
            // 卸载节点
            for(let i = commonLen; i < oldLen; i++) {
                unmount(oldChildren[i])
            }
        }
*/
/*
    新 --- 旧
    2      1
    1      2
    3      3
    l = 1 : 2
    l = 1 : 1 - 2
    l = 3 : 1 - 2 - 3, 1 - 3 - 2

    l = 0
    1 --- l = 1
    2 --- l = 1
    3 --- l = 2

*/
