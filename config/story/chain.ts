import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts/index'

export const FACTORY_ADDRESS = '0x6d3e2f58954bf4e1d0c4ba26a85a1b49b2e244c6'

export const REFERENCE_TOKEN = '0x1514000000000000000000000000000000000000'
export const STABLE_TOKEN_PAIRS = ['0xc56c1be28a22ced0270a4d2f45753d2b6300c1ae'] // TODO: change to pair with USDT on mainnet

// token where amounts should contribute to tracked volume and liquidity
export const WHITELIST: string[] = [
  '0x1514000000000000000000000000000000000000', // WIP
  '0xf1815bd50389c46847f0bda824ec8da914045d14', // USDT
]

export const STABLECOINS = [
  '0xf1815bd50389c46847f0bda824ec8da914045d14', // USDT
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
