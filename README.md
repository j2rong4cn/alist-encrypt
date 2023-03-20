# Alist-encrypt

这个项目主要是对 alist 的服务进行代理，提供 webdav 的加解密功能。支持 alist 网页在线播放加密的视频，查看加密的图片等功能，同时在 webdav 下的操作透明，自动实现文件资源的加解密。

## 一、需求背景

AList 是一个支持多种存储、云网盘，支持网页浏览和提供 WebDAV 服务的应用程序。最近的阿里云盘很火，因为不限速，所以不少人使用阿里云盘配合 alist 当做个人的影院，随时在线观看视频。

国内的云盘有很多，除了阿里云盘还有天翼云盘也是不限速的，但是几乎都存在一个问题，敏感资源会被删除，相信很多人经历文件被删除掉的噩梦。那么有没有什么办法可以避免这样的问题呢，最简单的方案就是加密后上传。那么就有大局限性，不能实时在线播放视频，当然也有一些方案可以做到。加密后的文件分享也存在一定的不方便（密码不方便对外提供）。

Alist-encrypt 就是为了解决这个问题，它可以结合 webdav 服务器进行使用，在文件上传的时候进行加密，文件下载的时候进行解密，由于使用的是流加密方案，所以可以很轻松实现在线播放视频，浏览图片、文件等。目前主流的方案都是使用 alist 来实现网盘 webdav 的服务，所以 Alist-encrypt 支持 alist 服务，并且优先支持它的适配，支持网页版在线播放视频等功能。

关于这个项目的使用场景，对文件安全隐私有一定的需求，防止云盘扫描删除，有实时播放视频和下载的需求。

## 三、实现原理

