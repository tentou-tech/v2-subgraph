import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts/index'

import { Factory as FactoryContract } from '../../generated/templates/Pair/Factory'
import { FACTORY_ADDRESS } from './chain'

export const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000'

export const ZERO_BI = BigInt.fromI32(0)
export const ONE_BI = BigInt.fromI32(1)
export const ZERO_BD = BigDecimal.fromString('0')
export const ONE_BD = BigDecimal.fromString('1')
export const BI_18 = BigInt.fromI32(18)

export const TOPIC_SWAP_V2 = '0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822'
export const TOPIC_MIMBOKU_SWAP = '0x4f2f4eaf0d7c12004ca2eeec2685caddebe6a086084db003dce311d3403e3bb0'
export const TOPIC_WITHDRAWAL = '0x7fcf532c15f0a6db0bd6d0e038bea71d30d808c7d98cb3bf7268a95bf5081b65'

export const factoryContract = FactoryContract.bind(Address.fromString(FACTORY_ADDRESS))
