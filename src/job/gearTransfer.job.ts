import { Op } from "sequelize";
import { EventData } from "web3-eth-contract";
import config from "../config";
import { BURN_ADDRESS, TOPICS } from "../constant";
import { contract_transfer, getWeb3 } from "../contract/contract";
import AscendHistory from "../model/AscendHistory";
import Gear from "../model/Gear";
import HeroV2 from "../model/Hero.v2";
import TransferHero from "../model/TransferHero";
import { createIfNotExist } from "../service/Common.service";
import { send_message } from "../service/Telegram.Bot";
import { TransferHeroService } from "../service/TransferHero.service";
import { logger } from "../utils/logger";
import { threadPool } from "../utils/parallel";
import { BaseJob } from "./base.job";
import { IGear } from "../model/Gear";
import TransferGear, { ITransferGear } from "../model/TransferGear";

export class HeroTransferJob extends BaseJob {
  process = async (fromBlock: number, toBlock: number) => {
    logger.debug(`${this.name} begin sync block ${fromBlock} - ${toBlock}`);
    let transfer_events = await contract_transfer().getPastEvents("Transfer", {
      fromBlock,
      toBlock,
      topics: [TOPICS.GEAR_TRANSFER],
    });
    let list_issued = await contract_transfer().getPastEvents("mintgear", {
      fromBlock,
      toBlock,
      topics: [TOPICS.MINT_GEAR],
    });

    this.setLatestBlock(fromBlock);
    const list_transfers = transfer_events.find(
      (event) =>
        event.returnValues.from != BURN_ADDRESS &&
        event.returnValues.to != BURN_ADDRESS,
    );
    const list_burned = transfer_events.find(
      (event) => event.returnValues.to == BURN_ADDRESS,
    );

    if (transfer_events.length > 0) {
      this.setLatestBlock(
        transfer_events[transfer_events.length - 1].blockNumber + 1,
      );
    }
    logger.debug(
      `${this.name} end sync block ${fromBlock} - ${this.latestBlock()}`,
    );
  };
  processIssued = async (events: EventData[]) => {
    await threadPool(events, async (event: EventData) => {
      const { tokenId, gearName, gearType, gearClass, gearTier, Owner } =
        event.returnValues;
      const newGear: IGear = {
        block_number: event.blockNumber,
        class: gearClass,
        is_burned: false,
        name: gearName,
        owner: Owner,
        tier: gearTier,
        tier_basic: gearTier,
        token_id: tokenId,
        tx_hash: event.transactionHash,
        type: gearType,
      };
      await createIfNotExist(
        Gear,
        { token_id: tokenId, tx_hash: newGear.tx_hash },
        newGear,
      );

      const web3 = getWeb3();
      const transaction = await web3.eth.getTransaction(event.transactionHash);
      const tx = await web3.eth.getTransactionReceipt(event.transactionHash);

      const newTransfer: ITransferGear = {
        block_number: event.blockNumber,
        buy_on_mp: false,
        create_time: new Date(),
        from_address: BURN_ADDRESS,
        to_address: Owner,
        token_id: tokenId,
        tx_fee: (Number(tx.gasUsed) * Number(transaction.gasPrice)) / 1e18,
        tx_hash: event.transactionHash,
      };

      await createIfNotExist(
        TransferGear,
        {
          tx_hash: event.transactionHash,
          token_id: tokenId,
        },
        newTransfer,
      );
    });
  };
  processTransfer = async (events: EventData[]) => {
    await threadPool(events, async (event: EventData) => {
      const { from, to, tokenId } = event.returnValues;
      await Gear.update(
        {
          owner: to,
        },
        {
          where: { token_id: tokenId },
        },
      );
    });
  };
  processAscend = async (events: EventData[]) => {};
  processBurn = async (events: EventData[]) => {};
}
