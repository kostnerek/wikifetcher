export default () => ({
  zimDataPath: process.env.ZIM_DATA_PATH || '/data/zim',
  dbPath: process.env.DB_PATH || '/data/db/wikifetcher.sqlite',
  kiwixContainerName: process.env.KIWIX_CONTAINER_NAME || 'kiwix-serve',
  defaultCron: process.env.DEFAULT_CRON || '0 3 * * 0',
  defaultMaxVersions: parseInt(process.env.DEFAULT_MAX_VERSIONS || '3', 10),
});
