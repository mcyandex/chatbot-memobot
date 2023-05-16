import type { Options } from 'ora';
import type { Writable } from 'stream';
import { fileURLToPath } from 'url';
import path from 'path';

export function getProjectRoot() {
  const currentModulePath = fileURLToPath(import.meta.url);
  const projectRoot = path.resolve(path.dirname(currentModulePath), '..', '..');
  return projectRoot;
}

export function getDefaultOraOptions(output: Writable): Options {
  return {
    text: 'Loading',
    stream: output,
    discardStdin: false,
  };
}

const defaultConfig: Config = {
  numContextDocumentsToRetrieve: 6,
  numMemoryDocumentsToRetrieve: 4,
  useWindowMemory: true,
};

let config: Config = { ...defaultConfig };

export function getConfig(): Config {
  return config;
}

export function setNumContextDocumentsToRetrieve(numContextDocumentsToRetrieve: number) {
  config = { ...config, numContextDocumentsToRetrieve };
}

export function setNumMemoryDocumentsToRetrieve(numMemoryDocumentsToRetrieve: number) {
  config = { ...config, numMemoryDocumentsToRetrieve };
}

export function setUseWindowMemory(useWindowMemory: boolean) {
  config = { ...config, useWindowMemory };
}
