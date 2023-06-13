import axios from "axios"
import {expect} from 'chai'
import {describe, it} from 'mocha'
import sinon from "sinon"

import main from "./main.mjs"

describe('main.mjs spec', function() {

  let abortController
  let getStub
  let clock

  beforeEach(() => {
    abortController = new AbortController()

    getStub = sinon.stub(axios, 'get')
    sinon.stub(console, 'log')
    sinon.stub(console, 'warn')
    sinon.stub(console, 'error')

    clock = sinon.useFakeTimers({
      shouldAdvanceTime: true
    })
  })

  it('logs warning when status [500] and keeps on pinging', async () => {
    /* Given */
    const url = 'https://google.com'
    getStub.resolves({ status: 500 })

    /* When */
    const _ = main({ url: 'https://google.com', pingIntervalSec: 1 })
    await clock.tickAsync()

    /* Then */
    expect(console.warn.callCount).to.equal(1)
    expect(console.warn.lastCall.firstArg)
      .to.equal(`Ping to URL [${url}] failed. Attempt [1]`)

    /* When */
    await clock.nextAsync()
    expect(console.warn.callCount).to.equal(2)
    expect(console.warn.lastCall.firstArg)
      .to.equal(`Ping to URL [${url}] failed. Attempt [2]`)
  })

  it('logs warning when URL is unreachable and keeps on pinging', async () => {
    /* Given */
    const url = 'https://google.com'
    getStub.rejects(new Error('ECONNREFUSED'))

    /* When */
    const _ = main({ url: 'https://google.com', pingIntervalSec: 1 })
    await clock.tickAsync()

    /* Then */
    expect(console.warn.callCount).to.equal(1)
    expect(console.warn.lastCall.firstArg)
      .to.equal(`Failed to acquire the URL [${url}]. Attempt [1]`)

    /* When */
    await clock.nextAsync()
    expect(console.warn.callCount).to.equal(2)
    expect(console.warn.lastCall.firstArg)
      .to.equal(`Failed to acquire the URL [${url}]. Attempt [2]`)
  })

  it('logs success when ping is successful and keeps on pinging', async () => {
    /* Given */
    const url = 'https://google.com'
    getStub.resolves({ status: 200 })

    /* When */
    const _ = main({ url: url, pingIntervalSec: 1, signal: abortController.signal })
    await clock.tickAsync()

    /* Then */
    expect(console.log.callCount).to.equal(1)
    expect(console.log.lastCall.firstArg)
      .to.equal(`Ping successful on [1] attempt, the URL [${url}] is alive!`)

    await clock.nextAsync()
    expect(console.log.callCount).to.equal(2)
    expect(console.log.lastCall.firstArg)
      .to.equal(`Ping successful on [1] attempt, the URL [${url}] is alive!`)
  })

  it('logs multiple failures when status [500], logs app is done after 10 attempts, logs app is alive when status is finally [200], logs success', async () => {
    /* Given */
    const url = 'https://google.com'
    getStub.resolves({ status: 500 })

    /* When */
    const _ = main({ url: url, pingIntervalSec: 1, signal: abortController.signal })
    await clock.tickAsync()

    /* Then */
    expect(console.warn.callCount).to.equal(1)
    expect(console.warn.lastCall.firstArg).to.equal(`Ping to URL [${url}] failed. Attempt [1]`)

    /* When going through another interval */
    await clock.nextAsync()

    expect(console.warn.callCount).to.equal(2)
    expect(console.warn.lastCall.firstArg).to.equal(`Ping to URL [${url}] failed. Attempt [2]`)

    /* When going through 8 more intervals = 10 in total */
    await Promise.all(Array.from({length: 8}).map(() => clock.nextAsync()))

    expect(console.warn.callCount).to.equal(10)
    expect(console.warn.lastCall.firstArg).to.equal(`Ping to URL [${url}] failed. Attempt [10]`)

    expect(console.error.callCount).to.equal(1)
    expect(console.error.firstCall.firstArg).to.equal(`Looks like the application is down: 10 attempts and no successful ping from URL [${url}]`)

    /* When going through another interval */
    await clock.nextAsync()

    expect(console.warn.callCount).to.equal(11)
    expect(console.warn.lastCall.firstArg).to.equal(`Ping to URL [${url}] failed. Attempt [11]`)

    getStub.resolves({ status: 200 })

    await clock.nextAsync()

    expect(console.log.callCount).to.equal(2)
    expect(console.log.getCall(0).firstArg).to.equal('App was down but now is up!')
    expect(console.log.getCall(1).firstArg).to.equal(`Ping successful on [12] attempt, the URL [${url}] is alive!`)

    await clock.nextAsync()
    expect(console.log.callCount).to.equal(3)
    expect(console.log.lastCall.firstArg).to.equal(`Ping successful on [1] attempt, the URL [${url}] is alive!`)
  })

  afterEach(() => {
    abortController.abort()

    sinon.restore()
    clock.restore()
  })
})
