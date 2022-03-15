/* eslint-disable prefer-const */
import { BigInt } from "@graphprotocol/graph-ts";
import { Pair } from "../generated/schema";
import {
  Pair as PairContract,
  Transfer,
  Sync,
} from "../generated/templates/Pair/Pair";
import { ADDRESS_ZERO, getLiquidityPosition } from "./helpers";

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
  let to = event.params.to;

  // get pair and load contract
  let pair = Pair.load(event.address.toHexString());

  // liquidity token amount being transfered
  let value = event.params.value;

  if (!pair) {
    return;
  }

  // mints
  if (from.toHexString() == ADDRESS_ZERO) {
    // update total supply
    pair.totalSupply = pair.totalSupply.plus(value);
    pair.save();
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
    let fromUserLiquidityPosition = getLiquidityPosition(pair, from);
    fromUserLiquidityPosition.liquidityTokenBalance = fromUserLiquidityPosition.liquidityTokenBalance.minus(
      value
    );
    fromUserLiquidityPosition.save();
  }

  if (
    event.params.to.toHexString() != ADDRESS_ZERO &&
    to.toHexString() != pair.id
  ) {
    let toUserLiquidityPosition = getLiquidityPosition(pair, to);
    toUserLiquidityPosition.liquidityTokenBalance = toUserLiquidityPosition.liquidityTokenBalance.plus(
      value
    );
    toUserLiquidityPosition.save();
  }
}

export function handleSync(event: Sync): void {
  let pair = Pair.load(event.address.toHex());
  if (!pair) {
    return;
  }
  pair.reserve0 = event.params.reserve0;
  pair.reserve1 = event.params.reserve1;
  pair.save();
}
