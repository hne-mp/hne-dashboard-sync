import axios from "axios";
import { EventData } from "web3-eth-contract";
import config from "../config";
import {
  BURN_ADDRESS,
  SequelizeUniqueConstraintError,
  TOPICS,
} from "../constant";
import { contract_transfer, getWeb3 } from "../contract/contract";
import HeroCheck from "../model/HeroCheck";
import LogsService from "../service/Logs.service";
import { send_message } from "../service/Telegram.Bot";
import { logger } from "../utils/logger";
import { threadPool } from "../utils/parallel";
import { BaseJob } from "./base.job";
const logsService = new LogsService();

export class CheckInGameData extends BaseJob {
  process = async (fromBlock: number, toBlock: number) => {
    logger.debug(`${this.name} begin at block ${fromBlock} - ${toBlock}`);
    const events = await contract_transfer().getPastEvents("Transfer", {
      fromBlock,
      toBlock,
      topics: [TOPICS.HEA_TRANSFER],
    });
    const list_transfer = events.filter(
      (event) => event.returnValues.from === BURN_ADDRESS,
      // ||event.returnValues.to === BURN_ADDRESS,
    );
    this.setLatestBlock(fromBlock);
    const blockchain_height = await getWeb3().eth.getBlockNumber();
    const max = config.HERO_CHECK_PROCESS;
    for (let i = 0; i < list_transfer.length; i += max) {
      const trans = list_transfer[i];
      if (trans.blockNumber > blockchain_height - 100) {
        throw `${this.name} delay 100 block`;
        // return;
      }
      const processList = list_transfer.slice(i, i + max);
      await threadPool(
        processList,
        this.checkInGame,
        config.HERO_CHECK_PROCESS,
      );
      this.setLatestBlock(processList[processList.length - 1].blockNumber);
    }
    if (events.length > 0) {
      this.setLatestBlock(events[events.length - 1].blockNumber + 1);
    }
    logger.debug(
      `${this.name} end at block ${fromBlock} - ${this.latestBlock()}`,
    );
  };

  private async checkInGame(transfer: EventData) {
    let web3 = getWeb3();
    var return_value = transfer.returnValues;
    var check_heroes = [return_value.tokenId];

    const [tx, hero_data] = await Promise.all([
      web3.eth.getTransactionReceipt(transfer.transactionHash),
      contract_transfer().methods.heroesNumber(return_value.tokenId).call(),
    ]);

    //check hero ascend
    if (return_value.to === BURN_ADDRESS) {
      const latestLog = tx.logs[tx.logs.length - 1];
      if (latestLog.topics[0] === TOPICS.ASCEND_TOPIC) {
        const result = web3.eth.abi.decodeParameters(
          ["address", "uint256", "string"],
          latestLog.data,
        );
        check_heroes.push(result[1]);
      }
    }
    for (let j = 0; j < check_heroes.length; j++) {
      let token_id = check_heroes[j];
      let error_message = null;
      let heroObj = {
        token_id: token_id,
        tx_hash: transfer.transactionHash,
        block_number: transfer.blockNumber,
        is_correct: true,
      };

      //hero not burned
      if (hero_data.name) {
        let ingame_hero = (
          await axios.get(`${config.INGAME_HERO_API}/heroes/${token_id}`)
        ).data;
        let externalData = null;
        if (ingame_hero?.externalUrl)
          externalData = (await axios.get(ingame_hero.externalUrl)).data;
        if (!externalData || externalData.errCode) {
          error_message = `[HERO] fail to call external url ${ingame_hero.externalUrl} - response data: ${externalData} . 
          [Detail](${config.INGAME_HERO_API}/heroes/${token_id}).`;
        } else if (
          // ingame_hero.name?.replace(/\W/g, "").toLowerCase() !==
          //   hero_data.name?.replace(/\W/g, "").toLowerCase() ||
          externalData.HeroId !== hero_data.heroesNumber ||
          externalData.Tier !== hero_data.tier ||
          externalData.Race !== hero_data.race ||
          externalData.Class !== hero_data.class
        ) {
          error_message = `[HERO] difference data detected: tokenId: ${token_id},
            ingame data: {
              name: ${ingame_hero.name},
              hero number: ${externalData.HeroId},
              tier: ${externalData.Tier},
              race: ${externalData.Race},
              class: ${externalData.Class}
            },
            onchain data: {
              name: ${hero_data.name},
              hero number: ${hero_data.heroesNumber},
              tier: ${hero_data.tier},
              race: ${hero_data.race},
              class: ${hero_data.class}
            }
            [Detail](${config.INGAME_HERO_API}/heroes/${token_id}).`;
        }
      }
      if (error_message) {
        var logErr: any = await HeroCheck.findOne({
          where: {
            token_id: return_value.tokenId,
            is_correct: false,
          },
        });
        if (!logErr?.token_id) {
          logger.error(error_message);
          heroObj.is_correct = false;
          await logsService.error(error_message);
          await send_message(error_message);
        }
      }
      try {
        await HeroCheck.create(heroObj);
      } catch (error) {
        if (error.name !== SequelizeUniqueConstraintError) {
          throw error;
        }
      }
    }
  }
}
