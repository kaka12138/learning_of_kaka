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
        patchProps
    } = options
    /**
     * 
     * @param {旧vnode} n1 
     * @param {新vnode} n2 
     * @param {挂载点, 容器} container 
     */
    function patch(n1, n2, container) {
        // 不存在旧节点, 进行挂载操作
        if(!n1) {
            mountElement(n2, container)
        }else {
            // 存在旧节点, 进行patch操作
        }
        
    }
    /**
     * 
     * @param {类似这样的对象： { type: 'h1', children: 'hello' }} vnode 
     * @param {挂载点} container 
     */
    function render(vnode, container) {
        if(vnode) {
            // 存在新节点, 与旧节点一起传递给patch函数, 进行补丁操作
            patch(container._vnode, vnode, container)
        }else {
            // 旧vnode存在, 新vnode不存在,说明是卸载操作(unmount)
            if(container._vnode) {
                container.innerHtml = ''
            }
        }
        // 记录旧vnode
        container._vnode = vnode
    }
    function mountElement(vnode, container) {
        // 创建真实Dom元素
        const el = createElement(vnode.type)
        // 处理子节点
        if(typeof vnode.children === 'string') {
            setElementText(el, vnode.children)
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
    return {
        render
    }
}

/// utils
function shouldSetAsProps(el, key, value) {
    if(el.tagName === "INPUT" && key === 'form') return false
    return key in el
}

// test
const renderer = createRenderer({
    createElement(tag) {
        console.log(`创建${tag}元素`)
        return { tag }
    },
    setElementText(el, text) {
        console.log(`设置${JSON.stringify(el)}的文本内容：${text}`)
        el.textContent = text
    },
    patchProps(el, key, preValue, nextValue) {
        if(shouldSetAsProps(el, key, nextValue)) {
            const type = typeof el[key]
            if(type === 'boolean' && nextValue === '') {
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
const vnode = {
    type: "h1",
    children: "hello"
}
const container = { type: 'root' }
renderer.render(vnode, container)