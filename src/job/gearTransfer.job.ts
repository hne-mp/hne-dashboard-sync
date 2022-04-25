import { EventData } from "web3-eth-contract";
import { BURN_ADDRESS, TOPICS } from "../constant";
import {
  contract_gear,
  contract_gear_ascend,
  contract_gear_mint,
  getWeb3,
} from "../contract/contract";
import Gear, { IGear } from "../model/Gear";
import TransferGear, { ITransferGear } from "../model/TransferGear";
import { createIfNotExist } from "../service/Common.service";
import { logger } from "../utils/logger";
import { threadPool } from "../utils/parallel";
import { BaseJob } from "./base.job";

export class GearTransferJob extends BaseJob {
  process = async (fromBlock: number, toBlock: number) => {
    logger.debug(`${this.name} begin sync block ${fromBlock} - ${toBlock}`);
    const transfer_events = await contract_gear().getPastEvents("Transfer", {
      fromBlock,
      toBlock,
      topics: [TOPICS.GEAR_TRANSFER],
    });
    const mint_events = await contract_gear_mint().getPastEvents("mintgear", {
      fromBlock,
      toBlock,
      topics: [TOPICS.MINT_GEAR],
    });
    const ascend_events = await contract_gear_ascend().getPastEvents("ascend", {
      fromBlock,
      toBlock,
      topics: [TOPICS.ASCEND_GEAR],
    });

    this.setLatestBlock(fromBlock);
    const list_transfers = transfer_events.filter(
      (event) =>
        event.returnValues.from != BURN_ADDRESS &&
        event.returnValues.to != BURN_ADDRESS,
    );
    const list_burned = transfer_events.filter(
      (event) => event.returnValues.to == BURN_ADDRESS,
    );

    await this.processIssued(mint_events);
    await this.processTransfer(list_transfers);
    await this.processAscend(ascend_events);
    await this.processBurn(list_burned);

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
    logger.info(`${this.name} issue ${events.length} gears`);
    await threadPool(events, async (event: EventData) => {
      const { tokenId, gearName, gearType, gearClass, gearTier, Owner } =
        event.returnValues;
      logger.info(
        `${this.name} issue ${tokenId} at block ${event.blockNumber}`,
      );
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
      logger.info(
        `${this.name} transfer ${tokenId} to ${to} at block ${event.blockNumber}`,
      );
      await Gear.update(
        {
          owner: to,
        },
        {
          where: { token_id: tokenId },
        },
      );
      const web3 = getWeb3();
      const transaction = await web3.eth.getTransaction(event.transactionHash);
      const tx = await web3.eth.getTransactionReceipt(event.transactionHash);
      
      const newTransfer: ITransferGear = {
        block_number: event.blockNumber,
        buy_on_mp: false,
        create_time: new Date(),
        from_address: from,
        to_address: to,
        token_id: tokenId,
        tx_fee: (Number(tx.gasUsed) * Number(transaction.gasPrice)) / 1e18,
        tx_hash: event.transactionHash,
      };
      const latestLog = tx.logs[tx.logs.length - 1];
      if (
        latestLog.topics[0] === TOPICS.MATCH_TX ||
        latestLog.topics[0] === TOPICS.MATCH_TX_V2 ||
        latestLog.topics[0] === TOPICS.WISH_ITEM
      ) {
        newTransfer.buy_on_mp = true;
      }
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
  processAscend = async (events: EventData[]) => {
    await threadPool(events, async (event: EventData) => {
      const { tokenId, tier } = event.returnValues;
      logger.info(
        `${this.name} ascend ${tokenId} to ${tier} at block ${event.blockNumber}`,
      );
      await Gear.update(
        {
          tier: tier,
        },
        {
          where: { token_id: tokenId },
        },
      );
    });
  };
  processBurn = async (events: EventData[]) => {
    await threadPool(events, async (event: EventData) => {
      const { tokenId, from, to } = event.returnValues;
      logger.info(`${this.name} burn ${tokenId} at block ${event.blockNumber}`);
      await Gear.update(
        {
          is_burned: true,
        },
        {
          where: { token_id: tokenId },
        },
      );
      const web3 = getWeb3();
      const transaction = await web3.eth.getTransaction(event.transactionHash);
      const tx = await web3.eth.getTransactionReceipt(event.transactionHash);

      const newTransfer: ITransferGear = {
        block_number: event.blockNumber,
        buy_on_mp: false,
        create_time: new Date(),
        from_address: from,
        to_address: to,
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
}
