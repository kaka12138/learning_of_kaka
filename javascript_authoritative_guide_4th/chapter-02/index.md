### HTML中的JavaScript
* 常用属性
    - async: 加载解析HTML时, 异步下载外部脚本, 脚本之间不要相互等待, 谁先下载完成谁执行, 可能会阻塞HTML的解析, 可能不会
    - defer: 加载解析HTML时, 异步下载外部脚本, 执行时机是延迟到文档完全被解析和显示之后再执行, 不阻塞HTML的解析,脚本之前要相互等待, 排在前面的脚本先执行(即使前面的脚本后下载完成), 
    - type: 脚本语言的内容类型(MIME类型)。 如果这个值是module，则代码会被当成ES6模块，而且只有这时候代码中才能出现import和export关键字
    - crossorigin: 配置相关请求的CORS（跨源资源共享）设置。默认不使用CORS。可选anonymous和use-credentials值
    - 注意：默认情况下, 不加async和defer属性时, 下载脚本时会阻塞HTML的解析, 并且下载和执行完成脚本才会接续解析HTML