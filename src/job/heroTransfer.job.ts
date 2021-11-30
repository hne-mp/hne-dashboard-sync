import { Op } from "sequelize";
import { EventData } from "web3-eth-contract";
import config from "../config";
import { BURN_ADDRESS, TOPICS } from "../constant";
import { contract_transfer, getWeb3 } from "../contract/contract";
import AscendHistory from "../model/AscendHistory";
import HeroV2 from "../model/Hero.v2";
import TransferHero from "../model/TransferHero";
import { createIfNotExist } from "../service/Common.service";
import { logger } from "../utils/logger";
import { threadPool } from "../utils/parallel";
import { BaseJob } from "./base.job";

export class HeroTransferJob extends BaseJob {
  process = async (fromBlock: number, toBlock: number) => {
    logger.debug(`${this.name} begin sync block ${fromBlock} - ${toBlock}`);
    let list_transfer = await contract_transfer().getPastEvents("Transfer", {
      fromBlock,
      toBlock,
    });
    logger.debug(`${this.name} ${list_transfer.length} event detected`);
    this.setLatestBlock(fromBlock);
    const max = config.HERO_TRANSFER_PROCESS;

    for (let i = 0; i < list_transfer.length; i += max) {
      const processList = list_transfer.slice(i, i + max);
      const issueEvents = processList.filter(
        (e) => e.returnValues.from === BURN_ADDRESS,
      );
      const otherEvent = processList.filter(
        (e) => e.returnValues.from !== BURN_ADDRESS,
      );
      await threadPool(
        issueEvents,
        this.processHeroTransfer,
        config.HERO_TRANSFER_PROCESS,
      );
      await threadPool(
        otherEvent,
        this.processHeroTransfer,
        config.HERO_TRANSFER_PROCESS,
      );
      this.setLatestBlock(processList[processList.length - 1].blockNumber);
    }
    // if (list_transfer.length > 0) {
    //   this.setLatestBlock(list_transfer[list_transfer.length - 1].blockNumber);
    // }
    logger.debug(
      `${this.name} end sync block ${fromBlock} - ${this.latestBlock()}`,
    );
  };
  processHeroTransfer = async (transfer: EventData) => {
    const web3 = getWeb3();
    const nftContract = contract_transfer();
    const return_value = transfer.returnValues;
    const transaction = await web3.eth.getTransaction(transfer.transactionHash);
    const tx = await web3.eth.getTransactionReceipt(transfer.transactionHash);
    const block = await web3.eth.getBlock(transfer.blockNumber);

    const updateHero = [];
    let issued_heroes;
    let heroInsert;
    let ascend;
    let transferHistory: any;
    transferHistory = {
      token_id: return_value.tokenId,
      tx_hash: transfer.transactionHash,
      from_address: return_value.from,
      to_address: return_value.to,
      tx_fee: (Number(tx.gasUsed) * Number(transaction.gasPrice)) / 1e18,
      create_time: Number(block.timestamp) * 10 ** 3,
      block_number: transfer.blockNumber,
    };
    //issued
    if (return_value.from === BURN_ADDRESS) {
      const latestLog = tx.logs[tx.logs.length - 1];
      if (latestLog.topics[0] === TOPICS.SUMMON) {
        const result = web3.eth.abi.decodeParameters(
          ["address", "uint256", "string", "string", "string", "string"],
          latestLog.data,
        );
        issued_heroes = {
          token_id: return_value.tokenId,
          type: "SUMMON",
          type_issued: result[5],
        };
      } else {
        issued_heroes = {
          token_id: return_value.tokenId,
          type: "OPEN_PACK",
        };
      }
      const hero_data = await nftContract.methods
        .heroesNumber(issued_heroes.token_id)
        .call();
      heroInsert = {
        token_id: issued_heroes.token_id,
        name: hero_data?.name,
        tier: hero_data?.tier,
        tier_basic: hero_data?.tierBasic,
        uri: hero_data?.uri,
        race: hero_data?.race,
        class: hero_data?.class,
        hero_number: hero_data?.heroesNumber,
        is_burned: false,
        type: issued_heroes.type,
        type_issued: issued_heroes?.type_issued,
        owner: return_value.to,
        tx_hash: transfer.transactionHash,
        block_number: transfer.blockNumber,
      };
    }
    // ascend
    else if (return_value.to === BURN_ADDRESS) {
      const latestLog = tx.logs[tx.logs.length - 1];
      //ascend hero
      if (latestLog.topics[0] === TOPICS.ASCEND_TOPIC) {
        const result = web3.eth.abi.decodeParameters(
          ["address", "uint256", "string"],
          latestLog.data,
        );
        updateHero.push({
          token_id: result[1],
          tier: result[2],
          block_number: transfer.blockNumber,
        });
        ascend = {
          token_id: result[1],
          tier: result[2],
          tx_hash: transfer.transactionHash,
          block_number: transfer.blockNumber,
          timestamp: Number(block.timestamp) * 10 ** 3,
          food: return_value.tokenId,
        };
      }
      //current hero
      updateHero.push({
        token_id: return_value.tokenId,
        is_burned: true,
        owner: return_value.to,
        block_number: transfer.blockNumber,
      });
    } else {
      const latestLog = tx.logs[tx.logs.length - 1];
      if (latestLog.topics[0] === TOPICS.MATCH_TX) {
        transferHistory.buy_on_mp = true;
      }
      updateHero.push({
        token_id: return_value.tokenId,
        owner: return_value.to,
        block_number: transfer.blockNumber,
      });
    }

    if (updateHero.length > 0) {
      for (let i = 0; i < updateHero.length; i++) {
        await HeroV2.update(updateHero[i], {
          where: {
            token_id: updateHero[i].token_id,
            block_number: {
              [Op.lte]: updateHero[i].block_number,
            },
          },
        });
        // if (number < 1) {
        //   try {
        //     await HeroV2.create({
        //       ...updateHero[i],
        //       tx_hash: transfer.transactionHash,
        //     });
        //   } catch (error) {
        //     if (error.name !== SequelizeUniqueConstraintError) {
        //       throw error;
        //     }
        //   }
        // }
        if (updateHero[i].owner)
          logger.debug(
            `${this.name} update owner of ${updateHero[i].token_id} to ${updateHero[i].owner}`,
          );
        else
          logger.debug(
            `${this.name} issued hero ${updateHero[i].token_id} - ${updateHero[i].tier}`,
          );
      }
    }
    if (heroInsert) {
      await createIfNotExist(
        HeroV2,
        {
          token_id: heroInsert.token_id,
          tx_hash: transfer.transactionHash,
        },
        heroInsert,
      );
      logger.debug(`${this.name} issued hero ${heroInsert.token_id}`);
    }
    if (ascend) {
      await createIfNotExist(
        AscendHistory,
        {
          token_id: ascend.token_id,
          tx_hash: transfer.transactionHash,
          food: ascend.food,
        },
        ascend,
      );
      logger.debug(
        `${this.name} issued hero ${ascend.token_id} - ${ascend.tier}`,
      );
    }

    // if (transferHistory) {
    await createIfNotExist(
      TransferHero,
      {
        token_id: return_value.tokenId,
        tx_hash: transfer.transactionHash,
      },
      transferHistory,
    );
    // }
  };
}
