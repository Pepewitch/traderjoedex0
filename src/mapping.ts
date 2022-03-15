import { BigInt } from "@graphprotocol/graph-ts";
import { Factory, PairCreated } from "../generated/Factory/Factory";
import { Pair, Token } from "../generated/schema";
import {
  fetchTokenSymbol,
  fetchTokenDecimals,
  fetchTokenName,
  fetchTokenTotalSupply,
  ZERO_BI,
  ZERO_BD,
} from "./helpers";
import { Pair as PairTemplate } from '../generated/templates'

export function handlePairCreated(event: PairCreated): void {
  // create the tokens
  let token0 = Token.load(event.params.token0.toHexString());
  let token1 = Token.load(event.params.token1.toHexString());

  // fetch info if null
  if (token0 === null) {
    token0 = new Token(event.params.token0.toHexString());
    token0.symbol = fetchTokenSymbol(event.params.token0);
    token0.name = fetchTokenName(event.params.token0);
    token0.totalSupply = fetchTokenTotalSupply(event.params.token0);
    let decimals = fetchTokenDecimals(event.params.token0);

    // bail if we couldn't figure out the decimals
    if (decimals === null) {
      return;
    }

    token0.decimals = decimals;
  }

  // fetch info if null
  if (token1 === null) {
    token1 = new Token(event.params.token1.toHexString());
    token1.symbol = fetchTokenSymbol(event.params.token1);
    token1.name = fetchTokenName(event.params.token1);
    token1.totalSupply = fetchTokenTotalSupply(event.params.token1);
    let decimals = fetchTokenDecimals(event.params.token1);

    // bail if we couldn't figure out the decimals
    if (decimals === null) {
      return;
    }
    token1.decimals = decimals;
  }

  let pair = new Pair(event.params.pair.toHexString()) as Pair;
  pair.token0 = token0.id;
  pair.token1 = token1.id;
  pair.liquidityProviderCount = ZERO_BI;
  pair.createdAtTimestamp = event.block.timestamp;
  pair.createdAtBlockNumber = event.block.number;
  pair.reserve0 = ZERO_BD;
  pair.reserve1 = ZERO_BD;
  pair.totalSupply = ZERO_BD;

  // create the tracked contract based on the template
  PairTemplate.create(event.params.pair);

  // save updated values
  token0.save();
  token1.save();
  pair.save();
}
