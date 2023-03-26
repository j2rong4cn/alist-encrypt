import { Worker, isMainThread, parentPort, workerData } from 'worker_threads'
import os from 'os'

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
    let index = 0
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
    // 记录位置，下次继续伪随机
    return { sbox: S, i, j }
  }
  // workerData 由主线程发送过来的信息
  parentPort.on('message', (data) => {
    const startTime = Date.now()
    console.log('@@@PRGAExcute-strat', data.position, Date.now(), workerData)
    const res = PRGAExcute(data)
    parentPort.postMessage(res)
    console.log('@@@PRGAExcute-end', data.position, '@time:' + (Date.now() - startTime), workerData)
  })
}
export default PRGAExcuteThread