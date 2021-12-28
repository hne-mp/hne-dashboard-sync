import Web3 from "web3";
import config from "../config";
import { AbiItem } from "web3-utils";
import { default as heroTransferAbi } from "./abi/HeroesNFT.json";
import { default as heAbi } from "./abi/HeToken.abi.json";
import { default as marketAbi } from "./abi/MarketplaceAbi.json";
import { default as nftPackAbi } from "./abi/PackageNftAbi.json";
import { default as sellBoxAbi } from "./abi/SellBoxAbi.json";
import { default as gearNftAbi } from "./abi/GearNftAbi.json";

export const getWeb3 = () => new Web3(config.rpc);

export const contract_transfer = () =>
  new (getWeb3().eth.Contract)(
    heroTransferAbi as AbiItem[],
    config.CONTRACT.HERO_NFT_ADDRESS,
  );

export const contract_gear = () =>
  new (getWeb3().eth.Contract)(
    gearNftAbi as AbiItem[],
    config.CONTRACT.GEAR_NFT_ADDRESS,
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
