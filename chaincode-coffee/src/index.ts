/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { type Contract } from 'fabric-contract-api';
import { CoffeeSupplyChainContract } from './chaincode';

export const contracts: (typeof Contract)[] = [CoffeeSupplyChainContract];
