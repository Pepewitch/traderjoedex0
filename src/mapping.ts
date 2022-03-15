import { PairCreated } from "../generated/Factory/Factory";
import { Pair } from "../generated/schema";
import { ZERO_BI } from "./helpers";
import { Pair as PairTemplate } from "../generated/templates";

export function handlePairCreated(event: PairCreated): void {
  let pair = new Pair(event.params.pair.toHexString()) as Pair;
  pair.token0 = event.params.token0;
  pair.token1 = event.params.token1;
  pair.reserve0 = ZERO_BI;
  pair.reserve1 = ZERO_BI;
  pair.totalSupply = ZERO_BI;

  // create the tracked contract based on the template
  PairTemplate.create(event.params.pair);

  pair.save();
}
