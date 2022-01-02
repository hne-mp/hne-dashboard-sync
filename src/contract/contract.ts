import Web3 from "web3";
import { AbiItem } from "web3-utils";
import config from "../config";
import { default as ascendGearNftAbi } from "./abi/AscendGearAbi.json";
import { default as gearNftAbi } from "./abi/GearNftAbi.json";
import { default as heroTransferAbi } from "./abi/HeroesNFT.json";
import { default as heAbi } from "./abi/HeToken.abi.json";
import { default as marketAbi } from "./abi/MarketplaceAbi.json";
import { default as nftPackAbi } from "./abi/PackageNftAbi.json";

export const getWeb3 = () => new Web3(config.rpc);

export const contract_transfer = () =>
  new (getWeb3().eth.Contract)(
    heroTransferAbi as AbiItem[],
    config.CONTRACT.HERO_NFT_ADDRESS,
  );

export const contract_gear = () => {
  return new (getWeb3().eth.Contract)(
    gearNftAbi as AbiItem[],
    config.CONTRACT.GEAR_NFT_ADDRESS,
  );
};
export const contract_gear_ascend = () =>
  new (getWeb3().eth.Contract)(
    ascendGearNftAbi as AbiItem[],
    config.CONTRACT.GEAR_NFT_ASCEND_ADDRESS,
  );

export const contract_he = () =>
  new (getWeb3().eth.Contract)(
    heAbi as AbiItem[],
    config.CONTRACT.HE_TOKEN_ADDRESS,
  );
export const contract_market = () =>
  new (getWeb3().eth.Contract)(
    marketAbi as AbiItem[],
    config.CONTRACT.MARKETPLACE_ADDRESS,
  );

export const contract_pack_nft = () =>
  new (getWeb3().eth.Contract)(
    nftPackAbi as AbiItem[],
    config.CONTRACT.PACK_NFT_CONTRACT_ADDRESS,
  );
