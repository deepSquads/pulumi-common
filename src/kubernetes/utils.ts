import { Output, all } from '@pulumi/pulumi';
import { version } from '../../package.json';
import { Image, Resources } from './types';
import { AdhocEnv } from '../utils';

export const NodeLabelKeys = {
  Type: 'node.squads.khulnasoft.com/type',
  OptimizedRedis: 'node.squads.khulnasoft.com/optimized-redis',
} as const;

export type NodeLabel = {
  key: (typeof NodeLabelKeys)[keyof typeof NodeLabelKeys];
  value: string;
};

/**
 * A set of common node labels used in the squads.khulnasoft.com infrastructure.
 *
 * Labels are used to identify nodes with specific characteristics, such as high memory or high CPU.
 * A deployment can then be configured to target nodes with specific labels, either just by the key or by the key and value.
 *
 * For more information on node labels, see https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/
 */
export const NodeLabels: { [key: string]: NodeLabel } = {
  HighMem: { key: NodeLabelKeys.Type, value: 'highmem' },
  HighCPU: { key: NodeLabelKeys.Type, value: 'highcpu' },
  OptimizedRedisMaster: {
    key: NodeLabelKeys.OptimizedRedis,
    value: 'master',
  },
  OptimizedRedisReplica: {
    key: NodeLabelKeys.OptimizedRedis,
    value: 'replica',
  },
} as const;

/**
 * Extracts the node labels from a single NodeLabel object, and returns them as a key-value pair.
 */
export const extractNodeLabels = (
  label: NodeLabel,
): { [key: string]: string } => {
  return {
    [label.key]: label.value,
  };
};

/**
 * Common labels used in the squads.khulnasoft.com infrastructure.
 * These labels are used to identify resources created by pulumi, and of which version of the pulumi-common library was used to create them.
 */
export const commonLabels = {
  'app.kubernetes.io/managed-by': 'pulumi',
  'pulumi-common.squads.khulnasoft.com/version': version,
} as const;

/**
 * Returns the image string to be used in a Kubernetes deployment.
 * If a digest is provided, it will be used instead of the tag.
 */
export const image = ({ repository, tag, digest }: Image) => {
  const separator = digest ? '@' : ':';
  return `${repository}${separator}${digest || tag}`;
};

export const configureResources = (
  args: AdhocEnv & {
    resources?: Resources;
  },
): Output<Resources> | undefined => {
  if (args.isAdhocEnv || args.resources === undefined) {
    return undefined;
  }

  return all([args.resources]).apply(([resources]) => {
    return {
      requests: {
        cpu: resources.requests.cpu,
        memory: resources.requests.memory,
      },
      limits: {
        memory: resources.limits.memory,
      },
    };
  });
};
