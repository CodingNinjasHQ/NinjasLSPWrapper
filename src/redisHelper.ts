import redis from './redis'
import dayjs = require('dayjs');
import UTC = require('dayjs/plugin/utc');
import Timezone = require('dayjs/plugin/timezone');
import AdvancedFormat = require('dayjs/plugin/advancedFormat');
import { ACTIVE, CONNECTION_STATS, CLOSED, LANGUAGE_SERVER_IN_USE, INCOMING, LIVE } from './redisData'
import { ConnectionStatus } from './redisData';

dayjs.extend(UTC);
dayjs.extend(Timezone);
dayjs.extend(AdvancedFormat);

export const logConnectionCount = (language: string, status: ConnectionStatus, connectionCounter?: number) => {
  const redisKey = `${CONNECTION_STATS}:${language}:${dayjs().tz('Asia/Kolkata').format('YYYY-MM-DDTHH:mm')}`
  const totalRedisKey = `${CONNECTION_STATS}:${language}`
  if (status === ConnectionStatus.ACTIVE) {
    redis.hincrby(redisKey, ACTIVE, connectionCounter)
  }
  if (status === ConnectionStatus.LANGUAGE_SERVER_IN_USE) {
    redis.hincrby(redisKey, LANGUAGE_SERVER_IN_USE, 1)
    redis.hincrby(totalRedisKey, LANGUAGE_SERVER_IN_USE, 1)
  }
  if (status === ConnectionStatus.CLOSED) {
    redis.hincrby(redisKey, CLOSED, 1)
    redis.hincrby(totalRedisKey, CLOSED, 1)
  }
  if (status === ConnectionStatus.INCOMING) {
    redis.hincrby(redisKey, INCOMING, 1)
    redis.hincrby(totalRedisKey, INCOMING, 1)
  }
  if (status === ConnectionStatus.LIVE) {
    redis.hincrby(redisKey, LIVE, 2)
  }
  const expiryTimeInSeconds = 60 * 60 * 6;
  redis.expire(redisKey, expiryTimeInSeconds, 'NX');
}