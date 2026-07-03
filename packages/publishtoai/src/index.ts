#!/usr/bin/env node
import { delegateToPublishtoaiCli } from './delegate-scoped';

const args = process.argv.slice(2);
process.exitCode = delegateToPublishtoaiCli(args.length === 0 ? [] : args);
