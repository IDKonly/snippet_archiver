import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { SEMRESATTRS_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { logger } from './logger';

const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [SEMRESATTRS_SERVICE_NAME]: 'snippet-archiver',
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

export const startOtel = () => {
  try {
    sdk.start();
    logger.info('OpenTelemetry SDK started');
  } catch (error) {
    logger.error({ error }, 'Failed to start OpenTelemetry SDK');
  }
};

process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => logger.info('OpenTelemetry SDK shut down'))
    .catch((error) => logger.error({ error }, 'Error shutting down OpenTelemetry SDK'))
    .finally(() => process.exit(0));
});
