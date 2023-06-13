import * as inquirer from '@inquirer/prompts'

import main from "./main.mjs"

const url = await inquirer.input({
  message:  'Enter a valid URL to ping',
  default:  'https://www.google.com',
  validate: (input) => true
})

const pingRetryInterval = await inquirer.input({
  message:  'Enter default ping retry interval (in seconds)',
  default:  5,
  validate: (input) => Number.isInteger(parseInt(input)) ? true : `Must be an integer number, was [${input}]`
})

console.log(`About to start pinging URL [${url}] with the retry interval [${pingRetryInterval}].`)

const controller = new AbortController()

await main({
  url:             url,
  pingIntervalSec: parseInt(pingRetryInterval),
  signal:          controller.signal
})


