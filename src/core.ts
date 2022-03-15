/* eslint-disable prefer-const */
import { BigInt } from "@graphprotocol/graph-ts";
import { Pair } from "../generated/schema";
import {
  Pair as PairContract,
  Transfer,
  Sync,
} from "../generated/templates/Pair/Pair";
import { ADDRESS_ZERO, createUser, createLiquidityPosition } from "./helpers";

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
  let value = event.params.value;

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
    fromUserLiquidityPosition.liquidityTokenBalance = pairContract.balanceOf(
      from
    );
    fromUserLiquidityPosition.save();
  }

  if (
    event.params.to.toHexString() != ADDRESS_ZERO &&
    to.toHexString() != pair.id
  ) {
    let toUserLiquidityPosition = createLiquidityPosition(pair, to);
    toUserLiquidityPosition.liquidityTokenBalance = pairContract.balanceOf(to);
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
