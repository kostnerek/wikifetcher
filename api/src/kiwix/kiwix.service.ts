import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Dockerode from 'dockerode';
import * as path from 'path';

@Injectable()
export class KiwixService {
  private readonly logger = new Logger(KiwixService.name);
  private readonly docker: Dockerode;
  private readonly containerName: string;
  private readonly zimDataPath: string;

  constructor(private readonly config: ConfigService) {
    this.docker = new Dockerode({ socketPath: '/var/run/docker.sock' });
    this.containerName = this.config.get<string>('kiwixContainerName')!;
    this.zimDataPath = this.config.get<string>('zimDataPath')!;
  }

  buildKiwixArgs(relativePaths: string[]): string[] {
    return relativePaths.map((p) => path.join(this.zimDataPath, p));
  }

  async getStatus(): Promise<{ running: boolean; state: string }> {
    try {
      const container = this.docker.getContainer(this.containerName);
      const info = await container.inspect();
      return {
        running: info.State.Running,
        state: info.State.Status,
      };
    } catch {
      return { running: false, state: 'not_found' };
    }
  }

  async restart(activeZimPaths: string[]): Promise<void> {
    this.logger.log(
      `Restarting Kiwix with ZIM files: ${activeZimPaths.join(', ')}`,
    );
    try {
      const container = this.docker.getContainer(this.containerName);
      await container.stop().catch(() => {});
      await container.remove().catch(() => {});
    } catch {
      this.logger.warn('No existing Kiwix container to remove');
    }

    const zimArgs = this.buildKiwixArgs(activeZimPaths);
    const container = await this.docker.createContainer({
      Image: 'ghcr.io/kiwix/kiwix-serve',
      name: this.containerName,
      Cmd: [...zimArgs],
      ExposedPorts: { '8080/tcp': {} },
      HostConfig: {
        PortBindings: {
          '8080/tcp': [{ HostPort: process.env.KIWIX_PORT || '8080' }],
        },
        Binds: [`${process.env.ZIM_VOLUME_PATH || 'wikifetcher_zim-data'}:${this.zimDataPath}:ro`],
        NetworkMode: process.env.DOCKER_NETWORK || 'wikifetcher_default',
      },
    });

    await container.start();
    this.logger.log('Kiwix container started');
  }
}