项目的实现比较简单，原始孵化的项目地址在这里：[flow-encryption](https://github.com/traceless/flow-encryption) 它有描述算法的实现，代理服务的实现思路，也有基础版本的代码实现，可以学习参考。

## 二、安装使用

### 下载运行

需要先安装nodejs的环境，具体安装方法，请参考网上的教程

1、下载此项目，进入 node-proxy 目录执行

> npm i

2、修改 conf/config.js 配置文件，添加 alist 服务地址端口，添加 alist 的网盘中需要进行加密的文件夹路径。

3、然后执行启动命令

> node app.js

最后就打开代理服务器地址 http://127.0.0.1:5344，即可完全代理访问到alist服务。

### docker 安装

运行拉取镜像命令

> docker pull prophet310/alist-encrypt:beta

执行启动容器即可

> docker run -d -p 5344:5344 -v /etc/conf:/node-proxy/conf --name=alist-encrypt prophet310/alist-encrypt:beta

启动后打开/ect/conf/config.json文件，可以修改默认配置，然后再重启docker即可。

```
{
    port: 5344,  // 代理服务器的端口
    alistServer : {
        path: '/*', // 默认就是代理全部，不建议修改这里
        serverHost: '127.0.0.1',
        serverPort: 5244,
        flowPassword: '123456', // 加密的密码
        encPath: ['/aliy/test/*', '/aliy/test/*', '/tianyi/*'], // 注意不需要添加/dav 前缀了，程序会自己处理alist的逻辑
    }

    /** 支持其他普通的webdav，当然也可以挂载alist的webdav，如果你想不同目录不同密码，那么就可以使用这个方式扩展 */
    webdavServer : [
    {
        name: 'aliyun',
        path: '/dav/*', // 代理全部路径，不能是"/proxy/*"，系统已占用。如果设置 "/*"，那么上面的alist的配置就不会生效哦
        enable: false, // 是否启动代理
        serverHost: '127.0.0.1',
        serverPort: 5244,
        flowPassword: '123456', // 加密的密码
        encPath: ['/dav/aliyun/*', '/dav/189cloud/*'], // 要加密的目录，不能是 "/*" 和 "/proxy/*"，因为已经占用
    },
    ]
}
```

### 操作使用

1、alist 原本网页上的所有的操作都可以正常使用，因为 Alist-encrypt 它是透明代理，所以你所有的操作请求都是透传到 alist 上的，除了某些需要加密上传的操作和在线解密播放的操作。

2、你可以在 webdav 客户端上进行文件上传，如果设置了加密的文件夹目录，那么上传的文件就会被加密，在云盘上下载后会无法打开。但是你使用 Alist-encrypt 代理的 alist 服务还是一样可以正常下载查看，在线播放视频，查看图片等，不管是在 webdav 还是网页上都是正常使用。

3、除了可配置 alist 服务，也可以配置其他的 webdav 服务，同样也是在 conf/config.js 中。注意的是它的配置优先级高于 alist，会覆盖alist的代理路径，注意错开路径。如果无法避免和 alist 冲突，那么建议再运行多一个代理服务。

## 四、已支持&待完善

### 已支持的功能

1. 支持alist网页在线播放加密的视频，查看图片，在线下载等。
2. 支持alist网页跳转到 IINA，VLC，Infuse 等播放器上进行播放。
3. 在 webdav 客户端上的所有操作不会受到影响，自动加解密，可播放视频、查看图片。

### 待实现功能

1. 提供界面配置 alist 和 webdav 的信息。
2. 提供 cli 程序进行文件解密\加密，用于分享对方在下载后解密。
3. 提供原文件和加密文件找回加密钥匙encode。
4. 可以把未加密(或已加密)的文件夹 A（或文件） -> 转存到加密文件夹 B 中，用于转存别人分享的文件。
5. 设置不同目录不同密码，后续会支持，当前可以使用配置多个webdav服务来支持。

### 已知问题

- 加密文本还不能在线看，当前建议直接下载看，后续会支持。
- 阿里云盘无法使用 Aliyun Video Previewer 进行播放，请选择 Video 方式播放、

### 局限性

- 目前的实现还很基础，判断文件是否云盘资源是通过 https 来判断，所以你的 Alist-encrypt 本身就不能挂载到 https 上，后续可以根据 response 的 header 来分析。
- 由于解密是代理了云盘下载的流量，所以如果你是使用穿透内网的方式访问 Alist-encrypt 服务，那么很明显你的穿透带宽会影响你的文件的访问速度。

## 五、FAQ

### 1、为何不使用ASE对称加密算法，R4C 算法。

- 因为对称加密是块加密，理论上对齐数据块是能实现的流加密的，但是需要知道文件的长度。在线播放的时候，跳转播放位置时，也需要对齐字节才能正常播放，加密和解密的业务实现比较复杂一些，实现起来头大。如果你对文件安全性要求很高，那么并不推荐这项目来加密你的数据，R4C 也差不多。

- 对称加密不方便分享密匙给对方，而此算法的加解密钥匙 encode（decode） 是可以对外提供的，用于分享文件给对方。

设计这个项目的初衷本身就是为了躲避云盘的扫描的，文件是可以分享给对方查阅的。AES加密或非对称加密更适合私人资料使用。对文件的安全要求不高的情况下，推荐使用这项目，它可以让你轻松躲过网盘的文件审核，也可以让你轻松找回密码（有一个原文件即可）。

还有基于这个算法的升级版，可以根据文件长度实现不同文件加密的钥匙不一样，这个后续再考虑是否有实现的必要。因为会导致无法找回文件夹密码了，同样也不方便分享整个文件夹了，得不偿失，还要考虑是否有其他使用的影响。

### 2、代理服务器性能

目前还没测试它实际的性能情况，虽然是使用 nodejs 实现的，但是它实在是没多少业务压力，理论上是没多少损失的，这个后续会进行验证。

### 3、会考虑其他语言的实现吗？

暂时不会考虑。因为这个项目比较简单，无论是使用go，nodejs应该都是相当容易现实的，它的业务不会膨胀到需要用java语言来实现。对于性能的要求也不一定要用到go来支持。选nodejs的原因是go语言我并不是特别熟悉，而且nodejs在web开发效率上并不输go语言，至于性能方面还有待验证。

### 4、项目后续的安排

当前版本还不具备生产使用的条件，只是基本实现部分功能，还有很多网盘没测试，预计再迭代2个版本才能看到更完整的功能。此项目会关注alist那边的更新，持续适配alist，也希望大家多多支持，提些建议。即使alist推出类似的功能，此项目依然存在使用的价值，毕竟它也可以支持其他的webdav。