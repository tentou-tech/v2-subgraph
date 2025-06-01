import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts/index'

export const FACTORY_ADDRESS = '0x6d3e2f58954bf4e1d0c4ba26a85a1b49b2e244c6'

export const REFERENCE_TOKEN = '0x1514000000000000000000000000000000000000'
export const STABLE_TOKEN_PAIRS = ['0xbdd2fc284edc7294ba29e3aeccb05dfab681ae07'] // TODO: change to pair with USDT on mainnet

// token where amounts should contribute to tracked volume and liquidity
// usually tokens that many tokens are paired with s
export const WHITELIST: string[] = [
  '0x1514000000000000000000000000000000000000', // WIP
  '0xf1815bd50389c46847f0bda824ec8da914045d14', // USDC.e
  '0x674843c06ff83502ddb4d37c2e09c01cda38cbc8', // USDT
  '0x5267f7ee069ceb3d8f1c760c215569b79d0685ad', // vIP
  '0x855bd6a8c5046d97c4e063e90e40f0f010d5423a', // MUSIC
  '0xd07faed671decf3c5a6cc038dad97c8efdb507c0', // stIP
  '0xbab93b7ad7fe8692a878b95a8e689423437cc500', // WETH
]

export const STABLECOINS: string[] = [
  '0xf1815bd50389c46847f0bda824ec8da914045d14', // Stargate Bridged USDC Story(USDCE)
  '0x674843c06ff83502ddb4d37c2e09c01cda38cbc8', // Bridged stgUSDT(USDT)
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

export const STATIC_TOKEN_DEFINITIONS: TokenDefinition[] = [
  {
    address: Address.fromString('0x1514000000000000000000000000000000000000'),
    symbol: 'WIP',
    name: 'Wrapped IP',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0x0000000000000000000000000000000000000000'),
    symbol: 'IP',
    name: 'IP',
    decimals: BigInt.fromI32(18),
  },
]

export const SKIP_TOTAL_SUPPLY: string[] = []
