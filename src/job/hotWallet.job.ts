import { EventData } from "web3-eth-contract";
import config from "../config";
import { TOPICS } from "../constant";
import { contract_he, getWeb3 } from "../contract/contract";
import HotWalletTransfer from "../model/HotWalletTransfer";
import { createIfNotExist, updateOrCreate } from "../service/Common.service";
import SystemConfigService from "../service/SystemConfig.service";
import { logger } from "../utils/logger";
import { threadPool } from "../utils/parallel";
import { BaseJob } from "./base.job";

export class HETransferDetect extends BaseJob {
  process = async (fromBlock: number, toBlock: number) => {
    logger.debug(`${this.name} transfer sync block ${fromBlock} - ${toBlock}`);
    let list_transfer = await contract_he().getPastEvents("Transfer", {
      fromBlock,
      toBlock,
    });
    this.setLatestBlock(fromBlock);
    const max = config.HOT_WALLET_PROCESS;
    for (let i = 0; i < list_transfer.length; i += max) {
      const processList = list_transfer.slice(i, i + max);
      await threadPool(processList, this.processTx, config.HOT_WALLET_PROCESS);
      this.setLatestBlock(processList[processList.length - 1].blockNumber);
    }
    logger.debug(
      `${this.name} end sync block ${fromBlock} - ${this.latestBlock()}`,
    );
  };

  processTx = async (transfer: EventData) => {
    const web3 = getWeb3();
    // const contractHe = contract_he();
    const return_value = transfer.returnValues;
    let type = null;
    if (return_value.from === config.ADDRESS.HOT_WALLET_ADDRESS) {
      type = "HOTWALLET";
    } else {
      if (config.ADDRESS.SPEND_FEE.includes(return_value.to)) {
        const tx_receipt = await web3.eth.getTransactionReceipt(
          transfer.transactionHash,
        );
        const latestLog = tx_receipt.logs[tx_receipt.logs.length - 1];
        if (latestLog.topics[0] === TOPICS.SUMMON) {
          type = "SUMMON";
        } else if (latestLog.topics[0] === TOPICS.LIMIT_BREAK) {
          type = "LIMIT_BREAK";
        } else if (latestLog.topics[0] === TOPICS.DEPOSIT) {
          type = "DEPOSIT";
        } else if (latestLog.topics[0] === TOPICS.BUY_SLOT) {
          type = "BUY_SLOT";
        } else if (latestLog.topics[0] === TOPICS.CLAN_MAP) {
          type = "CLAN_MAP";
        } else if (latestLog.topics[0] === TOPICS.EDIT_NAME) {
          type = "EDIT_NAME";
        } else if (latestLog.topics[0] === TOPICS.PURCHASE_ITEM_DUNGEON) {
          type = "PURCHASE_ITEM_DUNGEON";
        } else if (latestLog.topics[0] === TOPICS.REQUEST_HERO) {
          type = "REQUEST_HERO";
        } else if (latestLog.topics[0] === TOPICS.UNION_BLESSING) {
          type = "UNION_BLESSING";
        } else type = "SPEND_FEE";
      }
    }

    if (type != null) {
      const tx = await web3.eth.getTransaction(transfer.transactionHash);
      const txReceipt = await web3.eth.getTransactionReceipt(
        transfer.transactionHash,
      );
      const block = await web3.eth.getBlock(transfer.blockNumber);

      const txFee = (Number(txReceipt.gasUsed) * Number(tx.gasPrice)) / 1e18;
      await createIfNotExist(
        HotWalletTransfer,
        {
          tx_hash: transfer.transactionHash,
          to_address: return_value.to,
        },
        {
          amount: return_value.value / 10 ** 18,
          tx_hash: transfer.transactionHash,
          from_address: return_value.from,
          to_address: return_value.to,
          tx_fee: txFee,
          create_time: Number(block.timestamp) * 10 ** 3,
          block_number: transfer.blockNumber,
          address: transfer.address,
          type: type,
        },
      );
    }
  };
}
