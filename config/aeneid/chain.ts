import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts/index'

export const FACTORY_ADDRESS = '0x6d3e2f58954bf4e1d0c4ba26a85a1b49b2e244c6'

export const REFERENCE_TOKEN = '0x1514000000000000000000000000000000000000'
export const STABLE_TOKEN_PAIRS = ['0xbbe72f551df1dbe7136af12b66866afdbae9dad7']

// token where amounts should contribute to tracked volume and liquidity
export const WHITELIST: string[] = [
  '0x1514000000000000000000000000000000000000', // WIP
  '0xd1fa5456186758b84811b929b4d696178fb56ee3', // USDT
]

export const STABLECOINS = [
  '0xd1fa5456186758b84811b929b4d696178fb56ee3', // USDT
]

// minimum liquidity required to count towards tracked volume for pairs with small # of Lps
export const MINIMUM_USD_THRESHOLD_NEW_PAIRS = BigDecimal.fromString('10000')

// minimum liquidity for price to get tracked
export const MINIMUM_LIQUIDITY_THRESHOLD_ETH = BigDecimal.fromString('1')

export class TokenDefinition {
  address: Address
  symbol: string
  name: string
  decimals: BigInt
}

export const STATIC_TOKEN_DEFINITIONS: TokenDefinition[] = []

export const SKIP_TOTAL_SUPPLY: string[] = []
