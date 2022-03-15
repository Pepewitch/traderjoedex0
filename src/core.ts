/* eslint-disable prefer-const */
import { BigInt, BigDecimal, store, Address } from "@graphprotocol/graph-ts";
import { Pair, Token } from "../generated/schema";
import {
  Pair as PairContract,
  Transfer,
  Sync,
} from "../generated/templates/Pair/Pair";
import {
  convertTokenToDecimal,
  ADDRESS_ZERO,
  FACTORY_ADDRESS,
  ONE_BI,
  createUser,
  createLiquidityPosition,
  ZERO_BD,
  BI_18,
} from "./helpers";

export function handleTransfer(event: Transfer): void {
  // ignore initial transfers for first adds
  if (
    event.params.to.toHexString() == ADDRESS_ZERO &&
    event.params.value.equals(BigInt.fromI32(1000))
  ) {
    return;
  }

  // user stats
  let from = event.params.from;
  createUser(from);
  let to = event.params.to;
  createUser(to);

  // get pair and load contract
  let pair = Pair.load(event.address.toHexString());
  let pairContract = PairContract.bind(event.address);

  // liquidity token amount being transfered
  let value = convertTokenToDecimal(event.params.value, BI_18);

  if (!pair) {
    return;
  }

  // mints
  if (from.toHexString() == ADDRESS_ZERO) {
    // update total supply
    pair.totalSupply = pair.totalSupply.plus(value);
    pair.save();

    createLiquidityPosition(pair, to);
  }

  // burn
  if (
    event.params.to.toHexString() == ADDRESS_ZERO &&
    event.params.from.toHexString() == pair.id
  ) {
    pair.totalSupply = pair.totalSupply.minus(value);
    pair.save();
  }

  if (from.toHexString() != ADDRESS_ZERO && from.toHexString() != pair.id) {
    let fromUserLiquidityPosition = createLiquidityPosition(pair, from);
    fromUserLiquidityPosition.liquidityTokenBalance = convertTokenToDecimal(
      pairContract.balanceOf(from),
      BI_18
    );
    fromUserLiquidityPosition.save();
  }

  if (
    event.params.to.toHexString() != ADDRESS_ZERO &&
    to.toHexString() != pair.id
  ) {
    let toUserLiquidityPosition = createLiquidityPosition(pair, to);
    toUserLiquidityPosition.liquidityTokenBalance = convertTokenToDecimal(
      pairContract.balanceOf(to),
      BI_18
    );
    toUserLiquidityPosition.save();
  }
}

export function handleSync(event: Sync): void {
  let pair = Pair.load(event.address.toHex());
  if (!pair) {
    return;
  }
  let token0 = Token.load(pair.token0);
  let token1 = Token.load(pair.token1);
  if (!token0 || !token1) {
    return;
  }
  pair.reserve0 = convertTokenToDecimal(event.params.reserve0, token0.decimals);
  pair.reserve1 = convertTokenToDecimal(event.params.reserve1, token1.decimals);
  pair.save();

  token0.save();
  token1.save();
}
