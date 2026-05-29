export default () => ({
  zimDataPath: process.env.ZIM_DATA_PATH || '/data/zim',
  dbPath: process.env.DB_PATH || '/data/db/wikifetcher.sqlite',
  kiwixContainerName: process.env.KIWIX_CONTAINER_NAME || 'kiwix-serve',
  kiwixImage: process.env.KIWIX_IMAGE || 'ghcr.io/kiwix/kiwix-serve',
  kiwixPort: process.env.KIWIX_PORT || '8080',
  zimVolumePath: process.env.ZIM_VOLUME_PATH || 'wikifetcher_zim-data',
  dockerNetwork: process.env.DOCKER_NETWORK || 'wikifetcher_default',
  defaultCron: process.env.DEFAULT_CRON || '0 3 * * 0',
  defaultMaxVersions: parseInt(process.env.DEFAULT_MAX_VERSIONS || '3', 10),
});
