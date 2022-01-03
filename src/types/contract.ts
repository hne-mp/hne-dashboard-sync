export interface ISummonReturnValues {
  Owner: string;
  tokenId: string;
  nameHeroes: string;
  race: string;
  tier: string;
  typeIssue: string;
}
export interface IOpenPackReturnValues {
  Owner: string;
  tokenId: string;
  nameHeroes: string;
  race: string;
  tier: string;
}
export interface IMatchingTxReturnValues {
  contractAddress: string;
  price: string;
  paymentToken: string;
  seller: string;
  buyer: string;
  feeInWei: string;
}

export interface ITransferHeroReturnValues {
  from: string;
  to: string;
  tokenId: string;
}
