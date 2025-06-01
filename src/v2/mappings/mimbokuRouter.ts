import { BigDecimal, BigInt, Bytes, log } from '@graphprotocol/graph-ts'

import { Swap } from '../../../generated/MimbokuRouter/MimbokuRouter'
import { Bundle, MimbokuSwap, Pair, Token, UniswapFactory } from '../../../generated/schema'
import { FACTORY_ADDRESS } from '../../common/chain'
import {
  ADDRESS_ZERO,
  ONE_BI,
  TOPIC_MIMBOKU_SWAP,
  TOPIC_SWAP_V2,
  TOPIC_WITHDRAWAL,
  ZERO_BD,
} from '../../common/constants'
import { convertTokenToDecimal, createDefaultToken, parseBytesToBigInt } from '../../common/helpers'
import { getTrackedVolumeUSD } from '../../common/pricing'

export function handleSwap(event: Swap): void {
  log.info('Handling MimbokuRouter swap event at block {}', [event.block.number.toString()])
  const txHash = event.transaction.hash.toHexString()

  let mimbokuSwap = MimbokuSwap.load(txHash)
  if (mimbokuSwap == null) {
    mimbokuSwap = new MimbokuSwap(txHash)
  }
  const inputToken = event.params.inputToken.toHexString()
  let outputToken = event.params.outputToken.toHexString()

  mimbokuSwap.sender = event.params.sender.toHexString()
  mimbokuSwap.to = event.params.to.toHexString()
  let amountIn = BigInt.fromI64(0)
  let amountOut = BigInt.fromI64(0)
  mimbokuSwap.timestamp = event.block.timestamp
  mimbokuSwap.txHash = txHash
  const txsReceipt = event.receipt
  if (txsReceipt == null) {
    log.info('Tx receipt is null, txHash: {}', [txHash])
  } else {
    for (let i = 0; i < txsReceipt.logs.length; i++) {
      const logs = txsReceipt.logs[i]
      const logTopics = logs.topics
      const logAddress = logs.address
      log.info('Log address: {}', [logAddress.toHexString()])
      log.info('Length topics: {}', [logTopics.length.toString()])

      const topic0 = logTopics[0].toHexString().toLowerCase()
      if (logTopics.length >= 4) {
        if (topic0 == TOPIC_MIMBOKU_SWAP) {
          // The log data contains the non-indexed parameters in the order they appear in the event
          // For Swap event: inputAmount, amountOut, to
          const data = logs.data

          // Convert the data to a hex string and then parse it
          const hexData = data.toHexString()
          // Remove the '0x' prefix
          const cleanHexData = hexData.substring(2)

          // Extract the hex values for each parameter (32 bytes = 64 hex chars)
          const inputAmountHex = Bytes.fromHexString('0x' + cleanHexData.substring(0, 64))
          const amountOutHex = Bytes.fromHexString('0x' + cleanHexData.substring(64, 128))

          // Convert hex strings to BigInt
          // Reverse the bytes to get the correct value in little endian
          const inputAmount = parseBytesToBigInt(inputAmountHex, true)
          const amountOutLocal = parseBytesToBigInt(amountOutHex, true)

          log.info('inputAmount: {}', [inputAmount.toString()])
          log.info('amountOutLocal: {}', [amountOutLocal.toString()])
          amountIn = amountIn.plus(inputAmount)
          amountOut = amountOut.plus(amountOutLocal)
        }
      } else if (logTopics.length == 2) {
        const topic0 = logTopics[0].toHexString().toLowerCase()
        if (topic0 == TOPIC_WITHDRAWAL) {
          log.info('Withdrawal event detected {}', [logAddress.toHexString()])
          outputToken = ADDRESS_ZERO
        }
      }

      if (topic0 == TOPIC_SWAP_V2) {
        const pairAddress = logAddress.toHexString().toLowerCase()

        const factory = UniswapFactory.load(FACTORY_ADDRESS)
        if (factory == null) {
          log.error('Factory not found for pool: {}', [pairAddress])
          return
        }

        const pair = Pair.load(pairAddress)
        if (pair == null) {
          log.error('Pool not found for pool: {}', [pairAddress])
          return
        }

        // The log data contains the non-indexed parameters in the order they appear in the event
        // For Swap event: inputAmount, amountOut, to
        const data = logs.data

        // Convert the data to a hex string and then parse it
        const hexData = data.toHexString()
        // Remove the '0x' prefix
        const cleanHexData = hexData.substring(2)

        // Extract the hex values for each parameter (32 bytes = 64 hex chars)
        const amount0InHex = Bytes.fromHexString('0x' + cleanHexData.substring(0, 64))
        const amount1InHex = Bytes.fromHexString('0x' + cleanHexData.substring(64, 128))
        const amount0OutHex = Bytes.fromHexString('0x' + cleanHexData.substring(128, 192))
        const amount1OutHex = Bytes.fromHexString('0x' + cleanHexData.substring(192, 256))

        // Convert hex strings to BigInt
        // Reverse the bytes to get the correct value in little endian
        const inputAmount0In = parseBytesToBigInt(amount0InHex, true)
        const inputAmount1In = parseBytesToBigInt(amount1InHex, true)
        const outputAmount0Out = parseBytesToBigInt(amount0OutHex, true)
        const outputAmount1Out = parseBytesToBigInt(amount1OutHex, true)

        const token0 = Token.load(pair.token0)
        const token1 = Token.load(pair.token1)
        if (token0 === null || token1 === null) {
          continue
        }
        const amount0In = convertTokenToDecimal(inputAmount0In, token0.decimals)
        const amount1In = convertTokenToDecimal(inputAmount1In, token1.decimals)
        const amount0Out = convertTokenToDecimal(outputAmount0Out, token0.decimals)
        const amount1Out = convertTokenToDecimal(outputAmount1Out, token1.decimals)

        // totals for volume updates
        const amount0Total = amount0Out.plus(amount0In)
        const amount1Total = amount1Out.plus(amount1In)
        // ETH/USD prices
        const bundle = Bundle.load('1')!

        // get total amounts of derived USD and ETH for tracking
        const derivedAmountETH = token1.derivedIP
          .times(amount1Total)
          .plus(token0.derivedIP.times(amount0Total))
          .div(BigDecimal.fromString('2'))
        const derivedAmountUSD = derivedAmountETH.times(bundle.IPPriceUSD)

        // only accounts for volume through white listed tokens
        const trackedAmountUSD = getTrackedVolumeUSD(
          amount0Total,
          token0 as Token,
          amount1Total,
          token1 as Token,
          pair as Pair
        )

        let trackedAmountETH: BigDecimal
        if (bundle.IPPriceUSD.equals(ZERO_BD)) {
          trackedAmountETH = ZERO_BD
        } else {
          trackedAmountETH = trackedAmountUSD.div(bundle.IPPriceUSD)
        }

        // update global values, only used tracked amounts for volume
        const uniswap = UniswapFactory.load(FACTORY_ADDRESS)!
        uniswap.totalVolumeUSD = uniswap.totalVolumeUSD.plus(trackedAmountUSD)
        uniswap.totalVolumeETH = uniswap.totalVolumeETH.plus(trackedAmountETH)
        uniswap.untrackedVolumeUSD = uniswap.untrackedVolumeUSD.plus(derivedAmountUSD)
        uniswap.txCount = uniswap.txCount.plus(ONE_BI)

        uniswap.save()
      }
    }

    let token0 = Token.load(inputToken)
    let token1 = Token.load(outputToken)
    if (token0 === null) {
      log.info('Token0 not found, creating default token {}', [inputToken])
      token0 = createDefaultToken(inputToken)
      token0.save()
    }
    if (token1 === null) {
      log.info('Token1 not found, creating default token {}', [outputToken])
      token1 = createDefaultToken(outputToken)
      token1.save()
    }

    const bundle = Bundle.load('1')!
    const price0USD = token0.derivedIP.times(bundle.IPPriceUSD)
    const price1USD = token1.derivedIP.times(bundle.IPPriceUSD)
    const amountInUSD = convertTokenToDecimal(amountIn, token0.decimals).times(price0USD)
    const amountOutUSD = convertTokenToDecimal(amountOut, token1.decimals).times(price1USD)

    mimbokuSwap.amountIn = amountIn
    mimbokuSwap.amountInUSD = amountInUSD
    mimbokuSwap.tokenIn = inputToken
    mimbokuSwap.amountOut = amountOut
    mimbokuSwap.amountOutUSD = amountOutUSD
    mimbokuSwap.tokenOut = outputToken
    mimbokuSwap.save()
  }
}
