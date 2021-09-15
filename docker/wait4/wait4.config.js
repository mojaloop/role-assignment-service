module.exports = {
  // format version sem-ver
  // `v{major}.${minor}.${patch}`
  wait4: 'v0.1.0',

  // How many times should we retry waiting for a service?
  retries: 60,

  // How many ms to wait before retrying a service connection?
  // waitMs: 2500,
  waitMs: 10000,

  // services definitions
  services: [
    {
      name: 'central-ledger',

      // list of services to wait for
      wait4: [
        {
          description: 'Kafka broker',
          uri: 'kafka:29092',
          method: 'ncat'
        },
        {
          description: 'MySQL ledger',
          uri: 'mysql:3306',
          method: 'mysql',
          // customized RC setup
          rc: {
            namespace: 'CLEDG',
            configPath: '../config/default.json'
          },
          retries: 60
        },
        {
          description: 'MongoDB object store',
          uri: 'mongodb://objstore:27017/mlos',
          method: 'mongo'
        }
      ]
    },
  ]
}
