import { PollingEventDriver } from './event-drivers/Polling'
import testClient from './examples/Local'

const environmentId = process.env.ENVIROMENT_ID || 'dev_env_1234567890'

const pollDriver = new PollingEventDriver({
  interval: 1000,
  environmentId,
})

testClient.mount(pollDriver)

pollDriver.start()
