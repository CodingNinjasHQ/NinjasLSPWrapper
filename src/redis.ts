import { default as Redis } from "ioredis"

let redis: any;
let config = {
  host: process.env.REDIS_DB_HOST,
  port: parseInt(process.env.REDIS_DB_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD
}
redis = new Redis(config);

redis.on('connect', () => {
  console.log('Redis client is initiating a connection to the server.');
});

redis.on('ready', () => {
  console.log('Redis client successfully initiated connection to the server: ', config);
});

redis.on('reconnecting', () => {
  console.log('Redis client is trying to reconnect to the server...', config);
});

redis.on('error', (err: any) => console.log('Redis Client Error', config, err));

export default redis;