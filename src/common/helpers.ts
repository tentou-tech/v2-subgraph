/* eslint-disable prefer-const */
import { Address, BigDecimal, BigInt, Bytes, log } from '@graphprotocol/graph-ts'

import { ERC20 } from '../../generated/Factory/ERC20'
import { ERC20NameBytes } from '../../generated/Factory/ERC20NameBytes'
import { ERC20SymbolBytes } from '../../generated/Factory/ERC20SymbolBytes'
import { Token, User } from '../../generated/schema'
import { SKIP_TOTAL_SUPPLY, TokenDefinition } from './chain'
import { ONE_BI, ZERO_BD, ZERO_BI } from './constants'
import { getStaticDefinition } from './tokenDefinition'
import { findEthPerToken } from './pricing'

export function exponentToBigDecimal(decimals: BigInt): BigDecimal {
  let bd = BigDecimal.fromString('1')
  for (let i = ZERO_BI; i.lt(decimals); i = i.plus(ONE_BI)) {
    bd = bd.times(BigDecimal.fromString('10'))
  }
  return bd
}

export function bigDecimalExp18(): BigDecimal {
  return BigDecimal.fromString('1000000000000000000')
}

export function convertEthToDecimal(eth: BigInt): BigDecimal {
  return eth.toBigDecimal().div(exponentToBigDecimal(BigInt.fromI32(18)))
}

export function convertTokenToDecimal(tokenAmount: BigInt, exchangeDecimals: BigInt): BigDecimal {
  if (exchangeDecimals == ZERO_BI) {
    return tokenAmount.toBigDecimal()
  }
  return tokenAmount.toBigDecimal().div(exponentToBigDecimal(exchangeDecimals))
}

export function equalToZero(value: BigDecimal): boolean {
  const formattedVal = value.toString()
  const zero = ZERO_BD.toString()
  if (zero == formattedVal) {
    return true
  }
  return false
}

export function isNullEthValue(value: string): boolean {
  return value == '0x0000000000000000000000000000000000000000000000000000000000000001'
}

export function fetchTokenSymbol(tokenAddress: Address): string {
  // static definitions overrides
  let staticDefinition = getStaticDefinition(tokenAddress)
  if (staticDefinition != null) {
    return (staticDefinition as TokenDefinition).symbol
  }

  let contract = ERC20.bind(tokenAddress)
  let contractSymbolBytes = ERC20SymbolBytes.bind(tokenAddress)

  // try types string and bytes32 for symbol
  let symbolValue = 'unknown'
  let symbolResult = contract.try_symbol()
  if (symbolResult.reverted) {
    let symbolResultBytes = contractSymbolBytes.try_symbol()
    if (!symbolResultBytes.reverted) {
      // for broken pairs that have no symbol function exposed
      if (!isNullEthValue(symbolResultBytes.value.toHexString())) {
        symbolValue = symbolResultBytes.value.toString()
      }
    }
  } else {
    symbolValue = symbolResult.value
  }

  return symbolValue
}

export function fetchTokenName(tokenAddress: Address): string {
  // static definitions overrides
  let staticDefinition = getStaticDefinition(tokenAddress)
  if (staticDefinition != null) {
    return (staticDefinition as TokenDefinition).name
  }

  let contract = ERC20.bind(tokenAddress)
  let contractNameBytes = ERC20NameBytes.bind(tokenAddress)

  // try types string and bytes32 for name
  let nameValue = 'unknown'
  let nameResult = contract.try_name()
  if (nameResult.reverted) {
    let nameResultBytes = contractNameBytes.try_name()
    if (!nameResultBytes.reverted) {
      // for broken exchanges that have no name function exposed
      if (!isNullEthValue(nameResultBytes.value.toHexString())) {
        nameValue = nameResultBytes.value.toString()
      }
    }
  } else {
    nameValue = nameResult.value
  }

  return nameValue
}

export function fetchTokenTotalSupply(tokenAddress: Address): BigInt {
  if (SKIP_TOTAL_SUPPLY.includes(tokenAddress.toHexString())) {
    return BigInt.fromI32(0)
  }

  let contract = ERC20.bind(tokenAddress)
  let totalSupplyValue = BigInt.fromI32(0)
  let totalSupplyResult = contract.try_totalSupply()
  if (!totalSupplyResult.reverted) {
    totalSupplyValue = totalSupplyResult.value
  }
  return totalSupplyValue
}

export function fetchTokenDecimals(tokenAddress: Address): BigInt {
  // static definitions overrides
  let staticDefinition = getStaticDefinition(tokenAddress)
  if (staticDefinition != null) {
    return (staticDefinition as TokenDefinition).decimals
  }

  let contract = ERC20.bind(tokenAddress)
  // try types uint8 for decimals
  let decimalValue = 0
  let decimalResult = contract.try_decimals()
  if (!decimalResult.reverted) {
    decimalValue = decimalResult.value
  }
  return BigInt.fromI32(decimalValue)
}

export function createUser(address: Address): void {
  let user = User.load(address.toHexString())
  if (!user) {
    user = new User(address.toHexString())
    user.usdSwapped = ZERO_BD

    user.save()
  }
}

/**
 * Convert Bytes to BigInt, with an option for the original data being big-endian or little-endian.
 * @param input - Data of type Bytes
 * @param isBigEndian - true if the data is big-endian (Ethereum logs are typically big-endian)
 * @returns BigInt value
 */
export function parseBytesToBigInt(input: Bytes, isBigEndian: boolean): BigInt {
  let bytes = input
  if (isBigEndian) {
    // If it's big-endian, reverse the bytes
    let reversed = new Uint8Array(input.length)
    for (let i = 0; i < input.length; i++) {
      reversed[i] = input[input.length - 1 - i]
    }
    bytes = Bytes.fromUint8Array(reversed)
  }

  return BigInt.fromSignedBytes(bytes)
}

export function createDefaultToken(tokenAddress: string): Token {
  let token = new Token(tokenAddress)
  log.info('Creating default token for {}', [tokenAddress])
  token.symbol = fetchTokenSymbol(Address.fromString(tokenAddress))
  token.name = fetchTokenName(Address.fromString(tokenAddress))
  token.totalSupply = fetchTokenTotalSupply(Address.fromString(tokenAddress))
  const decimals = fetchTokenDecimals(Address.fromString(tokenAddress))
  if (decimals === null) {
    token.decimals = BigInt.fromI32(18)
  } else {
    token.decimals = decimals
  }

  token.derivedIP = findEthPerToken(token as Token)
  token.tradeVolume = ZERO_BD
  token.tradeVolumeUSD = ZERO_BD
  token.untrackedVolumeUSD = ZERO_BD
  token.totalLiquidity = ZERO_BD
  token.txCount = ZERO_BI

  return token
}
