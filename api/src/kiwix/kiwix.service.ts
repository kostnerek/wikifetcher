import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Dockerode = require('dockerode');
import * as path from 'path';

@Injectable()
export class KiwixService {
  private readonly logger = new Logger(KiwixService.name);
  private readonly docker: Dockerode;
  private readonly containerName: string;
  private readonly zimDataPath: string;
  private readonly kiwixImage: string;
  private readonly kiwixPort: string;
  private readonly zimVolumePath: string;
  private readonly dockerNetwork: string;

  constructor(private readonly config: ConfigService) {
    this.docker = new Dockerode({ socketPath: '/var/run/docker.sock' });
    this.containerName = this.config.get<string>('kiwixContainerName')!;
    this.zimDataPath = this.config.get<string>('zimDataPath')!;
    this.kiwixImage = this.config.get<string>('kiwixImage')!;
    this.kiwixPort = this.config.get<string>('kiwixPort')!;
    this.zimVolumePath = this.config.get<string>('zimVolumePath')!;
    this.dockerNetwork = this.config.get<string>('dockerNetwork')!;
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
    const container = this.docker.getContainer(this.containerName);
    await container.stop().catch((err) => {
      this.logger.debug(`stop() ignored: ${(err as Error).message}`);
    });
    await container.remove().catch((err) => {
      this.logger.debug(`remove() ignored: ${(err as Error).message}`);
    });

    const zimArgs = this.buildKiwixArgs(activeZimPaths);
    const newContainer = await this.docker.createContainer({
      Image: this.kiwixImage,
      name: this.containerName,
      Cmd: [...zimArgs],
      ExposedPorts: { '8080/tcp': {} },
      HostConfig: {
        PortBindings: {
          '8080/tcp': [{ HostPort: this.kiwixPort }],
        },
        Binds: [`${this.zimVolumePath}:${this.zimDataPath}:ro`],
        NetworkMode: this.dockerNetwork,
      },
    });

    await newContainer.start();
    this.logger.log('Kiwix container started');
  }
}
