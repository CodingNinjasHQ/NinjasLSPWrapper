import redis from './redis'
import dayjs = require('dayjs');
import UTC = require('dayjs/plugin/utc');
import Timezone = require('dayjs/plugin/timezone');
import AdvancedFormat = require('dayjs/plugin/advancedFormat');
import { ACTIVE, CONNECTION_STATS, CLOSED, LANGUAGE_SERVER_IN_USE } from './redisData'
import { ConnectionStatus } from './redisData';

dayjs.extend(UTC);
dayjs.extend(Timezone);
dayjs.extend(AdvancedFormat);

export const logConnectionCount = (language: string, status: ConnectionStatus) => {
  const redisKey = `${CONNECTION_STATS}:${language}:${dayjs().tz('Asia/Kolkata').format('YYYY-MM-DDTHH:mm')}`
  const totalRedisKey = `${CONNECTION_STATS}:${language}`
  if (status === ConnectionStatus.CONNECTED) {
    redis.hincrby(redisKey, ACTIVE, 1)
    redis.hincrby(totalRedisKey, ACTIVE, 1)
  }
  if (status === ConnectionStatus.LANGUAGE_SERVER_IN_USE) {
    redis.hincrby(redisKey, LANGUAGE_SERVER_IN_USE, 1)
    redis.hincrby(totalRedisKey, LANGUAGE_SERVER_IN_USE, 1)
  }
  if (status === ConnectionStatus.CLOSED) {
    redis.hincrby(redisKey, CLOSED, 1)
    redis.hincrby(totalRedisKey, CLOSED, 1)
  }
}