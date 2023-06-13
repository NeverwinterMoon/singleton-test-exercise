import axios from "axios"

export default async function main({ url, pingIntervalSec, signal }) {
  return await startPinging({ url: url, pingIntervalSec: pingIntervalSec, counter: 1, signal: signal })
}

async function startPinging({ url, pingIntervalSec, counter, signal }) {
  if (signal && signal.aborted) {
    return
  }

  const pingIntervalMs = pingIntervalSec * 1000

  try {
    const response = await makeRequest(url)
    const responseStatus = response.status

    if (responseStatus === 200) {
      if (counter > 10) {
        console.log('App was down but now is up!')
      }

      console.log(`Ping successful on [${counter}] attempt, the URL [${url}] is alive!`)

      await new Promise(r => setTimeout(r, pingIntervalMs))

      return await main({ url: url, pingIntervalSec: pingIntervalSec, signal: signal })
    } else {
      console.warn(`Ping to URL [${url}] failed. Attempt [${counter}]`)

      return await callRecursively(url, pingIntervalSec, counter, signal)
    }
  } catch (err) {
    console.warn(`Failed to acquire the URL [${url}]. Attempt [${counter}]`)

    return await callRecursively(url, pingIntervalSec, counter, signal)
  }
}

async function callRecursively(url, pingIntervalSec, counter, signal) {
  const pingIntervalMs = pingIntervalSec * 1000

  if (counter % 10 === 0) {
    console.error(`Looks like the application is down: 10 attempts and no successful ping from URL [${url}]`)
  }

  await new Promise(r => setTimeout(r, pingIntervalMs))

  return await startPinging({ url: url, pingIntervalSec: pingIntervalSec, counter: counter + 1, signal: signal })
}

async function makeRequest(url) {
  return axios.get(url)
}
