const { Worker, isMainThread, parentPort, workerData } = require('worker_threads')
const os = require('os')

let index = 0
let PRGAExcuteThread = null
// 一定要加上这个，不然会产生递归，创建无数线程
if (isMainThread) {
  // 避免消耗光资源，加一用于后续的预加载RC4的位置
  const workerNum = parseInt(os.cpus().length / 2 + 1)
  const workerList = []
  for (let i = workerNum; i--; ) {
    const worker = new Worker('./utils/PRGAThread.js', {
      workerData: 'work-name-' + i,
    })
    workerList[i] = worker
  }

  PRGAExcuteThread = function (data) {
    return new Promise((resolve, reject) => {
      const worker = workerList[index++ % workerNum]
      worker.once('message', (res) => {
        resolve(res)
      })
      worker.once('error', reject)
      // 发送数据
      worker.postMessage(data)
    })
  }
}

// 如果是线程执行了这个文件，就开始处理
if (!isMainThread) {
  // 异步线程去计算这个位置
  const PRGAExcute = function (data) {
    let { sbox: S, i, j, position } = data
    for (let k = 0; k < position; k++) {
      i = (i + 1) % 256
      j = (j + S[i]) % 256
      // swap
      const temp = S[i]
      S[i] = S[j]
      S[j] = temp
    }
    // return this position info
    return { sbox: S, i, j }
  }
  // workerData 由主线程发送过来的信息
  parentPort.on('message', (data) => {
    const startTime = Date.now()
    const res = PRGAExcute(data)
    parentPort.postMessage(res)
    const time = Date.now() - startTime
    console.log('@@@PRGAExcute-end', data.position, Date.now(), '@time:' + time, workerData)
  })
}
module.exports = PRGAExcuteThread